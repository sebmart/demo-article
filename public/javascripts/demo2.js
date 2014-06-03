

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
    consoleMessage("Analysing your initials...")
    consoleMessage("Conversion to morse...")

    consoleMessage("Taking control over the freeway...")

    var text = $( "#morse_text" ).val()

    d3.xhr("/morse")
    .header("Content-Type", "application/json")
    .post(JSON.stringify({scenario: params.demo12_scenario, initials : text}), function(error, data) {
        if (error) return console.warn(error);
        params.simul_data = JSON.parse(data.response);
        updateSimul();
        consoleMessage("Your Jam is ready to be simulated, take a close look");
    });

}