function iniciarSistema(){

    VozMotor.iniciar((comando)=>{

        console.log("Comando recibido:", comando);

        document.getElementById("usuario").value = comando;

        VozMotor.hablar("Usuario recibido. Ahora escribe tu contraseña.");

    });

    VozMotor.hablar("Hola. Soy Lune. Dime tu usuario.");

}