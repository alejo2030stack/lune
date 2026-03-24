const Conversacion = {

estado:"inicio",

usuario:"",

cambiarEstado(nuevo){

this.estado = nuevo

console.log("Estado:",this.estado)

}

}