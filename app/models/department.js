'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;





var Department = new Schema({
  name:String,
  company:{
    _id:Schema.Types.ObjectId,
    name:String,
    logo:String
  },
  team:{
    type: Schema.Types.ObjectId,
    ref: 'CompanyGroup'
  },
  manager:{
    _id:Schema.Types.ObjectId,
    nickname:String,
    photo:String
  }
});


mongoose.model('Department', Department);