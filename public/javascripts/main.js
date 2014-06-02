/* Console
 ********************/
//Write a new message in the console
function consoleMessage(message) {
    $("#sim_console ul").append($("<li>").text(message));
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
    height: 60,
    play_time: 30
}

//fetch and draw the data
function initSimul(simulName){
    var data; // a global
    console.info("simulation/" + simulName + ".json")
    d3.json("simulation/" + simulName + ".json", function(error, json) {
      if (error) return console.warn(error);
      simul_data = json;
      drawSimul();
    });
}


//return the width of the simulation (depend on the window size)
function getSimulWidth(){ return $("#simul").width()}

//Return the color given the density (Don't accept negative densities !)
function densityColors(dens,i){
    critical_density = simul_data.criticalDensity[i];
    max_density = simul_data.maxDensity[i];
    if(dens < critical_density)
        return "hsl(90,69%," +  40 *( 2 - dens/critical_density)+"%)";
    else
        return "hsl(" + 90 * (max_density - dens)/(max_density - critical_density) + ",69%," + (50  - 10 * (dens - critical_density)/(max_density - critical_density)) + "%)"
}

//Draw a simulation
function drawSimul(){

    var w = getSimulWidth();
    var space_length = simul_data.density[0].length;
    var time_length = simul_data.density.length;

    //Init the slider
    $( "#time_slider" ).slider({ animate: "fast",
                                 max: (time_length - 1),
                                 min: 0,
                                 slide: function( event, ui ) {updateSimul()}});
    //Init the play button
    $("#play_button").click(playSimul);
    //Drawing the svg
    var svg = d3.select("#simul").append("svg");
    svg.attr("width", w)
       .attr("height", graph_params.height);

    var position_scale = d3.scale.linear()
                        .domain([0, space_length])
                        .range([0, w]);

    svg.selectAll("rect")
       .data(simul_data.density[0])
       .enter()
       .append("rect")
       .attr("x", function(d,i){;
            return Math.floor(position_scale(i));
       })
       .attr("y", 0)
       .attr("width", w/space_length +1)
       .attr("height", graph_params.height)
       .attr("fill", function(d,i) {
           return densityColors(d,i);
       });
        $( window ).resize(function() {
            resizeSimul();
        });
    consoleMessage("Simulation loaded");
}

//Called when the slider is moving
function updateSimul(){

    var w = getSimulWidth();
    var space_length = simul_data.density[0].length;
    var time = $( "#time_slider" ).slider( "value" );
    var position_scale = d3.scale.linear()
                                .domain([0, space_length])
                                .range([0, w]);

    d3.select("#simul svg")
      .selectAll("rect")
       .data(simul_data.density[time])
       .transition()
       .attr("fill", function(d,i) {
           return densityColors(d,i);
       });

}

//Called when the size of the window is changing
function resizeSimul(){
    var w = getSimulWidth();
    var space_length = simul_data.density[0].length;

    var position_scale = d3.scale.linear()
                            .domain([0, space_length])
                            .range([0, w]);

    var svg = d3.select("#simul svg");
    svg.attr("width", w);

    svg.selectAll("rect")
       .data(simul_data.density[$( "#time_slider" ).slider( "value" )])
       .attr("x", function(d,i){;
            return Math.floor(position_scale(i));
       })
       .attr("width", w/space_length+1)
;
}

//Handle the Simulation play
var play = false;
var playSim;
function stopSim() {
    clearInterval(playSim);
    play = false;
}
function playUpdate(){
    var time_length = simul_data.density.length;
    if($( "#time_slider" ).slider( "value" ) == (time_length - 1))
        stopSim();
    else{
        $( "#time_slider" ).slider( "value", ($( "#time_slider" ).slider( "value") + 1) );
        updateSimul();
    }
}
//called when play button is clicked
function playSimul(){
    if(play)
        stopSim()
    else {
        var time_length = simul_data.density.length;
        var time_interval = graph_params.play_time * 1000 / time_length;
        playSim = setInterval(playUpdate, time_interval);
        play = true;

    }
}

