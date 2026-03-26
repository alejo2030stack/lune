const Sabina = {

    ultimoComando: "",
    bloqueado: false,

    bienvenida() {
        VozMotor.hablar("Bienvenido al sistema LUNE");
    },

    iniciarLogin() {
        VozMotor.hablar("Dime tu usuario");
        Conversacion.cambiarEstado("esperando_usuario");
    },

    procesar(comando) {

        comando = comando.toLowerCase().trim();

        // 🔥 evitar duplicados
        if (comando === this.ultimoComando) return;
        this.ultimoComando = comando;

        setTimeout(() => this.ultimoComando = "", 1000);

        // 🔥 evitar ejecución múltiple simultánea
        if (this.bloqueado) return;
        this.bloqueado = true;

        console.log("🧠 Sabina:", comando);

        // ⚡ feedback inmediato (clave UX)
        VozMotor.hablar("ok", "secreto");

        // ------------------------------
        // 1️⃣ COMANDOS GLOBALES
        // ------------------------------
        if (this.comandosGlobales(comando)) {
            this.liberar();
            return;
        }

        // ------------------------------
        // 2️⃣ ESTADOS
        // ------------------------------
        if (this.procesarEstados(comando)) {
            this.liberar();
            return;
        }

        // ------------------------------
        // 3️⃣ MÓDULOS
        // ------------------------------
        if (this.procesarModulos(comando)) {
            this.liberar();
            return;
        }

        // ⚠️ fallback
        VozMotor.hablar("No entendí el comando");

        this.liberar();
    },

    liberar() {
        setTimeout(() => {
            this.bloqueado = false;
        }, 300);
    },

    // ------------------------------
    // COMANDOS GLOBALES (OPTIMIZADO)
    // ------------------------------
    comandosGlobales(comando) {

        // ⚡ regex más rápido
        if (/inicio|volver a inicio|ir a inicio/.test(comando)) {

            VozMotor.hablar("Regresando al menú principal");

            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 700);

            return true;
        }

        if (/cerrar inventario|cerrar recepción|terminar inventario|finalizar inventario/.test(comando)) {

            VozMotor.hablar("Generando informe de inventario");

            setTimeout(() => {
                window.location.href = "/inventario/cerrar";
            }, 800);

            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 3000);

            return true;
        }

        return false;
    },

    // ------------------------------
    // ESTADOS (SIN CAMBIOS PERO LIMPIO)
    // ------------------------------
    procesarEstados(comando) {

        switch (Conversacion.estado) {

            case "esperando_usuario":
                Conversacion.usuario = comando;
                verificarUsuario(comando);
                return true;

            case "esperando_password":
                verificarPassword(comando);
                return true;
        }

        return false;
    },

    // ------------------------------
    // MÓDULOS (OPTIMIZADO)
    // ------------------------------
    procesarModulos(comando) {

        if (ModuloInformacion.verificarComando(comando)) {
            ModuloInformacion.activar();
            return true;
        }

        if (comando.includes("tareas")) {

            VozMotor.hablar("Redirigiendo a tareas");

            setTimeout(() => {
                ModuloTareas.activar();
            }, 500);

            return true;
        }

        return false;
    }

};