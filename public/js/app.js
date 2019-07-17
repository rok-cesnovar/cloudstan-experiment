$(document).ready(function () {
    function isValidJson(json) {
        try {
            JSON.parse(json);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    function slide_to(name,off){
        const offset = $("nav").height()+parseInt($("nav").css("padding-bottom"))+parseInt($("nav").css("padding-top"));
        $('html, body').animate({
            scrollTop: $(name).offset().top-offset-off
        }, 100);
    }
    sampling_check_timer = 100
    function check_sampling(){
        const model_id = $('input[name=model_id]').val();
        const _csrf = $('input[name=_csrf]').val();
        const params = { _csrf };
        if(sampling_check_timer<2){
            sampling_check_timer*=1.5
        }
        //this should probably be a socket
        $.get("/models/"+model_id+"/fit", params, (data) => {            
            if(data.error){
                enable_button("start_sampling");
                $("#sampling_logger").append("ERROR: <br>").append(data.error+"<br/>"+data.message);
            }else{
                if(data.done==true){      
                    console.log(data)              
                    enable_button("start_sampling");
                    $("#sampling_logger").empty();
                    $("#sampling_logger").append(data.logger.replace("\n"));
                    $("#sampling_logger").scrollTop($("#sampling_logger")[0].scrollHeight);
                    $("#param_select").empty();
                    stansummaryTable(data);
                    sampling_data = data.samples
                    visualize(data.samples)
                    //setTimeout(slide_to("#summary_div",0),100)
                }else{
                    $("#sampling_logger").append("<br/>"+data.progress);
                    $("#sampling_logger").scrollTop($("#sampling_logger")[0].scrollHeight);
                    setTimeout(check_sampling, sampling_check_timer)
                }
            }            
        })
        .fail(function(jqXHR, textStatus, errorThrows) {
            enable_button("start_sampling");
            $("#sampling_logger").append("ERROR: <br>").append(err);            
        })           
    }
    function clear_flash_message(){
        $(".messages").empty();
        $("#compile_messages").empty();
    }
    function disable_button(name) {
        $("#"+name).addClass("inactive").prop('disabled', true);
    }
    function enable_button(name) {
        $("#"+name).removeClass("inactive").prop('disabled', false);
    }
    function check_compiled_done() {
        const model_id = $('input[name=model_id]').val();
        $.get("/models/"+model_id+"/code", params, (data) => {
            $("#code").val(data.code);
            if(last_model_was_compiled == 1) {
                $("#run_model").show();
            }
        })
        setTimeout(check_compiled_done, 1000);
    }
    
    function flash_message_model(type, msg){
        $("#compile_messages").append("<div class=\"fade show alert alert-"+type+"\"><button class=\"close\" type=\"button\" data-dismiss=\"alert\">×</button>"+msg+"</div>");
    }

    function flash_message_data(type, msg){
        $("#data_messages").append("<div class=\"fade show alert alert-"+type+"\"><button class=\"close\" type=\"button\" data-dismiss=\"alert\">×</button>"+msg+"</div>");
    }

    function flash_message_fit(type, msg){
        $("#fit_messages").append("<div class=\"fade show alert alert-"+type+"\"><button class=\"close\" type=\"button\" data-dismiss=\"alert\">×</button>"+msg+"</div>");
    }

    $("#to_input").click(() => {
        const offset = $("nav").height()+parseInt($("nav").css("padding-bottom"))+parseInt($("nav").css("padding-top"));
        $('html, body').animate({
            scrollTop: $("#model_data").offset().top-offset-5
        }, 10);
    });

    $("#save_model").click(() => {
        var code = editor.getValue();
        
        clear_flash_message();
        const model_id = $('input[name=model_id]').val();
        const _csrf = $('input[name=_csrf]').val();
        
        const params = { _csrf, code };
        $("input[name=compiled]").val(0);

        $.post("/models/"+model_id+"/code", params, (data) => {
            $("#discard_model_code_changes").hide();
            disable_button("save_model");
            disable_button("to_input");
            enable_button("compile_model");
            flash_message_model("info", "The model was saved succesfully.");     
        })
        .fail(function() {
            flash_message_model("danger", "Could not save the model code!");
        })   
    });

    $("#compile_model").click(() => {
        const model_id = $('input[name=model_id]').val();
        const _csrf = $('input[name=_csrf]').val();
        const params = { _csrf };
        disable_button("save_model");
        disable_button("to_input");
        disable_button("compile_model");
        clear_flash_message();
        flash_message_model("info", "The model is compiling. Please wait...");  
        //remove data and visualization
        $.get("/models/"+model_id+"/compile", params, (data) => {
            if(data.error){
                if(data.message){
                    flash_message_model("danger", data.error+"<br/>"+data.message);
                }else{
                    flash_message_model("danger", data.error);
                }                
                disable_button("save_model");
                disable_button("to_input");
                enable_button("compile_model");
            }else{
                clear_flash_message();
                flash_message_model("success", "The model compiled succesfully.");
                disable_button("save_model");
                enable_button("to_input");
                disable_button("compile_model");
            }            
        })
        

        .fail(function() {
            disable_button("save_model");
            disable_button("to_input");
            enable_button("compile_model");
            flash_message_model("danger", "Could not compile model!");
        })
    });

    $("#discard_model_code_changes").click(() => {
        const last_model_was_compiled = $("input[name=compiled]").val();
        const model_id = $('input[name=model_id]').val();
        const _csrf = $('input[name=_csrf]').val();
        const params = { _csrf };
        $.get("/models/"+model_id+"/code", params, (data) => {
            editor.setValue(data.code);
            if(last_model_was_compiled == 1) {
                disable_button("save_model");
                enable_button("to_input");
                disable_button("compile_model");
            }else{
                if(data.code.length==0){
                    disable_button("save_model");
                    disable_button("to_input");
                    disable_button("compile_model");
                }else{
                    disable_button("save_model");
                    disable_button("to_input");
                    enable_button("compile_model");
                }
            }
            $("#discard_model_code_changes").hide();
            clear_flash_message();
        })
        .fail(function() {
            alert("Something went wrong! Can not discard!");
        });
    });

    $("#start_sampling").click(() => {
        const model_id = $('input[name=model_id]').val();
        const _csrf = $('input[name=_csrf]').val();
        const num_warmup = $('input[name=num_warmup]').val();
        const num_samples = $('input[name=num_samples]').val();
        const params = { _csrf, num_warmup, num_samples };
        $("#summary_div").slideUp();
        $("#sampling_logger").empty().append("Sampling started...");
        sampling_check_timer = 100
        $.post("/models/"+model_id+"/fit", params, (data) => {            
            if(data.error){
                enable_button("start_sampling");
                $("#sampling_logger").append("ERROR: <br>").append(data.error).append(data.message);
            }else{
                disable_button("start_sampling");
                setTimeout(check_sampling, sampling_check_timer)
            }            
        })
        .fail(function() {
            enable_button("start_sampling");
            $("#sampling_logger").append("ERROR: <br>").append(err);
        })
    });
    $("#save_data").click(() => {
        var dataVal = dataEditor.getValue();
        if(isValidJson(dataVal)){
            clear_flash_message();
            const model_id = $('input[name=model_id]').val();
            const _csrf = $('input[name=_csrf]').val();        
            const params = { _csrf, data: dataVal };
            $.post("/models/"+model_id+"/data", params, (data) => {
                disable_button("save_data");
                enable_button("run_model");
                flash_message_data("info", "The data was saved succesfully.");     
            })
            .fail(function() {
                flash_message_data("danger", "Could not save the model data!");
            })
        }else{
            flash_message_data("danger", "The input data is not in a valid JSON format!");
        }  
    });


    var code_area = document.getElementById("codemirroreditor")
    var editor = CodeMirror.fromTextArea(code_area,{
        //value: document.getElementById("codemirroreditor").getAttribute("start"),
        mode: "stan",
        theme: "base16-dark",
        smartIndent: true,
        lineNumbers: true
    });
    editor.setSize("100%",500);
    editor.on("change", (data) => {
        enable_button("save_model");
        disable_button("to_input");
        disable_button("compile_model");
        $("#discard_model_code_changes").show();
        clear_flash_message();
    });

    var data_area = document.getElementById("dataeditor")
    var dataEditor = CodeMirror.fromTextArea(data_area,{
        mode: "stan",
        theme: "base16-dark",
        smartIndent: true,
        lineNumbers: true
    });
    dataEditor.setSize("100%",300);
    dataEditor.on("change", (data) => {
        enable_button("save_data");
        disable_button("run_model");
        clear_flash_message();
    });

    if($("#check_sampling")){
        if($("#check_sampling").val()==1){
            check_sampling();
        }    
    }

    
});
