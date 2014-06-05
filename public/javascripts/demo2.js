

//To be executed when the page is loaded
$(document).ready(function(){
    $(document).on("simulation_loaded", initMorseTools);
    params.width_function = getMorseSimulWidth;
    initSimul(params.simul_name_demo2);

});
//Draw a simulation
function initMorseTools(){

    //Init the jam button
    $("#morse_button").click(initMorse);
}

function initMorse(){
$("#morse_button,#play_button").attr("disabled", "disabled");
NProgress.start();
    consoleMessage("Analyzing your initials...")
    consoleMessage("Converting to morse...")

    consoleMessage("Taking control of the freeway...")

    var text = $( "#morse_text" ).val().toUpperCase();

    d3.xhr("/morse")
    .header("Content-Type", "application/json")
    .post(JSON.stringify({scenario: params.demo12_scenario, initials : text}), function(error, data) {
        if (error) return console.warn(error);
        $("#morse_button,#play_button").removeAttr("disabled")
            NProgress.done();
            resetSim();
        var morseJson = JSON.parse(data.response);
        params.simul_data = morseJson.visSim;
        params.morse_time = $.map(morseJson.events, function(val){return val.t});
        params.morse = morseJson.events;

        updateSimul();
        //Setting up the modification of play for showing morse code
        params.update_function = morseUpdate;
        consoleMessage("Your jam is ready to be simulated, take a close look");
    });
}

function morseUpdate(){
    if(! params.morse_pause){
        if($( "#time_slider" ).slider( "value" ) == (params.time_length - 1))
            stopSim();
        else{
            $( "#time_slider" ).slider( "value", ($( "#time_slider" ).slider( "value") + 1) );
            updateSimul();
            var i = params.morse_time.indexOf($( "#time_slider" ).slider( "value"));
            if(i > -1){
                params.morse_pause = true;
                showMorse(i);
                setTimeout(morsePlayAgain, params.morse_delay);
            }
            else { if(params.morse_info) unshowMorse();}
        }
    }
}

function morsePlayAgain(){
    if(params.play){
        unshowMorse();
        params.morse_pause = false;
    }
}
function showMorse(i){
    //Drawing Message
    params.morse_info = true;
    d3.select("#morse_message").append("div").attr("id", "temp_message")
      .style('opacity', 0)
    .html("&#8594; " + params.morse[i].letter);


    //Drawing morse code
    d3.select("#simul svg")
           .selectAll("rect.morse")
           .data(params.morse[i].symbols)
           .enter()
           .append("rect")
           .attr("class", "morse")
           .attr("x", function(d){
                return Math.floor(params.position_scale((d.xCenter - d.xWidth / 2.)));
           })
           .attr("y", Math.round(params.height * (1 - params.morse_height_ratio)/2.))
           .attr("width", function(d){
                return Math.round(params.position_scale(d.xWidth));
           })
           .attr("height", Math.round(params.height * params.morse_height_ratio))
           .attr("fill", "black")
           .style("opacity",0);

    d3.selectAll("#simul svg rect.morse, #temp_message").transition().duration(params.morse_delay / 3.0).style('opacity', 1);

}

function unshowMorse(){
    d3.selectAll("#simul svg rect.morse, #temp_message").transition().duration(params.morse_delay / 3.0).style('opacity', 0).remove();
    params.morse_info = false;

}

function getMorseSimulWidth(){
    return getSimulWidth() - 140;

}