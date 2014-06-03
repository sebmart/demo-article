/* Console
 ********************/
//Write a new message in the console
function consoleMessage(message) {
    $("#sim_console ul").prepend($("<li>").text(message));
}

function clearConsole() {
    $("#sim_console ul").clear();
}

/*Graph Bar
***************************/

//To be filled via JSON
var simul_data;

//Global Parameters
var graph_params = {
//to be modified by hand
    height: 60,
    play_time: 30,

//Automatically set up
    width: getSimulWidth(),
    play : false,
    playSim : void 0,
    simul_data : void 0,
    position_scale : void 0,
    space_length : void 0,
    time_length : void 0,

}

//fetch and draw the data
function initSimul(simulName){
    var data; // a global
    d3.json("simulation/" + simulName + ".json", function(error, json) {
      if (error) return console.warn(error);
      graph_params.simul_data = json;
      drawSimul();
    });
}


//return the width of the simulation (depend on the window size)
function getSimulWidth(){ return $("#simul").width()}

//Return the color given the density (Don't accept negative densities !)
function densityColors(dens,i){
    critical_density = graph_params.simul_data.criticalDensity[i];
    max_density = graph_params.simul_data.maxDensity[i];
    if(dens < critical_density)
        return "hsl(90,69%," +  40 *( 2 - dens/critical_density)+"%)";
    else
        return "hsl(" + 90 * (max_density - dens)/(max_density - critical_density) + ",69%," + (50  - 10 * (dens - critical_density)/(max_density - critical_density)) + "%)"
}

//Draw a simulation
function drawSimul(){

    graph_params.space_length = graph_params.simul_data.density[0].length;
    graph_params.time_length = graph_params.simul_data.density.length;

    //Init the slider
    $( "#time_slider" ).slider({ animate: "fast",
                                 max: (graph_params.time_length - 1),
                                 min: 0,
                                 slide: function( event, ui ) {updateSimul()}});
    //Init the play button
    $("#play_button").click(playSimul);
    //Drawing the svg
    var svg = d3.select("#simul").append("svg");
    svg.attr("width", graph_params.width)
       .attr("height", graph_params.height);

    graph_params.position_scale = d3.scale.linear()
                        .domain([0, graph_params.space_length])
                        .range([0, graph_params.width]);

    svg.selectAll("rect")
       .data(graph_params.simul_data.density[0])
       .enter()
       .append("rect")
       .attr("x", function(d,i){;
            return Math.floor(graph_params.position_scale(i));
       })
       .attr("y", 0)
       .attr("width", graph_params.width/graph_params.space_length +1)
       .attr("height", graph_params.height)
       .attr("fill", function(d,i) {
           return densityColors(d,i);
       });
        $( window ).resize(function() {
            resizeSimul();
        });
    consoleMessage("Simulation loaded");
    $.event.trigger({
    	type: "simulation_loaded"
    });
}

//Called when the slider is moving
function updateSimul(){
    var time = $( "#time_slider" ).slider( "value" );

    d3.select("#simul svg")
      .selectAll("rect")
       .data(graph_params.simul_data.density[time])
       .transition()
       .attr("fill", function(d,i) {
           return densityColors(d,i);
       });

}

//Called when the size of the window is changing
function resizeSimul(){
    graph_params.width = getSimulWidth();

    graph_params.position_scale = d3.scale.linear()
                            .domain([0, graph_params.space_length])
                            .range([0, graph_params.width]);

    var svg = d3.select("#simul svg");
    svg.attr("width", graph_params.width);

    svg.selectAll("rect")
       .data(graph_params.simul_data.density[$( "#time_slider" ).slider( "value" )])
       .attr("x", function(d,i){;
            return Math.floor(graph_params.position_scale(i));
       })
       .attr("width", graph_params.width/graph_params.space_length+1)
;
}

//Handle the Simulation play

function stopSim() {
    clearInterval(graph_params.playSim);
    graph_params.play = false;
}
function playUpdate(){
    if($( "#time_slider" ).slider( "value" ) == (graph_params.time_length - 1))
        stopSim();
    else{
        $( "#time_slider" ).slider( "value", ($( "#time_slider" ).slider( "value") + 1) );
        updateSimul();
    }
}
//called when play button is clicked
function playSimul(){
    if(graph_params.play)
        stopSim()
    else {
        var time_interval = graph_params.play_time * 1000 / graph_params.time_length;
        graph_params.playSim = setInterval(playUpdate, time_interval);
        graph_params.play = true;
    }
}

