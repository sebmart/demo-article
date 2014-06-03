

//To be executed when the page is loaded, first simulation
$(document).ready(function(){
    $(document).on("simulation_loaded", initJamTools);
    initSimul(params.simul_name);
})



//Draw a simulation
function initJamTools(){

    //Init the jams range sliders
    $( "#jam_time_slider" ).slider({ range: true,
                                     animate: "fast",
                                     max: params.time_length - 1,
                                     min: 0,
                                     values : [Math.round((params.time_length - 1)/3.),Math.round((params.time_length - 1)*2/3.)]});
    $( "#jam_space_slider" ).slider({ animate: "fast",
                                     range: true,
                                     max: params.space_length,
                                     min: 0,
                                     values : [Math.round((params.space_length - 1)/3.),Math.round((params.space_length - 1)*2/3.)]});

    //Init the jam button
    $("#jam_button").click(initJam);
}

//Load a box jam created with the parameters of the User
function initJam(){
    consoleMessage("....Please wait, we are taking control on the traffic lights to create your jam");
    var xval = $( "#jam_space_slider" ).slider("values");
    var tval = $( "#jam_time_slider" ).slider("values");
    d3.xhr("/jam")
    .header("Content-Type", "application/json")
    .post(JSON.stringify({scenario: params.demo12_scenario, xMin: xval[0], xMax : xval[1], tMin: tval[0], tMax : tval[1]}), function(error, data) {
        if (error) return console.warn(error);
        params.simul_data = JSON.parse(data.response);
        updateSimul();
        consoleMessage("Your Jam is ready to be simulated");
    });

}