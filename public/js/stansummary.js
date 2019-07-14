var sampling_data = {}
function createCellString(val){
    let td = $("<td>");
    td.html(val)
    return td
}
function createCellDouble(val){
    let td = $("<td>");
    td.html(val.toFixed(2))
    return td
}

function stansummaryTable(data) {
    $("#fit_summary").empty();
    var $table= $("<table>", {id: "fit_summary_table", "class": ["table table-striped table-bordered table-responsive-lg"]});
    $table.addClass("table").addClass("table-.striped")
    // add header to table
    header = ["", "mean", /*"se_mean",*/ "sd", "2.5%", "25%", "50%", "75%", "97.5%"/*, "n_eff", "Rhat"*/]
    quantiles = [0.0025,0.25,0.50,0.75,0.975]
    var $tr= $("<tr>");
    for(key in header){
        var $th= $("<th>");
        $th.html(header[key])
        $tr.append($th);
    }
    $table.append($tr)
    for(key in data.samples){
        var $tr= $("<tr>");
        $tr.append(createCellString(key))
        $tr.append(createCellDouble(d3.mean(data.samples[key])))
        //$tr.append(createCellString(""))
        $tr.append(createCellDouble(d3.deviation(data.samples[key])))
        //make a copy
        sortedSamples = data.samples[key].slice(0)
        sortedSamples = sortedSamples.sort()
        for(i=0;i<quantiles.length;i++){
            $tr.append(createCellDouble(d3.quantile(sortedSamples,quantiles[i])))
        }        
        $table.append($tr)
    }
    $("#fit_summary").append($table)
    $("#summary_div").show();
}

chartColors = ["rgb(178, 0, 29","rgb(54, 162, 235","rgb(75, 192, 192",
               "rgb(201, 0, 207", "rgb(255, 159, 64", "rgb(153, 102, 255",
               "rgb(255, 99, 132","rgb(255, 205, 80", "rgb(103, 58, 183",
               "rgb(0, 0, 0", "rgb(96, 125, 139", "rgb(76, 175, 80"  ]

function build_histogram() {
    var param = $("#param_").val()
    var num_of_bins = 100;
    var samples = sampling_data[param]
    var min = d3.min(samples)
    var max = d3.max(samples)
    var histGenerator = d3.histogram()
        .domain([min, max])
        .thresholds(num_of_bins);
    var bins = histGenerator(samples);
    console.log(bins)
    var x = []               
    var y = []
    for(var i=0;i<bins.length;i++){
        var k = bins[i].x0+bins[i].x1
        k=k/2.0;
        x.push(k.toFixed(2))
        y.push(bins[i].length)
    }

    var canvasHisto = $("#paramHistogram");
    var ctx = canvasHisto[0].getContext('2d');
    var chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: {
            labels: x,
            datasets: [{
                label: key,
                backgroundColor: "rgb(178, 0, 29)" ,
                borderColor: '#b2001d',
                data: y
            }]
        },

        // Configuration options go here
        options: {
            responsive: true
        }
    });    
}

function visualize(data){
    var next = 0
    key=""
    keys=[]
    var min = undefined
    var max = undefined
    var sel = $("<select>", {id: "param_"}).addClass("form-control").css("width","40%");
    for(key in data){
        if(next==1){
            keys.push(key)
            var opt = $("<option>").attr("value",key).html(key)
            sel.append(opt)
        }
        if(key==="energy__"){
            next=1
        }        
    }

    $("#param_select").append("Select parameter for histogram: ").append(sel).append("<br>");
    $("#param_").on("change", (data) => {
        build_histogram()
    });
    scatterData = []
    
    for(t in keys){
        key=keys[t]
        color = chartColors[t%chartColors.length]
        if(t==0)
            hide = false
        else
            hide = true
            scatterData.push({
            label: key,
            backgroundColor: color+',.2)',
            borderColor: color+')',
            data: [],
            hidden: hide
        });
        for(tmp in data[key]){
            scatterData[t].data.push({
                x: tmp,
                y: data[key][tmp]
            })
        }
    }
    var canvasSamples = $("<canvas>").prop("id", "paramTimeline");
    var ctx = canvasSamples[0].getContext('2d');
    var chart = new Chart.Scatter(ctx, {
        // The type of chart we want to create
        type: 'scatter',
        // The data for our dataset
        data: {
            datasets: scatterData,
            
        },

        // Configuration options go here
        options: {
            responsive: true,
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Iteration'
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Value'
                    }
                }]
            } 
        }
    });

    
    logPosteriors = []
    
    for(t in keys){
        key=keys[t]
        color = chartColors[t%chartColors.length]
        if(t==0)
            hide = false
        else
            hide = true
        logPosteriors.push({
            label: 'Log posterior - '+ key,
            backgroundColor: color+',.2)',
            borderColor: color+')',
            data: [],
            hidden: hide
        });
        for(tmp in data[key]){
            logPosteriors[t].data.push({
                x: data[key][tmp],
                y: data["lp__"][tmp]
            })
        }
    }

    var canvasPosterior = $("<canvas>").prop("id", "paramPosterior");
    var ctx = canvasPosterior[0].getContext('2d');
    var chart = new Chart.Scatter(ctx, {
        // The type of chart we want to create
        type: 'scatter',
        // The data for our dataset
        data: {
            datasets: logPosteriors,            
        },

        // Configuration options go here
        options: {
            responsive: true,
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: key
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Log posterior'
                    }
                }]
            } 
        }
    });
    $("#visualization").empty();    
    var canvasHisto = $("<canvas>").prop("id", "paramHistogram");
    $("#visualization").append(canvasHisto);
    build_histogram()
    $("#visualization").append(canvasSamples);
    $("#visualization").append(canvasPosterior);
}