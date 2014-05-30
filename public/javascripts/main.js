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

//Global Parameters
var graph_params = {
    width : $("#simul").width(),
    height: 60
}

function drawSimul(){
    //Drawing the svg
    var svg = d3.select("#simul").append("svg")
                                 .attr("width", graph_params.width)
                                 .attr("height", graph_params.height);
}

