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

//Global Parameters
var params = {
//to be modified by hand
   //all simulations
    height: 160,
    play_time: 9,
    simul_name_demo1 : "box-jam-standard",
    real_total_time : 120,

   //control
    control_height : 60,
    control_width : 20,
    control_offset_ratio : .9,
   //demo1
    demo1_scenario : "box-jam",
   //demo2
    morse_delay : 2500,
    morse_height_ratio : .3,
    simul_name_demo2 : "morse",
    demo2_scenario : "morse",

   //demo3
    paint_ratio : 16./9.,
    paint_simul_name : "sideways-cal",

    // density color hack
    densityColorFactor : 1.0,


//Automatically set up
    width: getSimulWidth(),
    play : false,
    morse_pause : false,
    playSim : void 0,
    simul_data : void 0,
    position_scale : void 0,
    vertical_scale : void 0,
    space_length : void 0,
    time_length : void 0,
    morse_time : void 0,
    morse : void 0,
    morse_info : false,
    update_function : playUpdate,
    update_simul : updateSimul,
    resize_simul : resizeSimul,
    width_function : getSimulWidth,
    paint_height : void 0

}

//fetch and draw the data
function initSimul(simulName){
    d3.json("simulation/" + simulName + ".json", function(error, json) {
      if (error) return console.warn(error);
      params.simul_data = json;
      drawSimul();
    });
}


//return the width of the simulation (depend on the window size)
function getSimulWidth(){ return $("#simul_container").width()}

function hslToRgb(h, s, l){
    h = h/360;
    s = s/100;
    l = l/100;
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return "rgb("+ Math.round(r * 255) + "," + Math.round(g * 255) + "," + Math.round(b * 255) + ")";
}

//Return the color given the density (Don't accept negative densities !)
function densityColors(dens,i){
    critical_density = params.simul_data.criticalDensity[i] * params.densityColorFactor;
    max_density = params.simul_data.maxDensity[i];
//    return hslToRgb(90 * (1 - dens/max_density),100,50)
//    if(dens < critical_density)
//        return "hsl(90,100%," +  40 *( 2 - dens/critical_density)+"%)";
//    else
//        return "hsl(" + 90 * (max_density - dens)/(max_density - critical_density) + ",100%," + (50  - 10 * (dens - critical_density)/(max_density - critical_density)) + "%)"
//
    if(dens < 0.9 * critical_density)
        return hslToRgb(90,100,50 + 30 *( 1 - dens/(0.9*critical_density)));
    else if(dens < critical_density)
       return hslToRgb(90 - 40 * (dens - 0.9 * critical_density)/(critical_density - 0.9 * critical_density),100,50);
    else if(dens < critical_density * 1.1)
       return hslToRgb((50 - 20 * (dens - critical_density)/(1.1 * critical_density - critical_density)),100,50);
    else
       return hslToRgb(30 * (max_density - dens)/(max_density - critical_density * 1.1),100,(50  - 30 * (dens - critical_density)/(max_density - critical_density * 1.1)));
}

function controlRedColor(control){if (control < 1.0/6.0) return "hsl(0,100%,42%)"; else return "hsl(0,40%,15%)"; }
function controlOrangeColor(control){if (control >= 1.0/6.0 && control <= 1./2.0) return "hsl(33,100%,42%)"; else return "hsl(33,40%,15%)"; }
function controlGreenColor(control){if (control > 1.0/2.0) return "hsl(120,100%,42%)"; else return "hsl(120,40%,15%)"; }

//Draw a simulation
function drawSimul(){

    params.space_length = params.simul_data.density[0].length;
    params.time_length = params.simul_data.density.length;
    params.width = params.width_function();
    params.position_scale = d3.scale.linear()
                            .domain([0, params.space_length])
                            .range([0, params.width]);

    //Drawing the svg
    var svg = d3.select("#simul").append("svg");
    svg.attr("width", params.width)
       .attr("height", params.height);

    svg.append("defs")
           .append("pattern")
                .attr("id", "road")
                .attr("width","160")
                .attr("height","160")
                .attr("patternUnits","userSpaceOnUse")
                .append("image")
                    .attr("width","160px")
                    .attr("height","160px")
                    .attr("xlink:href", "/assets/images/bigroad.png");


    svg.selectAll("rect")
       .data(params.simul_data.density[0])
       .enter()
       .append("rect")
       .attr("x", function(d,i){;
            return Math.floor(params.position_scale(i));
       })
       .attr("y", 0)
       .attr("width", params.width/params.space_length +1)
       .attr("height", params.height)
       .attr("fill", function(d,i) {
           return densityColors(d,i);
       });
    svg.append("rect")
        .attr("id", "road_background")
        .attr("width", params.width)
        .attr("height", params.height)
        .attr("fill", "url(#road)");
    //Drawing the clock
    initClock();
    //Drawing the control
    initControl();

    //Binding all events
    $( window ).resize(params.resize_simul);
     //Init the slider
    $( "#time_slider" ).slider({ animate: "fast",
                                     max: (params.time_length - 1),
                                     min: 0,
                                     slide: function( event, ui ) {params.update_simul()}});
    //Init the play button
    $("#play_button").click(playSimul);
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
       .data(params.simul_data.density[time])
       .attr("fill", function(d,i) {
           return densityColors(d,i);
       });

    updateClock(time);
    updateControl(time);

}

//Called when the size of the window is changing
function resizeSimul(){
    params.width = params.width_function();

    params.position_scale = d3.scale.linear()
                            .domain([0, params.space_length])
                            .range([0, params.width]);

    var svg = d3.select("#simul svg");
    svg.attr("width", params.width);

    svg.selectAll("rect")
       .data(params.simul_data.density[$( "#time_slider" ).slider( "value" )])
       .attr("x", function(d,i){;
            return Math.floor(params.position_scale(i));
       })
       .attr("width", params.width/params.space_length+1);

        svg.select("#road_background")
            .attr("width", params.width)

    resizeControl();
}

//Handle the Simulation play

function stopSim() {
    clearInterval(params.playSim);
    params.play = false;
    params.morse_pause = false;
}

function isEndOfSim() {
return ($( "#time_slider" ).slider( "value" ) == (params.time_length - 1));
}

function playUpdate(){
    if (isEndOfSim())
        stopSim();
    else{
        $( "#time_slider" ).slider( "value", ($( "#time_slider" ).slider( "value") + 1) );
        params.update_simul();
    }
}
//called when play button is clicked
function playSimul(){
    if(params.play)
        stopSim();
    else {
        if (isEndOfSim()) {
          resetSim();
        }
        var time_interval = params.play_time * 1000 / params.time_length;
        params.playSim = setInterval(params.update_function, time_interval);
        params.play = true;
    }
}
function sleep(millis, callback) {
    setTimeout(function()
            { callback(); }
    , millis);
}

//Initialize the control visualization
function initControl(){
    var svg = d3.select("#control").append("svg")
                                   .attr("width", params.width)
                                   .attr("height", params.control_height);
    var light_radius = Math.floor(params.control_offset_ratio * Math.min(params.control_width/2.0, params.control_height/6.0));
    var signal = svg.selectAll("g")
                   .data(params.simul_data.control[0]).enter()
                   .append("g") //signal
                     .attr('transform', function(d, i) {
                               return 'translate(' + Math.floor(params.position_scale(params.simul_data.onRamps[i])) + ', 0)';
                     });
    signal.append("rect")
               .attr("height",params.control_height)
               .attr("width", params.control_width)
               .attr("fill", "black");
    signal.append("circle") //red light
                .attr("cx", function(d,i){
                    return Math.round(params.control_width/2.0);
                })
                .attr("cy", Math.round(params.control_height/6.0))
                .attr("r", light_radius)
                .attr("class", "red")
                .attr("fill", function(d){return controlRedColor(d);});
    signal.append("circle") //orange light
                .attr("cx", function(d,i){
                   return Math.round(params.control_width/2.0);
                })
                .attr("cy", Math.round(params.control_height/2.0))
                .attr("r", light_radius)
                .attr("class", "orange")
                .attr("fill", function(d){return controlOrangeColor(d);});
    signal.append("circle") //green light
                .attr("cx", function(d,i){
                   return Math.round(params.control_width/2.0);
                })
                .attr("cy", Math.round(5.0*params.control_height/6.0))
                .attr("r", light_radius)
                .attr("class", "green")
                .attr("fill", function(d){return controlGreenColor(d);});
}

function resizeControl(){
    var svg = d3.select("#control svg")
                   .attr("width", params.width);
    svg.selectAll("g")
            .attr('transform', function(d, i) {
                    return 'translate(' + Math.floor(params.position_scale(params.simul_data.onRamps[i])) + ', 0)';
             });
}

function updateControl(time){
    var svg = d3.select("#control svg");
    var signal = svg.selectAll("g")
                    .data(params.simul_data.control[time]);
    signal.select(".red").attr("fill", function(d){return controlRedColor(d);});
    signal.select(".orange").attr("fill", function(d){return controlOrangeColor(d);});
    signal.select(".green").attr("fill", function(d){return controlGreenColor(d);});
}

function resetSim() {
    $("#time_slider").slider("value", 0);
    sleep(500, function() {
    $("#play_button").click();
            if (!params.play) {
            $("#play_button").click();
            }
    });
}

function initClock(){
    var svg = d3.select("#clock").append("svg")
                                    .attr("width", "160px")
                                    .attr("height", "160px");
    //clock background
    svg.append("image")
           .attr("width","160px")
           .attr("height","160px")
           .attr("xlink:href", "/assets/images/clock.png");

    //hours :
    svg.append("rect")
            .attr("id","hours")
            .attr("x",79)
            .attr("y", 35)
            .attr("width", 3)
            .attr("height",46)
            .attr("fill", "#282828")
            .attr("transform", "rotate(" + 4*30 + "," + 80 + "," + 80 + ")");

    //minutes :
    svg.append("rect")
            .attr("id","minutes")
            .attr("x",79)
            .attr("y", 20)
            .attr("width", 3)
            .attr("height",60)
            .attr("fill", "#535353")
            .attr("transform", "rotate(" + 0*30 + "," + 80 + "," + 80 + ")");

    //middle circle :
    svg.append("circle")
            .attr("cx",81)
            .attr("cy", 80)
            .attr("r", 3)
            .attr("fill", "#535353");
}

function updateClock(time){
    var minutes = time / (1.0*params.time_length) * params.real_total_time;

    var hours = (minutes/60.) + 4;
    minutes = minutes - 60 * Math.floor(hours - 4);
    var svg = d3.select("#clock");
    svg.select("#hours").attr("transform", "rotate(" + hours*30 + "," + 80 + "," + 80 + ")");
    svg.select("#minutes").transition().duration(params.play_time * 1000 / (1.5*params.time_length)).attr("transform", "rotate(" + minutes*6 + "," + 80 + "," + 80 + ")");
}