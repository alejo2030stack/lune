from db import conectar_db
from difflib import get_close_matches
import re

# 🔹 NUEVO
from reportlab.platypus import SimpleDocTemplate, Table
from reportlab.lib.pagesizes import letter
import datetime
import os


# -------------------------------
# PRODUCTOS OFICIALES
# -------------------------------

lista_productos = []

def cargar_productos_base():

    global lista_productos

    try:
        conn = conectar_db()
        if conn is None:
            print("⚠️ No se pudo conectar a la DB, productos base no cargados")
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
        print("⚠️ Error cargando productos base:", e)
        lista_productos = []


# -------------------------------
# INVENTARIO TEMPORAL
# -------------------------------

inventario_temporal = {}


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

    if coincidencias:
        return coincidencias[0]

    return None


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

    # por defecto
    return "agregar"
# -------------------------------
# EXTRAER CANTIDAD Y PRODUCTO
# -------------------------------

def extraer_datos(comando):

    global ultimo_producto

    patron = r"(\d+)\s(.+)"
    match = re.search(patron, comando)

    if not match:
        return None, None

    cantidad = int(match.group(1))
    producto = match.group(2).strip()

    # -------------------------------
    # DETECTAR "MAS"
    # -------------------------------

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

    comando = comando.lower()

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

    elif accion == "restar":
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

    inventario = {}

    for producto, cantidad in filas:
        inventario[producto] = cantidad

    return inventario

# ==================================================
# NUEVO SISTEMA DE INFORME PDF
# ==================================================

def generar_informe_pdf(inventario):
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    import datetime
    import os

    # Crear carpeta si no existe
    if not os.path.exists("informes"):
        os.makedirs("informes")

    # Nombre del archivo con fecha/hora
    fecha_archivo = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    nombre_archivo = f"informe_inventario_{fecha_archivo}.pdf"
    ruta = f"informes/{nombre_archivo}"

    styles = getSampleStyleSheet()

    # --------------------------
    # ENCABEZADO Y PIE DE PAGINA
    # --------------------------
    def encabezado_pie(canvas, doc):
        canvas.saveState()
        # Encabezado
        canvas.setFont("Helvetica-Bold", 10)
        canvas.drawString(40, 750, "LUNE SYSTEM")
        canvas.setFont("Helvetica", 9)
        canvas.drawString(40, 735, "Sistema de Inventario por Voz")

        # Pie de página
        canvas.setFont("Helvetica", 8)
        canvas.drawString(40, 30, "Generado por LUNE | Desarrollado por Alejo")
        canvas.drawRightString(550, 30, f"Página {doc.page}")
        canvas.restoreState()

    # --------------------------
    # TITULO Y FECHA
    # --------------------------
    titulo = Paragraph("Informe de Inventario", styles["Title"])
    fecha_texto = Paragraph(
        f"Fecha: {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}",
        styles["Normal"]
    )

    # --------------------------
    # TABLA CON ESTILO
    # --------------------------
    datos = [["Producto", "Cantidad"]]
    total_unidades = 0

    for producto, cantidad in inventario.items():
        datos.append([producto.capitalize(), cantidad])
        total_unidades += cantidad

    tabla = Table(datos)
    tabla.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
        ('BACKGROUND', (0,1), (-1,-1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))

    # --------------------------
    # RESUMEN AL FINAL
    # --------------------------
    total_productos = len(inventario)
    resumen1 = Paragraph(f"<b>Total de productos distintos:</b> {total_productos}", styles["Normal"])
    resumen2 = Paragraph(f"<b>Total de unidades registradas:</b> {total_unidades}", styles["Normal"])

    # --------------------------
    # ELEMENTOS DEL PDF
    # --------------------------
    elementos = [
        titulo,
        Spacer(1, 20),
        fecha_texto,
        Spacer(1, 30),
        tabla,
        Spacer(1, 30),
        resumen1,
        resumen2
    ]

    # --------------------------
    # GENERAR PDF
    # --------------------------
    pdf = SimpleDocTemplate(ruta, pagesize=letter)
    pdf.build(
        elementos,
        onFirstPage=encabezado_pie,
        onLaterPages=encabezado_pie
    )

    return ruta
# -------------------------------
# CERRAR INVENTARIO
# -------------------------------

def limpiar_inventario():

    conn = conectar_db()
    cursor = conn.cursor()

    # borrar todos los registros de la tabla de inventario temporal
    cursor.execute("DELETE FROM inventario_temp")

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "respuesta": "Inventario limpiado"
    }



def cerrar_inventario():

    conn = conectar_db()
    cursor = conn.cursor()

    cursor.execute("SELECT producto, cantidad FROM inventario_temp")
    filas = cursor.fetchall()

    if not filas:
        cursor.close()
        conn.close()
        return None

    inventario = {}

    for producto, cantidad in filas:
        inventario[producto] = cantidad

    ruta_pdf = generar_informe_pdf(inventario)

    cursor.execute("DELETE FROM inventario_temp")
    conn.commit()

    cursor.close()
    conn.close()

    return ruta_pdf
    