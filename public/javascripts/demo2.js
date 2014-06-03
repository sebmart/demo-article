

//To be executed when the page is loaded
$(document).ready(function(){
    $(document).on("simulation_loaded", initMorseTools);
    initSimul(params.simul_name);
})
//Draw a simulation
function initMorseTools(){

    //Init the jam button
    $("#morse_button").click(initMorse);
}

function initMorse(){
    consoleMessage("Analyzing your initials...")
    consoleMessage("Converting to morse...")

    consoleMessage("Taking control of the freeway...")

    var text = $( "#morse_text" ).val()

    d3.xhr("/morse")
    .header("Content-Type", "application/json")
    .post(JSON.stringify({scenario: params.demo12_scenario, initials : text}), function(error, data) {
        if (error) return console.warn(error);
        var morseJson = JSON.parse(data.response);
        params.simul_data = morseJson.visSim;
        params.morseEvents = morseJson.events;
        updateSimul();
        consoleMessage("Your jam is ready to be simulated, take a close look");
    });

}