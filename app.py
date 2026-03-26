from flask import Flask, render_template, request, redirect, jsonify, send_file
from db import verificar_usuario, conectar_db
import os
from openai import OpenAI

from init_db import init_db

from brain import (
    cargar_productos_base,
    preparar_operacion,
    confirmar_operacion,
    obtener_inventario,
    cerrar_inventario,
    limpiar_inventario
)

# -------------------------------
# APP
# -------------------------------
app = Flask(__name__)

# ⚡ JSON más rápido
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = False

# -------------------------------
# CACHE
# -------------------------------
productos_cache = []

# -------------------------------
# INIT DB SAFE
# -------------------------------
def init_db_safe():
    try:
        init_db()
    except Exception as e:
        print("⚠️ DB init error:", e)

# 🔥 INIT
with app.app_context():
    init_db_safe()
    cargar_productos_base()

print("🚀 Sistema listo: DB + productos cargados")

# 🔥 OPENAI (futuro)
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# -------------------------------
# ROUTES BASE
# -------------------------------
@app.route("/")
def home():
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def login():
    try:
        usuario = request.form["usuario"]
        password = request.form["password"]

        if verificar_usuario(usuario, password):
            return redirect("/dashboard")

        return "❌ Usuario o contraseña incorrectos"

    except Exception as e:
        return f"Error login: {e}"

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/tareas")
def tareas():
    return render_template("tareas.html")

@app.route("/inventario")
def inventario():
    return render_template("inventario.html")

# -------------------------------
# PRODUCTOS (CON CACHE)
# -------------------------------
@app.route("/productos")
def productos():

    global productos_cache

    if not productos_cache:
        try:
            conn = conectar_db()
            cur = conn.cursor()

            cur.execute("SELECT id, nombre FROM productos_base ORDER BY id")
            productos_cache = cur.fetchall()

            cur.close()
            conn.close()

        except Exception as e:
            return f"Error DB productos: {e}"

    return render_template("productos.html", productos=productos_cache)

# -------------------------------
# INVENTARIO
# -------------------------------
@app.route("/inventario/procesar", methods=["POST"])
def procesar_inventario():
    try:
        comando = request.json.get("comando", "")
        return jsonify(preparar_operacion(comando))

    except Exception as e:
        return jsonify({
            "error": True,
            "respuesta": f"Error: {str(e)}"
        })

@app.route("/inventario/confirmar", methods=["POST"])
def confirmar_inventario():
    try:
        data = request.json

        resultado = confirmar_operacion(
            data["accion"],
            data["producto"],
            data["cantidad"]
        )

        return jsonify(resultado)

    except Exception as e:
        return jsonify({
            "error": True,
            "respuesta": str(e)
        })

@app.route("/inventario/ver")
def ver_inventario():
    try:
        return jsonify(obtener_inventario())
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/inventario/limpiar", methods=["POST"])
def limpiar():
    try:
        return jsonify(limpiar_inventario())
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/inventario/cerrar")
def cerrar():
    try:
        pdf = cerrar_inventario()

        if not pdf:
            return "No hay inventario"

        return send_file(pdf, as_attachment=True)

    except Exception as e:
        return f"Error: {e}"

# -------------------------------
# IA (OPCIONAL FUTURO)
# -------------------------------
@app.route("/ia/interpretar", methods=["POST"])
def ia():
    try:
        comando = request.json.get("comando", "")
        return jsonify(preparar_operacion(comando))

    except Exception as e:
        return jsonify({
            "error": True,
            "respuesta": f"Error interno: {str(e)}"
        })

# -------------------------------
# RUN
# -------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)