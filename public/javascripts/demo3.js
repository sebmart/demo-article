
//To be executed when the page is loaded
$(document).ready(function(){
    $(document).on("simulation_loaded", initSpaceTime);
    params.simul_name = params.paint_simul_name;
    params.update_simul = paintUpdateSimul;
    params.resize_simul = paintResizeSimul;
    initSimul(params.paint_simul_name);
});

function initSpaceTime(){

    params.space_length = params.simul_data.density[0].length;
    params.time_length = params.simul_data.density.length;
    params.width = params.width_function();
    params.paint_height = paintHeight();


    params.vertical_scale = d3.scale.linear()
                            .domain([0, params.time_length])
                            .range([params.paint_height - params.paint_height/params.time_length - 1,0]);

    //Drawing the svg
    var svg = d3.select("#spacetime").append("svg");
    svg.attr("id", "paint")
       .attr("width", params.width)
       .attr("height", params.paint_height);
    svg.append("g").attr("id","paint_slider")
                   .attr('transform', 'translate(0, ' + (- params.vertical_scale(0)) +')');

    var grp = svg.select('#paint_slider').selectAll('g')
        .data(params.simul_data.density)
        .enter()
        .append('g')
        .attr('transform', function(d, i) {
            return 'translate(0, ' + params.vertical_scale(i) + ')';
        });


    grp.selectAll("rect")
       .data(function(d){return d;})
       .enter()
       .append("rect")
       .attr("x", function(d,i){;
            return Math.floor(params.position_scale(i));
       })
       .attr("y", 0)
       .attr("width", params.width/params.space_length +1)
       .attr("height", params.paint_height/params.time_length + 1)
       .attr("fill", function(d,i) {
           return densityColors(d,i);
       });
        if($("#revealBox").checked) {
           d3.select("#spacetime").style("display", "block");
       }
       else
           d3.select("#spacetime").style("display", "none");

        $("#revealBox").change(function() {
            if(this.checked) {
                d3.select("#spacetime").style("display", "block");
            }
            else
                d3.select("#spacetime").style("display", "none");
        });
    consoleMessage("Space and time loaded");
}


function paintUpdateSimul(){
    updateSimul();
    var time = $( "#time_slider" ).slider( "value" );
    d3.select("#paint_slider").attr('transform', 'translate(0, ' +(- params.vertical_scale(time)) +')');

}

function paintResizeSimul(){
    resizeSimul();

    params.paint_height = paintHeight();


    var svg = d3.select("#spacetime svg");
    svg.attr("width", params.width)
       .attr("height", params.paint_height);


    params.vertical_scale = d3.scale.linear()
                            .domain([0, params.time_length])
                            .range([params.paint_height - params.paint_height/params.time_length - 1,0]);

    var grp = svg.select("#paint_slider").selectAll('g')
        .attr('transform', function(d, i) {
            return 'translate(0, ' + params.vertical_scale(i) + ')';
        });


    grp.selectAll("rect")
       .attr("x", function(d,i){;
            return Math.floor(params.position_scale(i));
       })
       .attr("width", params.width/params.space_length +1)
       .attr("height", params.paint_height/params.time_length + 1);

}

function paintHeight(){return params.width_function()/params.paint_ratio;}