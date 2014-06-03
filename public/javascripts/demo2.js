

//To be executed when the page is loaded
$(document).ready(function(){
    $(document).on("simulation_loaded", initMorseTools);
    initSimul(params.simul_name);
})
//Draw a simulation
function initJamTools(){

    //Init the jam button
    $("#morse_button").click(initMorse);
}

function initMorse(){

}