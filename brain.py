from db import conectar_db
from difflib import get_close_matches
import re

# 🔹 NUEVO
from reportlab.platypus import SimpleDocTemplate, Table
from reportlab.lib.pagesizes import letter
import datetime
import os

# -------------------------------
# VARIABLES GLOBALES
# -------------------------------

lista_productos = []
ultimo_producto = None  # 🔥 FIX IMPORTANTE

# -------------------------------
# LIMPIAR TEXTO (🔥 NUEVO)
# -------------------------------

def limpiar_texto(comando):
    comando = comando.lower().strip()

    palabras_basura = [" de ", " el ", " la ", " los ", " las "]

    for palabra in palabras_basura:
        comando = comando.replace(palabra, " ")

    comando = " ".join(comando.split())

    return comando

# -------------------------------
# PRODUCTOS OFICIALES
# -------------------------------

def cargar_productos_base():

    global lista_productos

    try:
        conn = conectar_db()
        if conn is None:
            print("⚠️ No se pudo conectar a la DB")
            lista_productos = []
            return

        cursor = conn.cursor()
        cursor.execute("SELECT nombre FROM productos_base")
        resultados = cursor.fetchall()
        lista_productos = [fila[0].lower() for fila in resultados]

        cursor.close()
        conn.close()

        print("✅ Productos cargados:", lista_productos)

    except Exception as e:
        print("⚠️ Error cargando productos:", e)
        lista_productos = []

# -------------------------------
# BUSCAR PRODUCTO SIMILAR
# -------------------------------

def buscar_producto(producto):

    coincidencias = get_close_matches(
        producto.lower(),
        lista_productos,
        n=1,
        cutoff=0.5
    )

    return coincidencias[0] if coincidencias else None

# -------------------------------
# DETECTAR ACCION
# -------------------------------

def detectar_accion(comando):

    agregar = ["agregar", "agrega", "sumar", "suma", "poner", "añadir"]
    restar = ["restar", "resta", "quitar", "quita", "sacar", "disminuir"]

    for palabra in restar:
        if palabra in comando:
            return "restar"

    for palabra in agregar:
        if palabra in comando:
            return "agregar"

    return "agregar"

# -------------------------------
# EXTRAER DATOS
# -------------------------------

def extraer_datos(comando):

    global ultimo_producto

    patron = r"(\d+)\s(.+)"
    match = re.search(patron, comando)

    if not match:
        return None, None

    cantidad = int(match.group(1))
    producto = match.group(2).strip()

    # 🔥 MANEJO DE "MAS"
    if producto in ["más", "mas", "más de", "mas de"]:
        if ultimo_producto:
            producto = ultimo_producto
        else:
            return None, None

    return cantidad, producto

# -------------------------------
# PREPARAR OPERACION
# -------------------------------

def preparar_operacion(comando):

    global ultimo_producto

    comando = limpiar_texto(comando)  # 🔥 FIX CLAVE

    accion = detectar_accion(comando)

    cantidad, producto = extraer_datos(comando)

    if not producto:
        return {
            "error": True,
            "respuesta": "No entendí el producto"
        }

    producto_real = buscar_producto(producto)

    if not producto_real:
        return {
            "error": True,
            "respuesta": "Producto no encontrado"
        }

    # 🔥 GUARDAR ULTIMO PRODUCTO
    ultimo_producto = producto_real

    return {
        "confirmacion": True,
        "accion": accion,
        "producto": producto_real,
        "cantidad": cantidad,
        "respuesta": f"¿Desea {accion} {cantidad} de {producto_real}?"
    }

# -------------------------------
# CONFIRMAR OPERACION
# -------------------------------

def confirmar_operacion(accion, producto, cantidad):

    conn = conectar_db()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT cantidad FROM inventario_temp WHERE producto=%s",
        (producto,)
    )

    resultado = cursor.fetchone()
    cantidad_actual = resultado[0] if resultado else 0

    if accion == "agregar":
        nueva_cantidad = cantidad_actual + cantidad
    else:
        nueva_cantidad = cantidad_actual - cantidad

    cursor.execute("""
        INSERT INTO inventario_temp (producto, cantidad)
        VALUES (%s, %s)
        ON CONFLICT (producto)
        DO UPDATE SET cantidad = EXCLUDED.cantidad
    """, (producto, nueva_cantidad))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "respuesta": f"{cantidad} de {producto} registrado"
    }

# -------------------------------
# VER INVENTARIO
# -------------------------------

def obtener_inventario():

    conn = conectar_db()
    cursor = conn.cursor()

    cursor.execute("SELECT producto, cantidad FROM inventario_temp")
    filas = cursor.fetchall()

    cursor.close()
    conn.close()

    return {producto: cantidad for producto, cantidad in filas}

# -------------------------------
# PDF
# -------------------------------

def generar_informe_pdf(inventario):

    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors

    if not os.path.exists("informes"):
        os.makedirs("informes")

    fecha_archivo = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    ruta = f"informes/informe_{fecha_archivo}.pdf"

    styles = getSampleStyleSheet()

    datos = [["Producto", "Cantidad"]]
    total = 0

    for p, c in inventario.items():
        datos.append([p.capitalize(), c])
        total += c

    tabla = Table(datos)
    tabla.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))

    elementos = [
        Paragraph("Informe de Inventario", styles["Title"]),
        Spacer(1, 20),
        tabla,
        Spacer(1, 20),
        Paragraph(f"Total unidades: {total}", styles["Normal"])
    ]

    pdf = SimpleDocTemplate(ruta, pagesize=letter)
    pdf.build(elementos)

    return ruta

# -------------------------------
# LIMPIAR INVENTARIO
# -------------------------------

def limpiar_inventario():

    conn = conectar_db()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM inventario_temp")

    conn.commit()
    cursor.close()
    conn.close()

    return {"respuesta": "Inventario limpiado"}

# -------------------------------
# CERRAR INVENTARIO
# -------------------------------

def cerrar_inventario():

    conn = conectar_db()
    cursor = conn.cursor()

    cursor.execute("SELECT producto, cantidad FROM inventario_temp")
    filas = cursor.fetchall()

    if not filas:
        cursor.close()
        conn.close()
        return None

    inventario = {p: c for p, c in filas}

    ruta_pdf = generar_informe_pdf(inventario)

    cursor.execute("DELETE FROM inventario_temp")
    conn.commit()

    cursor.close()
    conn.close()

    return ruta_pdf