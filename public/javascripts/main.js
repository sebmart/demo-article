/* Console
 ********************/
//Write a new message in the console
function consoleMessage(message) {
    $("#console ul").append($("li").text(message));
}

function clearConsole() {
    $("#console ul").clear();
}

/*Graph Bar
***************************/

//To be sent via JSON
var simul_data  = [1.,1.,.5,.8,1.,1.2,1.5,2.,2.,1.8,1.,1.,0.,0.2,1.,2,2,2,1.8,2,2,1.5,1,1];
var max_density = 2.;
var critical_density = 1.;


//Global Parameters
var graph_params = {
    width : $("#simul").width(),
    height: 60
}

//Return the color given the density (Don't accept negative densities !)
function densityColors(dens){
    if(dens < critical_density)
        return "hsl(90,75%," +  50 *( 2 - dens/critical_density)+"%)";
    else
        return "hsl(" + 90 * (max_density - dens)/(max_density - critical_density) + ",75%,50%)"
}

//Draw a simulation
function drawSimul(){

    graph_params.width = $("#simul").width();

    //Drawing the svg
    var svg = d3.select("#simul svg");
    if (svg.empty())
        svg = d3.select("#simul").append("svg");

    svg.attr("width", graph_params.width)
       .attr("height", graph_params.height);

    var position_scale = d3.scale.linear()
                        .domain([0, simul_data.length])
                        .range([0, graph_params.width]);

    var update = svg.selectAll("rect")
                    .data(simul_data);

    update.exit().remove();
    update.attr("x", function(d,i){;
                return position_scale(i);
           })
           .attr("y", 0)
           .attr("width", graph_params.width/simul_data.length)
           .attr("height", graph_params.height)
           .attr("fill", function(d) {
               return densityColors(d);
           });

    update.enter()
       .append("rect")
       .attr("x", function(d,i){;
            return position_scale(i);
       })
       .attr("y", 0)
       .attr("width", graph_params.width/simul_data.length)
       .attr("height", graph_params.height)
       .attr("fill", function(d) {
           return densityColors(d);
       });

}

