let luzMicrofono = null;

// se ejecuta cuando carga la página
document.addEventListener("DOMContentLoaded", () => {
    luzMicrofono = document.getElementById("luzMicrofono");
});

function microfonoActivo(){

    if(!luzMicrofono) return;

    luzMicrofono.classList.remove("microfono-inactivo");
    luzMicrofono.classList.add("microfono-activo");

}

function microfonoInactivo(){

    if(!luzMicrofono) return;

    luzMicrofono.classList.remove("microfono-activo");
    luzMicrofono.classList.add("microfono-inactivo");

}

function microfonoReiniciando(){

    if(!luzMicrofono) return;

    luzMicrofono.classList.remove("microfono-activo");
    luzMicrofono.classList.remove("microfono-inactivo");

    luzMicrofono.classList.add("microfono-reiniciando");

}