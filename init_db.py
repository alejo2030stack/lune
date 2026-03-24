import psycopg2
import os

# 🔹 Tomar datos de Render si existen, sino usar local
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_NAME = os.environ.get("DB_NAME", "lune_db")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASS = os.environ.get("DB_PASS", "chile123456")
DB_PORT = int(os.environ.get("DB_PORT", 5432))

def conectar_db():
    try:
        conexion = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        return conexion
    except Exception as e:
        print("Error conectando a la base de datos:", e)
        return None


def init_db():
    conn = conectar_db()
    if not conn:
        print("❌ No se pudo conectar a la DB")
        return

    cursor = conn.cursor()

    # -------------------------------
    # TABLA USUARIOS
    # -------------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(50) NOT NULL
    )
    """)

    # -------------------------------
    # TABLA PRODUCTOS BASE
    # -------------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS productos_base (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL
    )
    """)

    # -------------------------------
    # 🆕 TABLA INVENTARIO TEMPORAL
    # -------------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inventario_temp (
        producto VARCHAR(100) PRIMARY KEY,
        cantidad INTEGER NOT NULL
    )
    """)

    # -------------------------------
    # USUARIO ADMIN
    # -------------------------------
    cursor.execute("""
    INSERT INTO usuarios (usuario, password)
    VALUES ('admin', '1234')
    ON CONFLICT (usuario) DO NOTHING
    """)

    # -------------------------------
    # PRODUCTOS DE EJEMPLO (opcionales)
    # -------------------------------
    productos_ejemplo = ['lomo', 'pollo', 'cerdo', 'chorizo', 'morcilla']
    for p in productos_ejemplo:
        cursor.execute("""
        INSERT INTO productos_base (nombre)
        VALUES (%s)
        ON CONFLICT (nombre) DO NOTHING
        """, (p,))

    # -------------------------------
    # 🔹 PRODUCTOS OFICIALES LUNE
    # -------------------------------
    productos_oficiales = [
        "lomo liso", "tapapecho", "ganso", "asiento", "huachalomo",
        "sobrecostilla", "asado", "abastero", "choclillo", "posta paleta",
        "punta paleta", "posta negra", "posta rosada", "plateada", "punta picana",
        "pollo ganso", "tuto entero", "pechuga entera", "tuto ala", "ala entera",
        "pata", "pana", "contre", "chuleta vetada", "chuleta centro",
        "paleta", "pulpa repasada", "pulpa entera", "costillar aji", "costillar normal"
    ]

    for p in productos_oficiales:
        cursor.execute("""
        INSERT INTO productos_base (nombre)
        VALUES (%s)
        ON CONFLICT (nombre) DO NOTHING
        """, (p,))

    conn.commit()
    cursor.close()
    conn.close()

    print("✅ Base de datos inicializada correctamente con productos oficiales")


if __name__ == "__main__":
    init_db()