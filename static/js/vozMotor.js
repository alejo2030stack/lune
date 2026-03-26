let VozMotor = {

    reconocimiento: null,
    callbackComando: null,
    vozSistema: null,

    bufferFrase: "",
    temporizador: null,
    ultimaActividad: Date.now(),

    // 🔥 estado real del micrófono
    isListening: false,

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

        // 🟢 MICRÓFONO ACTIVO REAL
        this.reconocimiento.onstart = () => {

            this.isListening = true;

            console.log("🎤 Micrófono activo");

            if (typeof microfonoActivo === "function") {
                microfonoActivo();
            }

        };

        // 🧠 BUFFER INTELIGENTE (ANTI CORTES)
        this.reconocimiento.onresult = (event) => {

            let texto = event.results[event.results.length - 1][0].transcript;

            texto = texto.toLowerCase().trim();

            console.log("🎤 fragmento:", texto);

            this.ultimaActividad = Date.now();

            this.bufferFrase += " " + texto;

            clearTimeout(this.temporizador);

            this.temporizador = setTimeout(() => {

                let fraseFinal = this.bufferFrase.trim();

                this.bufferFrase = "";

                console.log("🧠 frase final:", fraseFinal);

                if (this.callbackComando && fraseFinal.length > 3) {

                    // 🟡 estado procesando
                    if (typeof microfonoReiniciando === "function") {
                        microfonoReiniciando();
                    }

                    this.callbackComando(fraseFinal);
                }

            }, 600); // 🔥 más rápido y natural

        };

        // 🔄 REINICIO INTELIGENTE (SIN ROMPER UI)
        this.reconocimiento.onend = () => {

    console.log("🎤 sesión finalizada");

    this.isListening = false;

    // ⚡ REINICIO INMEDIATO SIN ESPERA
    try {
        this.reconocimiento.start();
        console.log("⚡ reinicio inmediato");
    } catch (e) {
        console.log("Error reinicio:", e);

        // fallback mínimo
        setTimeout(() => {
            try {
                this.reconocimiento.start();
            } catch {}
        }, 100);
    }

};

        // 🔴 ERROR REAL (único caso rojo)
        this.reconocimiento.onerror = (event) => {

            console.log("⚠ Error en micrófono:", event.error);

            this.isListening = false;

            if (typeof microfonoInactivo === "function") {
                microfonoInactivo();
            }

        };

        this.reconocimiento.start();

        this.cargarVoz();

        console.log("🎤 VozMotor iniciado");

    },

    cargarVoz() {

        let seleccionar = () => {

            let voces = speechSynthesis.getVoices();

            this.vozSistema = voces.find(v =>
                v.name === "Microsoft Sabina - Spanish (Mexico)"
            );

            if (this.vozSistema) {
                console.log("🔊 Voz Sabina cargada");
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
        }
        else if (modo === "alerta") {
            mensaje.pitch = 1.1;
            mensaje.rate = 1;
        }
        else if (modo === "secreto") {
            mensaje.pitch = 1.0;
            mensaje.rate = 0.9;
        }
        else {
            mensaje.pitch = 1.3;
            mensaje.rate = 1.1;
        }

        mensaje.volume = 1;

        speechSynthesis.speak(mensaje);

    }

};