

//To be executed when the page is loaded, first simulation
$(document).ready(function(){
    initSimul("test2");
    initJamTools();
})


//Draw a simulation
function initJamTools(){

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
