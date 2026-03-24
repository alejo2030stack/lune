const Sabina = {

    bienvenida() {
        VozMotor.hablar("Bienvenido al sistema LUNE");
    },

    iniciarLogin() {
        VozMotor.hablar("Dime tu usuario");
        Conversacion.cambiarEstado("esperando_usuario");
    },

    procesar(comando) {

        comando = comando.toLowerCase().trim();


        // ------------------------------
        // 1️⃣ COMANDOS GLOBALES
        // ------------------------------

        if (this.comandosGlobales(comando)) {
            return;
        }


        // ------------------------------
        // 2️⃣ ESTADOS CONVERSACIONALES
        // ------------------------------

        if (this.procesarEstados(comando)) {
            return;
        }


        // ------------------------------
        // 3️⃣ MÓDULOS
        // ------------------------------

        if (this.procesarModulos(comando)) {
            return;
        }

    },


    // ------------------------------
    // COMANDOS GLOBALES
    // ------------------------------

    comandosGlobales(comando) {

        const palabrasInicio = ["inicio", "volver a inicio", "ir a inicio"];

        if (palabrasInicio.some(p => comando.includes(p))) {

            VozMotor.hablar("Regresando al menú principal");

            window.location.href = "/dashboard";

            return true;
        }


        const palabrasCerrar = [
            "cerrar inventario",
            "cerrar recepción",
            "terminar inventario",
            "finalizar inventario"
        ];

        if (palabrasCerrar.some(p => comando.includes(p))) {

            VozMotor.hablar("Generando informe de inventario");

            window.location.href = "/inventario/cerrar";

            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 3000);

            return true;
        }

        return false;
    },


    // ------------------------------
    // ESTADOS DE CONVERSACIÓN
    // ------------------------------

    procesarEstados(comando) {

        if (Conversacion.estado === "esperando_usuario") {

            Conversacion.usuario = comando;

            verificarUsuario(comando);

            return true;
        }

        if (Conversacion.estado === "esperando_password") {

            verificarPassword(comando);

            return true;
        }

        return false;
    },


    // ------------------------------
    // ACTIVACIÓN DE MÓDULOS
    // ------------------------------

    procesarModulos(comando) {

        if (ModuloInformacion.verificarComando(comando)) {
            ModuloInformacion.activar();
            return true;
        }

        if (comando.includes("tareas")) {

            VozMotor.hablar("Redirigiendo a tareas");

            ModuloTareas.activar();

            return true;
        }

        return false;
    }

};