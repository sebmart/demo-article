

//To be executed when the page is loaded, first simulation
$(document).ready(function(){
    $(document).on("simulation_loaded", initJamTools);
    initSimul("test1");
})



//Draw a simulation
function initJamTools(){

    //Init the jams range sliders
    console.info(graph_params.time_length);
    $( "#jam_time_slider" ).slider({ range: true,
                                     animate: "fast",
                                     max: graph_params.time_length - 1,
                                     min: 0,
                                     values : [Math.round((graph_params.time_length - 1)/3.),Math.round((graph_params.time_length - 1)*2/3.)]});
    $( "#jam_space_slider" ).slider({ animate: "fast",
                                     range: true,
                                     max: graph_params.space_length,
                                     min: 0,
                                     values : [Math.round((graph_params.space_length - 1)/3.),Math.round((graph_params.space_length - 1)*2/3.)]});


    consoleMessage("Jam creator loaded");
}
