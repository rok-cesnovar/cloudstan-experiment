'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * Model Schema
 */

const ModelSchema = new Schema({
  title: { type: String, default: '', trim: true, maxlength: 400 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  code: { type: String, default: '', trim: true, maxlength: 6000 },
  data: { type: String, default: '', trim: true, maxlength: 50000 },
  user: { type: Schema.ObjectId, ref: 'User' },
  compiled: { type: Boolean, default: false },
  fitCompleted: { type: Boolean, default: false },
  fitStarted: { type: Boolean, default: false },
  modelHttpStanId: {type: String, default: '' },
  fitHttpStanId: {type: String, default: '' },
  operationHttpStanId: {type: String, default: '' },
  fitWarmup:  {type: Number, default: 1000 },
  fitSampling:  {type: Number, default: 1000 },
  fitFunction: {type: Number, default: 0},
  createdAt: { type: Date, default: Date.now }
});

/**
 * Validations
 */

ModelSchema.path('title').required(true, 'Model title cannot be blank');

/**
 * Pre-remove hook
 */

ModelSchema.pre('remove', function(next) {
  // const imager = new Imager(imagerConfig, 'S3');
  // const files = this.image.files;

  // if there are files associated with the item, remove from the cloud too
  // imager.remove(files, function (err) {
  //   if (err) return next(err);
  // }, 'model');

  next();
});

/**
 * Methods
 */

ModelSchema.methods = {
  /**
   * Save model and upload image
   *
   * @param {Object} images
   * @api private
   */

  uploadAndSave: function(/*image*/) {
    const err = this.validateSync();
    if (err && err.toString()) throw new Error(err.toString());
    return this.save();

    /*
    if (images && !images.length) return this.save();
    const imager = new Imager(imagerConfig, 'S3');

    imager.upload(images, function (err, cdnUri, files) {
      if (err) return cb(err);
      if (files.length) {
        self.image = { cdnUri : cdnUri, files : files };
      }
      self.save(cb);
    }, 'model');
    */
  }
};

/**
 * Statics
 */

ModelSchema.statics = {
  /**
   * Find model by id
   *
   * @param {ObjectId} id
   * @api private
   */

  load: function(_id) {
    return this.findOne({ _id })
      .populate('user', 'name email username')
      .exec();
  },

  /**
   * List models
   *
   * @param {Object} options
   * @api private
   */

  list: function(options) {
    let criteria = {};
    if(options.user){
      criteria = {user: options.user};
    }else{
      criteria = {public: true};
    }    
    return this.find(criteria)
      .populate('user', 'name username')
      .sort({ createdAt: -1 })
      .exec();
  }
};

mongoose.model('Model', ModelSchema);
