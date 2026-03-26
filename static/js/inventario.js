let esperandoConfirmacion = false
let operacionPendiente = null

// 🔥 evitar múltiples requests simultáneos
let procesando = false

document.addEventListener("DOMContentLoaded", () => {

    actualizarInventario()

    if (typeof VozMotor !== "undefined" && !VozMotor.reconocimiento) {

        VozMotor.iniciar((comando) => {

            comando = comando.toLowerCase().trim()

            document.getElementById("transcripcion").innerText = comando

            // 🔥 evitar doble ejecución
            if (procesando) return
            procesando = true

            // ---------------------------------
            // COMANDOS DIRECTOS
            // ---------------------------------

            if (/limpiar inventario|reiniciar inventario/.test(comando)) {
                VozMotor.hablar("¿Desea limpiar todo el inventario?")
                esperandoConfirmacion = true
                operacionPendiente = { accion: "limpiar" }
                procesando = false
                return
            }

            if (/cerrar inventario|terminar inventario|finalizar inventario/.test(comando)) {
                VozMotor.hablar("Generando informe de inventario")

                procesando = false // 🔥 FIX CLAVE

                setTimeout(() => {
                    window.location.href = "/inventario/cerrar"
                }, 1200)

                return
            }

            if (/inicio|volver/.test(comando)) {
                VozMotor.hablar("Volviendo al panel principal")

                procesando = false // 🔥 FIX CLAVE

                setTimeout(() => {
                    window.location.href = "/dashboard"
                }, 700)

                return
            }

            // ---------------------------------
            // CONFIRMACIÓN
            // ---------------------------------
            if (esperandoConfirmacion) {

                if (/si|sí|ok|dale|correcto|confirmar|hazlo|ya|vale/.test(comando)) {

                    VozMotor.hablar("Confirmado")

                    if (operacionPendiente?.accion === "limpiar") {
                        limpiarInventario()
                    } else {
                        confirmarOperacion()
                    }

                } else if (/no|cancelar|detener|olvidalo|olvídalo|anular/.test(comando)) {

                    VozMotor.hablar("Operación cancelada")

                } else {
                    VozMotor.hablar("Diga sí o no")
                    procesando = false
                    return
                }

                esperandoConfirmacion = false
                operacionPendiente = null
                procesando = false
                return
            }

            // ---------------------------------
            // IA
            // ---------------------------------
            procesarComandoIA(comando)
        })
    }
})


// ---------------------------------
// IA
// ---------------------------------
async function procesarComandoIA(comando) {

    try {
        const res = await fetch("/inventario/procesar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comando })
        })

        const data = await res.json()

        console.log("🧠 backend:", data)

        if (data.error) {
            VozMotor.hablar(data.respuesta || "No entendí")
            procesando = false
            return
        }

        operacionPendiente = {
            accion: data.accion,
            producto: data.producto,
            cantidad: data.cantidad
        }

        document.getElementById("respuesta").innerText = data.respuesta
        VozMotor.hablar(data.respuesta)

        esperandoConfirmacion = true

    } catch (err) {
        console.error(err)
        VozMotor.hablar("Error procesando comando")
    }

    procesando = false
}


// ---------------------------------
// CONFIRMAR OPERACIÓN
// ---------------------------------
async function confirmarOperacion() {

    if (!operacionPendiente) {
        procesando = false
        return
    }

    try {
        const res = await fetch("/inventario/confirmar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(operacionPendiente)
        })

        const data = await res.json()

        document.getElementById("respuesta").innerText = data.respuesta
        VozMotor.hablar(data.respuesta)

        actualizarInventario()

    } catch (err) {
        console.error(err)
        VozMotor.hablar("Error confirmando operación")
    }

    procesando = false
}


// ---------------------------------
// INVENTARIO
// ---------------------------------
async function actualizarInventario() {

    try {
        const res = await fetch("/inventario/ver")
        const data = await res.json()

        const tabla = document.getElementById("inventario")

        let html = ""

        for (let producto in data) {
            html += `
                <tr>
                    <td>${producto}</td>
                    <td>${data[producto]}</td>
                </tr>
            `
        }

        tabla.innerHTML = html

    } catch (err) {
        console.error("Error inventario:", err)
    }
}


// ---------------------------------
// LIMPIAR INVENTARIO
// ---------------------------------
async function limpiarInventario() {

    try {
        const res = await fetch("/inventario/limpiar", { method: "POST" })
        const data = await res.json()

        document.getElementById("respuesta").innerText = data.respuesta
        VozMotor.hablar(data.respuesta)

        actualizarInventario()

    } catch (err) {
        console.error(err)
        VozMotor.hablar("No se pudo limpiar el inventario")
    }

    procesando = false
}