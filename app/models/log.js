'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LogShema = new Schema({
  log_type:{
    'type': String,
    enum: ['userlog']
  },
  userid: String,
  role:{
    'type': String,
    enum: ['hr','user']
  },
  ip:String,
  created: {
    type: Date,
    default: Date.now
  }
});


mongoose.model('Log', LogShema);