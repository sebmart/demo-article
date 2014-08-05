$(document).ready(function(){
//Initialize sliders and infos providers
    [1,2,3,4].forEach(function(i){
        $( "#slider" + i.toString() ).slider({animate: "fast", min: 0, max: 800, slide: function( event, ui ) {cmWriteValues(i);}});
    });

    cmInitSimulation();
    $("#run_sim").click(function(){cmRunSimulation();});
    $("#grid_sim").click(function(){cmRunGrid();});
});

var cm_params = {
    //demo3
    paint_width : 800,
    paint_height : 600,

    time_scale : void 0,
    driver_path : void 0,
    driver_path_bis : void 0,
    obj_values : [[],[],[],[]],

    grid : [0,0,0,16],
    scale : [1000/9.10,1000 / 0.7885248089861306,1000 / 6.60206309814186,1000 / 44.26832615991998]


}

function cmDrawDriverPath(){
    var driver_line = d3.svg.line()
        .interpolate("basis")
        .x(function(d) {return d.t_origin*4*(cm_params.paint_width-1)/(params.time_length); })
        .y(function(d) { return (1 - d.x_origin/params.space_length)*(cm_params.paint_height - 1);});
    var svg = d3.select("#cmSpacetime svg");
    var curve = svg.select("#driver_path");
    if (curve.empty())
        curve = svg.append("path").attr("id", "driver_path");
    curve.attr("d", driver_line(cm_params.driver_path))
         .attr("fill","none")
         .attr("stroke","blue")
         .attr("stroke-width","3");

}

function cmDrawDriverPathBis(){
    var driver_line = d3.svg.line()
        .interpolate("basis")
        .x(function(d) {return d.t_origin*4*(cm_params.paint_width-1)/(params.time_length); })
        .y(function(d) { return (1 - d.x_origin/params.space_length)*(cm_params.paint_height - 1);});
    var svg = d3.select("#cmSpacetime svg");
    svg.append("path")
         .attr("class", "driver_path_bis")
         .attr("d", driver_line(cm_params.driver_path_bis))
         .attr("fill","none")
         .attr("stroke","black")
         .attr("stroke-width","2");

}
function cmDrawSpaceTime(){

    params.space_length = params.simul_data.density[0].length;
    params.time_length = params.simul_data.density.length;
    params.position_scale = d3.scale.linear()
                            .domain([0, params.space_length - 1])
                            .range([cm_params.paint_height - cm_params.paint_height/params.space_length - 1,0])

    cm_params.time_scale = d3.scale.linear()
                            .domain([0, params.time_length])
                            .range([0,cm_params.paint_width]);

    //Drawing the svg
    var svg = d3.select("#cmSpacetime svg");
    if (svg.empty()){
        svg = d3.select("#cmSpacetime").append("svg");
        svg.on('click',function(d){
            cmCreatePath(d3.mouse(this))
        })
    }
    svg.attr("width", cm_params.paint_width)
       .attr("height", cm_params.paint_height);

    var grp = svg.selectAll('g')
        .data(params.simul_data.density)
        .attr('transform', function(d, i) {
            return 'translate(' + cm_params.time_scale(i) + ',0)';
        });

    grp.enter()
       .append('g')
       .attr('transform', function(d, i) {
           return 'translate(' + cm_params.time_scale(i) + ',0)';
       });



    var rect = grp.selectAll("rect")
       .data(function(d){return d;})
       .attr("y", function(d,i){;
                   return Math.floor(params.position_scale(i));
              })
       .attr("x", 0)
       .attr("height", cm_params.paint_height/params.space_length +1)
       .attr("width", cm_params.paint_width/params.time_length + 1)
       .attr("fill", function(d,i) {
          return densityColors(d,i);
       });

    rect.enter()
       .append("rect")
       .attr("y", function(d,i){;
            return Math.floor(params.position_scale(i));
       })
       .attr("x", 0)
       .attr("height", cm_params.paint_height/params.space_length +1)
       .attr("width", cm_params.paint_width/params.time_length + 1)
       .attr("fill", function(d,i) {
           return densityColors(d,i);
       });


}

function cmCreatePath(coord){
    var t = coord[0] * (params.time_length)/(cm_params.paint_width-1);
    var x = Math.floor((cm_params.paint_height - coord[1] - 1) * (params.space_length)/(cm_params.paint_height - 1));

    $("#run_sim").attr("disabled", "disabled");
    d3.xhr("/catchme_path")
    .header("Content-Type", "application/json")
    .post(JSON.stringify({tReal: t, xCell: x}), function(error, data) {
        if (error) return console.warn(error);
        $("#run_sim").removeAttr("disabled");
        cm_params.driver_path_bis = JSON.parse(data.response);
        //Adding a last element to draw the path
        var lastCell = cm_params.driver_path_bis[cm_params.driver_path_bis.length - 1];
        cm_params.driver_path_bis.push({
            x_origin : lastCell.x_origin + lastCell.distance,
            t_origin : lastCell.t_end
        });
        cmDrawDriverPathBis();
    });
}

function cmWriteValues(i){
    $("#value" + i.toString()).text(cm_params.obj_values[cm_params.obj_values.length - 1][i-1]);
    $("#coef" + i.toString()).text($( "#slider" + i.toString() ).slider("value")/8.);
    $("#coefValue" + i.toString()).text((($( "#slider" + i.toString() ).slider("value"))/800.0*cm_params.scale[i-1]*cm_params.obj_values[cm_params.obj_values.length - 1][i-1]).toExponential(2));
}

function cmRunSimulation(){
    $("#run_sim").attr("disabled", "disabled");
    d3.xhr("/catchme_simulation")
    .header("Content-Type", "application/json")
    .post(JSON.stringify({coef1: parseFloat($("#slider1").slider("value"))*cm_params.scale[0]/800.0,
                          coef2: parseFloat($("#slider2").slider("value"))*cm_params.scale[1]/800.0,
                          coef3: parseFloat($("#slider3").slider("value"))*cm_params.scale[2]/800.0,
                          coef4: parseFloat($("#slider4").slider("value"))*cm_params.scale[3]/800.0}),
    function(error, data) {
        if (error) return console.warn(error);
        $("#run_sim").removeAttr("disabled");
        var temp = JSON.parse(data.response);
        params.simul_data = temp.sim;
        cm_params.driver_path = temp.driverSteps;
        var lastCell = cm_params.driver_path[cm_params.driver_path.length - 1];
        cm_params.driver_path.push({
            x_origin : lastCell.x_origin + lastCell.distance,
            t_origin : lastCell.t_end
        });

        cm_params.obj_values.push(temp.values);
        for (var i = 1; i <= 4; i++)
             cmWriteValues(i);
        cmSaveValues();
        cmDrawSpaceTime();
        cmDrawDriverPath();
        d3.selectAll("#cmSpacetime svg .driver_path_bis").remove();

    });
}

function gridScale(){
    return [cm_params.grid[0]/16.0 * cm_params.scale[0] , cm_params.grid[1]/16.0 * cm_params.scale[1],cm_params.grid[2]/16.0 * cm_params.scale[2],cm_params.grid[3]/16.0 * cm_params.scale[3]];
}


function cmRunGrid(){
    $("#run_sim").attr("disabled", "disabled");


    d3.xhr("/catchme_grid")
    .header("Content-Type", "application/json")
    .post(JSON.stringify({coefs : {coef1: parseFloat(gridScale()[0]),
                                   coef2: parseFloat(gridScale()[1]),
                                   coef3: parseFloat(gridScale()[2]),
                                   coef4: parseFloat(gridScale()[3])},
                          values: {coef1: cm_params.obj_values[cm_params.obj_values.length - 1][0],
                                   coef2: cm_params.obj_values[cm_params.obj_values.length - 1][1],
                                   coef3: cm_params.obj_values[cm_params.obj_values.length - 1][2],
                                   coef4: cm_params.obj_values[cm_params.obj_values.length - 1][3]},
                          svg   :  d3.select("#cmSpacetime").html()}),
    function(error, data) {
        if (error) return console.warn(error);
        $("#run_sim").removeAttr("disabled");
        var temp = JSON.parse(data.response);
        params.simul_data = temp.sim;
        cm_params.driver_path = temp.driverSteps;
        var lastCell = cm_params.driver_path[cm_params.driver_path.length - 1];
        cm_params.driver_path.push({
            x_origin : lastCell.x_origin + lastCell.distance,
            t_origin : lastCell.t_end
        });

        cm_params.obj_values.push(temp.values);

        var ligne = d3.select("#cmResults tbody").append("tr");
        for (var i = 0; i <= 3; i++){
            ligne.append("td").text(gridScale()[i]);
            ligne.append("td").text(cm_params.obj_values[cm_params.obj_values.length - 1][i]);
        }
                d3.selectAll("#cmSpacetime svg .driver_path_bis").remove();

        cmDrawSpaceTime();
        cmDrawDriverPath();

        var endGrid = false;
        if(cm_params.grid[2] >= 16 -  cm_params.grid[1]){
            cm_params.grid[2] = 0;
            if(cm_params.grid[1] >= 16){
                endGrid = true;
                d3.xhr("/catchme_grid")
                .header("Content-Type", "application/json")
                .post(JSON.stringify({coefs : {coef1: 0,coef2: 0,coef3: 0,coef4: 0},
                                      values: {coef1: 0,coef2: 0,coef3: 0,coef4: 0},
                                      svg   :  d3.select("#cmSpacetime").html()}),
                function(error, data) {});
            }
            else
                cm_params.grid[1]++;
        }
        else
            cm_params.grid[2]++;

        cm_params.grid[3] = 16 -  cm_params.grid[1] - cm_params.grid[2];
        if(!endGrid)
            $("#grid_sim").trigger("click");
    });



    $("#run_sim").removeAttr("disabled");
}

//function cmInitSimulation(){
//    $("#run_sim").attr("disabled", "disabled");
//    d3.json("/catchme_init", function(error, data) {
//        if (error) return console.warn(error);
//        $("#run_sim").removeAttr("disabled");
//        params.simul_data = data.sim;
//        cm_params.driver_path = data.driverSteps;
//        var lastCell = cm_params.driver_path[cm_params.driver_path.length - 1];
//        cm_params.driver_path.push({
//            x_origin : lastCell.x_origin + lastCell.distance,
//            t_origin : lastCell.t_end
//        });
//
//        cm_params.obj_values.push(data.values);
//        for (var i = 1; i <= 4; i++)
//            cmWriteValues(i);
//        cmSaveValues();
//        cmDrawSpaceTime();
//        cmDrawDriverPath();
//    });
//}

function cmInitSimulation(){
    $("#run_sim").attr("disabled", "disabled");
    d3.json("/catchme_init", function(error, data) {
        if (error) return console.warn(error);
        $("#run_sim").removeAttr("disabled");
        params.simul_data = data;
        cmDrawSpaceTime();
    });
}

function cmSaveValues(){
    var ligne = d3.select("#cmResults tbody").append("tr");
    for (var i = 1; i <= 4; i++){
        ligne.append("td").text($( "#slider" + i.toString() ).slider("value")/8.);
        ligne.append("td").text(cm_params.obj_values[cm_params.obj_values.length - 1][i-1]);
    }
}

