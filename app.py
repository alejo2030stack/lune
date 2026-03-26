from flask import Flask, render_template, request, redirect, jsonify, send_file
from db import verificar_usuario, conectar_db
import os
import json
from datetime import datetime
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

# -------------------------------
# INIT DB SAFE
# -------------------------------
def init_db_safe():
    try:
        init_db()
    except Exception as e:
        print("DB init error:", e)

# 🔥 inicialización correcta (DESPUÉS de definir función)
with app.app_context():
    init_db_safe()
    cargar_productos_base()

print("✅ App inicializada correctamente")

# 🔥 OPENAI (se mantiene para futuro)
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# -------------------------------
# INIT DB SAFE
# -------------------------------

# -------------------------------
# INIT SOLO UNA VEZ
# -------------------------------

# -------------------------------
# ROUTES BASE
# -------------------------------
@app.route("/")
def home():
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def login():
    usuario = request.form["usuario"]
    password = request.form["password"]

    if verificar_usuario(usuario, password):
        return redirect("/dashboard")
    return "❌ Usuario o contraseña incorrectos"

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/tareas")
def tareas():
    return render_template("tareas.html")

@app.route("/inventario")
def inventario():
    return render_template("inventario.html")

@app.route("/productos")
def productos():
    conn = conectar_db()
    cur = conn.cursor()
    cur.execute("SELECT id, nombre FROM productos_base ORDER BY id")
    productos = cur.fetchall()
    cur.close()
    conn.close()
    return render_template("productos.html", productos=productos)

# -------------------------------
# INVENTARIO (FUNCIONANDO SIN IA)
# -------------------------------
@app.route("/inventario/procesar", methods=["POST"])
def procesar_inventario():
    return jsonify(preparar_operacion(request.json["comando"]))

@app.route("/inventario/confirmar", methods=["POST"])
def confirmar_inventario():
    data = request.json
    return jsonify(
        confirmar_operacion(
            data["accion"],
            data["producto"],
            data["cantidad"]
        )
    )

@app.route("/inventario/ver")
def ver_inventario():
    return jsonify(obtener_inventario())

@app.route("/inventario/limpiar", methods=["POST"])
def limpiar():
    return jsonify(limpiar_inventario())

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
# 🤖 IA (AHORA USA TU SISTEMA INTERNO)
# -------------------------------
@app.route("/ia/interpretar", methods=["POST"])
def ia():
    try:
        comando = request.json.get("comando")

        resultado = preparar_operacion(comando)

        return jsonify(resultado)

    except Exception as e:
        return jsonify({
            "error": True,
            "respuesta": f"Error interno: {str(e)}"
        })

# -------------------------------
# RUN LOCAL
# -------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)