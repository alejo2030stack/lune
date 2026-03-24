import psycopg2
import os

def conectar_db():
    try:
        # 🔹 Usa variables de entorno si existen (Render), si no usa tus datos locales
        DB_HOST = os.environ.get("DB_HOST", "localhost")
        DB_NAME = os.environ.get("DB_NAME", "lune_db")
        DB_USER = os.environ.get("DB_USER", "postgres")
        DB_PASS = os.environ.get("DB_PASS", "chile123456")
        DB_PORT = os.environ.get("DB_PORT", 5432)

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


def verificar_usuario(usuario, password):
    conexion = conectar_db()
    if conexion is None:
        return None  # No hay conexión
    cursor = conexion.cursor()

    query = "SELECT * FROM usuarios WHERE usuario=%s AND password=%s"
    cursor.execute(query, (usuario, password))

    resultado = cursor.fetchone()

    cursor.close()
    conexion.close()

    return resultado