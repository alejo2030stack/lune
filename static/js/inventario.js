let esperandoConfirmacion = false
let operacionPendiente = null

document.addEventListener("DOMContentLoaded", () => {

    actualizarInventario()

    // 🔥 iniciar VozMotor solo si existe
    if (typeof VozMotor !== "undefined" && !VozMotor.reconocimiento) {

        VozMotor.iniciar((comando) => {

            comando = comando.toLowerCase().trim()

            document.getElementById("transcripcion").innerText = comando

            // ---------------------------------
            // LIMPIAR INVENTARIO
            // ---------------------------------
            if (
                comando.includes("limpiar inventario") ||
                comando.includes("reiniciar inventario")
            ) {
                VozMotor.hablar("¿Desea limpiar todo el inventario?")
                esperandoConfirmacion = true
                operacionPendiente = { accion: "limpiar" }
                return
            }

            // ---------------------------------
            // CERRAR INVENTARIO
            // ---------------------------------
            if (
                comando.includes("cerrar inventario") ||
                comando.includes("terminar inventario") ||
                comando.includes("finalizar inventario")
            ) {
                VozMotor.hablar("Generando informe de inventario")
                setTimeout(() => {
                    window.location.href = "/inventario/cerrar"
                }, 1500)
                return
            }

            // ---------------------------------
            // VOLVER AL DASHBOARD
            // ---------------------------------
            if (
                comando.includes("inicio") ||
                comando.includes("volver")
            ) {
                VozMotor.hablar("Volviendo al panel principal")
                window.location.href = "/dashboard"
                return
            }

            // ---------------------------------
            // CONFIRMACION
            // ---------------------------------
            if (esperandoConfirmacion) {

                const afirmativos = ["si", "sí", "ok", "dale", "correcto", "confirmar", "hazlo", "ya", "vale"]
                const negativos = ["no", "cancelar", "detener", "olvidalo", "olvídalo", "anular"]

                if (afirmativos.some(p => comando.includes(p))) {

                    VozMotor.hablar("Confirmado")

                    if (operacionPendiente?.accion === "limpiar") {
                        limpiarInventario()
                    } else {
                        confirmarOperacion()
                    }

                } else if (negativos.some(p => comando.includes(p))) {

                    VozMotor.hablar("Operación cancelada")

                } else {

                    VozMotor.hablar("No entendí, diga sí o no")
                    return
                }

                esperandoConfirmacion = false
                operacionPendiente = null
                return
            }

            // ---------------------------------
            // PROCESO NORMAL (IA)
            // ---------------------------------
            procesarComandoIA(comando)
        })
    }
})


// ---------------------------------
// IA: interpretar comando
// ---------------------------------
function procesarComandoIA(comando) {

    fetch("/ia/interpretar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comando })
    })
        .then(res => res.json())
        .then(data => {

            if (!data.ok) {
                VozMotor.hablar("No pude entender el comando")
                return
            }

            const ia = data.data

            const operacion = {
                accion: ia.accion,
                producto: ia.producto,
                cantidad: ia.cantidad,
                confirmacion: true,
                respuesta: `¿${ia.accion} ${ia.cantidad} ${ia.producto}?`
            }

            document.getElementById("respuesta").innerText = operacion.respuesta
            VozMotor.hablar(operacion.respuesta)

            esperandoConfirmacion = true
            operacionPendiente = operacion
        })
        .catch(err => {
            console.error("Error IA:", err)
            VozMotor.hablar("Error al usar inteligencia artificial")
        })
}


// ---------------------------------
// CONFIRMAR OPERACIÓN
// ---------------------------------
function confirmarOperacion() {

    if (!operacionPendiente) return

    fetch("/inventario/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            accion: operacionPendiente.accion,
            producto: operacionPendiente.producto,
            cantidad: operacionPendiente.cantidad
        })
    })
        .then(res => res.json())
        .then(data => {

            document.getElementById("respuesta").innerText = data.respuesta
            VozMotor.hablar(data.respuesta)

            actualizarInventario()

            esperandoConfirmacion = false
            operacionPendiente = null
        })
        .catch(err => {
            console.error("Error:", err)
            VozMotor.hablar("No se pudo confirmar la operación")
        })
}


// ---------------------------------
// ACTUALIZAR INVENTARIO
// ---------------------------------
function actualizarInventario() {

    fetch("/inventario/ver")
        .then(res => res.json())
        .then(data => {

            const tabla = document.getElementById("inventario")
            tabla.innerHTML = ""

            for (let producto in data) {

                const fila = document.createElement("tr")

                const tdProducto = document.createElement("td")
                tdProducto.textContent = producto

                const tdCantidad = document.createElement("td")
                tdCantidad.textContent = data[producto]

                fila.appendChild(tdProducto)
                fila.appendChild(tdCantidad)

                tabla.appendChild(fila)
            }
        })
        .catch(err => console.error("Error inventario:", err))
}


// ---------------------------------
// LIMPIAR INVENTARIO
// ---------------------------------
function limpiarInventario() {

    fetch("/inventario/limpiar", { method: "POST" })
        .then(res => res.json())
        .then(data => {

            document.getElementById("respuesta").innerText = data.respuesta
            VozMotor.hablar(data.respuesta)

            actualizarInventario()

            esperandoConfirmacion = false
            operacionPendiente = null
        })
        .catch(err => {
            console.error(err)
            VozMotor.hablar("No se pudo limpiar el inventario")
        })
}