// ==============================
// MÓDULOS
// ==============================

const ModuloTareas = {
    activar() {
        VozMotor.hablar("Redirigiendo a tareas...");
        window.location.href = "/tareas";
    }
};

const ModuloInventario = {
    activar() {
        VozMotor.hablar("Abriendo inventario...");
        window.location.href = "/inventario";
    }
};

// ==============================
// INICIALIZACIÓN DE VOZ
// ==============================

window.onload = () => {

    // Iniciar motor de voz
    VozMotor.iniciar((comando) => {

        comando = comando.toLowerCase().trim();

        // --- Comandos globales ---
        const palabrasPresentacion = [
            "presentación",
            "preséntate",
            "introduce",
            "info"
        ];

        if (palabrasPresentacion.some(p => comando.includes(p))) {
            document.getElementById("btn-presentacion")?.click();
            return;
        }

        // -------------------------
        // COMANDO TAREAS
        // -------------------------

        if (comando.includes("tareas")) {
            ModuloTareas.activar();
            return;
        }

        // -------------------------
        // COMANDO INVENTARIO
        // -------------------------

        const palabrasInventario = [
            "inventario",
            "ir a inventario",
            "vamos a inventario",
            "llévame a inventario",
            "llevarme a inventario"
        ];

        if (palabrasInventario.some(p => comando.includes(p))) {
            ModuloInventario.activar();
            return;
        }

        // --- Otros comandos manejados por Sabina ---
        Sabina.procesar(comando);

    });

    // Bienvenida de Sabina
    setTimeout(() => {
        Sabina.bienvenida();
    }, 1500);

};


// ==============================
// FUNCIONES DE LOGIN
// ==============================

function verificarUsuario(nombre) {

    fetch("/verificar_usuario", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            usuario: nombre
        })

    })

    .then(res => res.json())

    .then(data => {

        if (data.existe) {

            VozMotor.hablar("Usuario verificado, dime tu contraseña");

            Conversacion.usuario = nombre;

            Conversacion.cambiarEstado("esperando_password");

        } else {

            VozMotor.hablar("El usuario no existe");

        }

    });

}


function verificarPassword(password) {

    fetch("/verificar_password", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            usuario: Conversacion.usuario,
            password: password
        })

    })

    .then(res => res.json())

    .then(data => {

        if (data.correcto) {

            VozMotor.hablar("Acceso autorizado");

            Conversacion.cambiarEstado("sistema_activo");

        } else {

            VozMotor.hablar("Contraseña incorrecta");

        }

    });

}


// ==============================
// BOTONES VISIBLES
// ==============================

document.addEventListener("DOMContentLoaded", () => {

    // Botón presentación
    document.getElementById("btn-presentacion")?.addEventListener("click", () => {
        ModuloInformacion.activar();
    });

    // Botón tareas
    document.getElementById("btn-tareas")?.addEventListener("click", () => {
        ModuloTareas.activar();
    });

    // Botón inventario
    document.getElementById("btn-inventario")?.addEventListener("click", () => {
        ModuloInventario.activar();
    });

});