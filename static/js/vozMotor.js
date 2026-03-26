const VozMotor = {

    reconocimiento: null,
    callbackComando: null,
    vozSistema: null,

    isListening: false,
    activo: false, // 🔥 modo activado (wake)

    ultimoResultado: "",

    iniciar(callback) {

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Tu navegador no soporta reconocimiento de voz");
            return;
        }

        this.callbackComando = callback;

        this.reconocimiento = new SpeechRecognition();
        this.reconocimiento.lang = "es-ES";
        this.reconocimiento.continuous = false; // 🔥 control manual
        this.reconocimiento.interimResults = false;

        // --------------------------
        // 🎤 INICIO
        // --------------------------
        this.reconocimiento.onstart = () => {

            this.isListening = true;
            console.log("🎤 escuchando");

            if (typeof microfonoActivo === "function") {
                microfonoActivo();
            }
        };

        // --------------------------
        // 🧠 RESULTADO (OPTIMIZADO)
        // --------------------------
        this.reconocimiento.onresult = (event) => {

            let texto = event.results[0][0].transcript
                .toLowerCase()
                .trim();

            console.log("🎤 escuchado:", texto);

            // 🔥 evitar duplicados
            if (texto === this.ultimoResultado) return;
            this.ultimoResultado = texto;

            setTimeout(() => this.ultimoResultado = "", 1000);

            // --------------------------
            // 🔥 WAKE WORD
            // --------------------------
            if (!this.activo) {

                if (texto.includes("lune")) {

                    this.activo = true;

                    console.log("🟢 LUNE ACTIVADO");

                    this.hablar("te escucho");

                    // volver a escuchar inmediatamente
                    this.iniciarEscucha();
                }

                return;
            }

            // --------------------------
            // 🔥 PROCESAR COMANDO
            // --------------------------
            if (this.callbackComando && texto.length > 2) {

                if (typeof microfonoReiniciando === "function") {
                    microfonoReiniciando();
                }

                this.callbackComando(texto);

                this.activo = false; // 🔴 se desactiva después de comando
            }
        };

        // --------------------------
        // 🔄 FIN (CONTROLADO)
        // --------------------------
        this.reconocimiento.onend = () => {

            this.isListening = false;

            if (typeof microfonoInactivo === "function") {
                microfonoInactivo();
            }

            // 🔥 solo reactivar si NO está en modo activo
            if (!this.activo) {
                setTimeout(() => this.iniciarEscucha(), 300);
            }
        };

        // --------------------------
        // ⚠️ ERROR
        // --------------------------
        this.reconocimiento.onerror = (event) => {

            console.log("⚠️ error mic:", event.error);

            this.isListening = false;

            setTimeout(() => this.iniciarEscucha(), 500);
        };

        this.cargarVoz();

        this.iniciarEscucha();

        console.log("🚀 VozMotor 2.0 listo");
    },

    // --------------------------
    // 🎤 CONTROL MANUAL
    // --------------------------
    iniciarEscucha() {
        if (!this.isListening) {
            try {
                this.reconocimiento.start();
            } catch (e) {
                console.log("⚠️ error start:", e);
            }
        }
    },

    detenerEscucha() {
        if (this.isListening) {
            this.reconocimiento.stop();
        }
    },

    // --------------------------
    // 🔊 VOZ
    // --------------------------
    cargarVoz() {

        const seleccionar = () => {

            let voces = speechSynthesis.getVoices();

            this.vozSistema = voces.find(v =>
                v.name.includes("Sabina") || v.lang.includes("es")
            );

            if (this.vozSistema) {
                console.log("🔊 voz cargada:", this.vozSistema.name);
            }
        };

        seleccionar();
        speechSynthesis.onvoiceschanged = seleccionar;
    },

    hablar(texto, modo = "normal") {

        if (!texto) return;

        speechSynthesis.cancel();

        let mensaje = new SpeechSynthesisUtterance(texto);

        mensaje.lang = "es-ES";

        if (this.vozSistema) {
            mensaje.voice = this.vozSistema;
        }

        // 🎭 estilos de voz
        switch (modo) {
            case "alegre":
                mensaje.pitch = 1.5;
                mensaje.rate = 1.2;
                break;
            case "alerta":
                mensaje.pitch = 1.1;
                mensaje.rate = 1;
                break;
            case "secreto":
                mensaje.pitch = 1.0;
                mensaje.rate = 0.9;
                break;
            default:
                mensaje.pitch = 1.3;
                mensaje.rate = 1.1;
        }

        mensaje.volume = 1;

        speechSynthesis.speak(mensaje);
    }

};