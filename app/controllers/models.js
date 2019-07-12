'use strict';

/**
 * Module dependencies.
 */
const httpstan = require("../httpstan/httpstan")
const mongoose = require('mongoose');
const { wrap: async } = require('co');
const only = require('only');
const Model = mongoose.model('Model');
const assign = Object.assign;

/**
 * Load
 */

exports.load = async(function*(req, res, next, id) {
  try {
    req.model = yield Model.load(id);
    if (!req.model) return next(new Error('Model not found'));
  } catch (err) {
    return next(err);
  }
  next();
});

/**
 * List
 */

exports.index = async(function*(req, res) {
  const _id = req.query.item;
  let options = {}
  if(req.user){
    options.user = req.user._id;
  }
  const models = yield Model.list(options);
  const count = yield Model.countDocuments();

  res.render('models/index', {
    title: 'cloudstan',
    models: models
  });
});

/**
 * New model
 */

exports.new = function(req, res) {
  res.render('models/new', {
    title: 'New Model',
    model: new Model()
  });
};

/**
 * Create an model
 */

exports.create = async(function*(req, res) {
  const model = new Model(only(req.body, 'title description'));
  model.user = req.user;
  model.code = "data {\n    \n}\nparameters {\n\n}\nmodel {\n\n}";
  try {
    yield model.uploadAndSave(req.file);
    req.flash('success', 'Successfully created a new model! Now add the model code and compile it!');
    res.redirect(`/models/${model._id}`);
  } catch (err) {
    res.status(422).render('models/new', {
      title: model.title || 'New Model',
      errors: [err.toString()],
      model
    });
  }
});

/**
 * Edit an model
 */

exports.edit = function(req, res) {
  res.render('models/edit', {
    title: 'Edit title and description',
    model: req.model
  });
};

/**
 * Update model
 */

exports.update = async(function*(req, res) {
  const model = req.model;
  assign(model, only(req.body, 'title description'));
  try {
    yield model.uploadAndSave(req.file);
    res.redirect(`/models/${model._id}`);
  } catch (err) {
    res.status(422).render('models/edit', {
      title: 'Edit title and description',
      errors: [err.toString()],
      model
    });
  }
});

/**
 * Show
 */

exports.show = function(req, res) {
  res.render('models/show', {
    title: req.model.title,
    model: req.model
  });
};

/**
 * Delete an model
 */

exports.destroy = async(function*(req, res) {
  yield req.model.remove();
  req.flash('info', 'Deleted successfully');
  res.redirect('/models');
});

/**
 * Update the code of your model
 */

exports.save_code = async(function*(req, res) {
  const model = req.model;
  req.body.compiled = false;
  assign(model, only(req.body, 'code compiled'));
  try {
    yield model.uploadAndSave(req.file);
    res.send(req.body.code);
  } catch (err) {
    res.status(422).render('models/edit', {
      title: 'Edit title and description',
      errors: [err.toString()],
      model
    });
  }
});

/**
 * Get the code of your model
 */

exports.get_code = async(function*(req, res, next) {
  const model = req.model;
  try {
    res.send({code: req.model.code});
  } catch (err) {
    res.status(422);
  }
});

/**
 * Get the code of your model
 */

exports.compile = async(function*(req, res, next) {
  const model = req.model;
  try {
    // send to compile
    httpstan.compile_model(model.code, (error, data) => {
      console.log(error)
      console.log(data)
      if(error){
        if(error.message){
          error.message = error.message.replace(/(?:\r\n|\r|\n)/g, '<br>');
        }
        return res.send(error);
      }
      assign(model, only({modelHttpStanId: data.name, compiled: true}, 'modelHttpStanId compiled'));
      try {
        model.uploadAndSave(req.file);
      } catch (err) {
        return res.send({error: "Error accesing to the database."});
      }
      return res.send(data.name);
    });
  } catch (err) {
    res.status(422);
  }
});

/**
 * Update the data of your model
 */

exports.save_data = async(function*(req, res) {
  const model = req.model;
  assign(model, only(req.body, 'data'));
  try {
    yield model.uploadAndSave(req.file);
    res.send(req.body.code);
  } catch (err) {
    res.status(422);
  }
});


/**
 * Run the model
 */

exports.run_model = async(function*(req, res) {
  const model = req.model;
  try {
    // send to compile
    httpstan.run_model(model.modelHttpStanId, JSON.parse(model.data), (error, data) => {
      if(error){
        if(error.message){
          error.message = error.message.replace(/(?:\r\n|\r|\n)/g, '<br>');
        }
        return res.send(error);
      }
      assign(model, only({fitHttpStanId: data.fit_name, operationHttpStanId: data.operation_name, fitCompleted: false},
                  'fitHttpStanId operationHttpStanId fitCompleted'));
      try {
        model.uploadAndSave(req.file);
      } catch (err) {
        return res.send({error: "Error accesing to the database."});
      }
      return res.send(data.fit_name);
    });
  } catch (err) {
    res.status(422);
  }
});