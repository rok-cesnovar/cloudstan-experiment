const request = require('request')
const fs = require('fs')
var protobuf = require("protobufjs");
var varint = require("varint")

const url_base = process.env.HTTPSTAN_URL

const compile_model = (model, callback) => {
  const url = url_base + '/v1/models';
  request.post(url, {formData:{"program_code": model}}, (err, httpResponse, body) => {
    if (err) {
      if(err.code === 'ECONNREFUSED'){
        return callback({
          error: 'The httpstan instance is not reachable!'
        }, undefined)
      }else{
        return callback({
          error: 'Undefined error'
        }, undefined)
      }      
    }
    response_body = JSON.parse(body);
    if(response_body.code) {      
      return callback({
        error: 'Model compilation failed!',
        message: response_body.message
      }, undefined)
    }

    callback(undefined, {
      name: response_body.name
    })

  });
}

const run_model = (model_name, model_data, num_warmup, num_samples, callback) => {
  const sampling_function = "stan::services::sample::hmc_nuts_diag_e_adapt"
  const url = url_base + '/v1/'+model_name+'/fits';
  var postData = {
    function: sampling_function,
    data: model_data,
    num_warmup, 
    num_samples
  }
  var options = {
    method: 'post',
    body: postData,
    json: true,
    url: url
  }
  request(options, function (err, res, body) {
    if (err) {
      return callback({
        error: 'The httpstan instance is not reachable!'
      }, undefined)
    }
    if(res.statusCode!=201) {
      console.log(body)
      return callback({
        error: 'Model fit error!',
        message: body.message
      }, undefined)
    }
    callback(undefined, {
      done: body.done,
      fit_name: body.metadata.fit.name,
      operation_name: body.name      
    })
  })
}

const operation_progress = (operation_name, callback) => {
  const url = url_base + '/v1/'+operation_name;
  var options = {
    method: 'get',
    json: true,
    url: url
  }
  request(options, function (err, res, body) {
    if (err) {
      return callback({
        error: 'The httpstan instance is not reachable!'
      }, undefined)
    }
    if(body.code){
      return callback({
        error: 'The operation with the given id does not exist'
      }, undefined)
    }
    if(body.result.code==400){
      callback({error:body.result.message}, undefined)
    }else{
      callback(undefined, {
        done: body.done,
        progress: body.metadata.progress,
        operation_name: body.name      
      })
    }    
  })
}

const get_run_info = (fit_name, callback) => {
  const url = url_base + '/v1/'+fit_name;
  var options = {
    method: 'get',
    encoding: null,
    url: url
  }
  request(options, function (err, res, body) {
    console.log(err)
    console.log(body)
    if (err) {
      return callback({
        error: 'The httpstan instance is not reachable!'
      }, undefined)
    }
    if(body.code){
      return callback({
        error: 'The fit with the given id does not exist'
      }, undefined)
    }
    data = Buffer.from(body)
    protobuf.load("./app/httpstan/callbacks_writer.proto", function(err, root) {
      if (err)
          throw err;
      let writer = root.lookupType("stan.WriterMessage");
      var i = 0;
      let value = 0;
      var samples = {}
      var diagnostic = {}
      var logger = ""
      while(i < data.length) {
          let len = varint.decode(data, i)
          var num = varint.decode.bytes
          i+=num
          to_parse = data.slice(i, i+len)
          i+=len
          try{
            let message = writer.decode(to_parse);            
            var object = writer.toObject(message, {
                enums: String,  // enums as string names
                longs: String,  // longs as strings (requires long.js)
                bytes: String,  // bytes as base64 encoded strings
                defaults: true, // includes default values
                arrays: true,   // populates empty arrays (repeated fields) even if defaults=false
                objects: true,  // populates empty objects (map fields) even if defaults=false
                oneofs: true    // includes virtual oneof fields set to the present field's name
            });

            if(object.topic === "SAMPLE"){
                object.feature.forEach(element => {
                    if(element.doubleList && element.name.length>0) {
                        if(!samples[element.name]){
                            samples[element.name] = []
                        }                        
                        samples[element.name].push(element.doubleList.value[0])
                    }                    
                });
            }else if(object.topic === "LOGGER"){
                object.feature.forEach(element => {
                    if(element.stringList) {
                        logger += element.stringList.value[0]+"<br/>"
                    }                    
                });
            }else if(object.topic === "DIAGNOSTIC"){
                object.feature.forEach(element => {
                    if(element.doubleList && element.name.length>0) {
                        if(!diagnostic[element.name]){
                            diagnostic[element.name] = []
                        }                        
                        diagnostic[element.name].push(element.doubleList.value[0])
                    }                    
                });
            }else{
                //Ignoring intialization for now
                //console.log(object)
            }
          }catch(err){
            break;
          }         
      }
      callback(undefined, {logger, samples, diagnostic})
    });
  })
}

const extract_draws = (fit_name, callback) => {
  const url = url_base + '/v1/'+fit_name;
  var options = {
    method: 'get',
    encoding: null,
    url: url
  }
  request(options, function (err, res, body) {
    if (err) {
      return callback({
        error: 'The httpstan instance is not reachable!'
      }, undefined)
    }
    if(body.code){
      return callback({
        error: 'The fit with the given id does not exist'
      }, undefined)
    }
    data = Buffer.from(body)
    protobuf.load("./httpstan/callbacks_writer.proto", function(err, root) {
      if (err)
          throw err;
      let writer = root.lookupType("stan.WriterMessage");
      var i = 0;
      let value = 0;
      var samples = {}
      var diagnostic = {}
      var logger = ""
      while(i < data.length) {
          let len = varint.decode(data, i)
          var num = varint.decode.bytes
          i+=num
          to_parse = data.slice(i, i+len)
          i+=len
          let message = writer.decode(to_parse);            
          var object = writer.toObject(message, {
              enums: String,  // enums as string names
              longs: String,  // longs as strings (requires long.js)
              bytes: String,  // bytes as base64 encoded strings
              defaults: true, // includes default values
              arrays: true,   // populates empty arrays (repeated fields) even if defaults=false
              objects: true,  // populates empty objects (map fields) even if defaults=false
              oneofs: true    // includes virtual oneof fields set to the present field's name
          });

          if(object.topic === "SAMPLE"){
              object.feature.forEach(element => {
                  if(element.doubleList && element.name.length>0) {
                      if(!samples[element.name]){
                          samples[element.name] = []
                      }                        
                      samples[element.name].push(element.doubleList.value[0])
                  }                    
              });
          }else if(object.topic === "LOGGER"){
              object.feature.forEach(element => {
                  if(element.stringList) {
                      logger += element.stringList.value[0]+"\n"
                  }                    
              });
          }else if(object.topic === "DIAGNOSTIC"){
              object.feature.forEach(element => {
                  if(element.doubleList && element.name.length>0) {
                      if(!diagnostic[element.name]){
                          diagnostic[element.name] = []
                      }                        
                      diagnostic[element.name].push(element.doubleList.value[0])
                  }                    
              });
          }else{
              //Ignoring intialization for now
              //console.log(object)
          }            
      }
      callback(undefined, {logger, samples, diagnostic})
    });
  })
}

module.exports = {
  compile_model,
  run_model,
  operation_progress,
  get_run_info, 
  extract_draws
}