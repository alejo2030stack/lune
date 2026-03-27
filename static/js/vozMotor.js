let VozMotor = {

    reconocimiento: null,
    callbackComando: null,
    vozSistema: null,

    bufferFrase: "",
    temporizador: null,

    estado: "apagado",

    iniciar(callback) {

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Tu navegador no soporta reconocimiento de voz");
            return;
        }

        this.callbackComando = callback;

        this.reconocimiento = new SpeechRecognition();
        this.reconocimiento.lang = "es-ES";
        this.reconocimiento.continuous = true;
        this.reconocimiento.interimResults = false;

        // 🟢 MICRO ACTIVO
        this.reconocimiento.onstart = () => {

            this.estado = "escuchando";

            console.log("🟢 mic activo");

            if (typeof microfonoActivo === "function") {
                microfonoActivo();
            }
        };

        // 🧠 BUFFER
        this.reconocimiento.onresult = (event) => {

            let texto = event.results[event.results.length - 1][0].transcript;
            texto = texto.toLowerCase().trim();

            console.log("🎤 fragmento:", texto);

            this.bufferFrase += " " + texto;

            clearTimeout(this.temporizador);

            this.temporizador = setTimeout(() => {

                let fraseFinal = this.bufferFrase.trim();
                this.bufferFrase = "";

                console.log("🧠 frase final:", fraseFinal);

                if (this.callbackComando && fraseFinal.length > 3) {
                    this.callbackComando(fraseFinal);
                }

            }, 600);
        };

        // 🔄 REINICIO (PARPADEO)
        this.reconocimiento.onend = () => {

            console.log("🔄 reiniciando...");

            // ✨ parpadeo
            if (typeof microfonoParpadeo === "function") {
                microfonoParpadeo();
            }

            try {
                this.reconocimiento.start();
            } catch {
                setTimeout(() => {
                    try {
                        this.reconocimiento.start();
                    } catch {}
                }, 200);
            }
        };

        // ⚠️ ERRORES (NO ROMPEN EL SISTEMA)
        this.reconocimiento.onerror = (event) => {

            console.log("⚠ error:", event.error);

            // ✨ parpadeo también
            if (typeof microfonoParpadeo === "function") {
                microfonoParpadeo();
            }

            // ⚡ intentar seguir siempre
            try {
                this.reconocimiento.start();
            } catch {
                setTimeout(() => {
                    try {
                        this.reconocimiento.start();
                    } catch {}
                }, 200);
            }
        };

        // 🚀 iniciar
        try {
            this.reconocimiento.start();
        } catch (e) {
            console.log("Error inicial:", e);
        }

        this.cargarVoz();

        console.log("🎤 VozMotor iniciado");
    },

    // 🔴 DETENER REAL
    detener() {

        this.estado = "apagado";

        try {
            this.reconocimiento.stop();
        } catch {}

        if (typeof microfonoInactivo === "function") {
            microfonoInactivo();
        }

        console.log("🛑 mic detenido");
    },

    // 🔊 VOZ
    cargarVoz() {

        let seleccionar = () => {

            let voces = speechSynthesis.getVoices();

            this.vozSistema = voces.find(v =>
                v.name === "Microsoft Sabina - Spanish (Mexico)"
            );

            if (this.vozSistema) {
                console.log("🔊 voz cargada");
            }
        };

        seleccionar();
        speechSynthesis.onvoiceschanged = seleccionar;
    },

    hablar(texto, modo = "normal") {

        if (!texto) return;

        speechSynthesis.cancel();

        let mensaje = new SpeechSynthesisUtterance(texto);
        mensaje.lang = "es-MX";

        if (this.vozSistema) {
            mensaje.voice = this.vozSistema;
        }

        if (modo === "alegre") {
            mensaje.pitch = 1.5;
            mensaje.rate = 1.2;
        } else if (modo === "alerta") {
            mensaje.pitch = 1.1;
            mensaje.rate = 1;
        } else if (modo === "secreto") {
            mensaje.pitch = 1.0;
            mensaje.rate = 0.9;
        } else {
            mensaje.pitch = 1.3;
            mensaje.rate = 1.1;
        }

        mensaje.volume = 1;

        speechSynthesis.speak(mensaje);
    }
};