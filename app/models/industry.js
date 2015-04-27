'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var _inudstry = {
  _id: {
    type: Schema.Types.ObjectId
  },
  name: String
};

//行业
var Industry = new Schema({
  //行业名：如IT|通信|电子|互联网 
  name: {
    type: String,
    required: true
  },
  //级别，暂时只有2层
  level: {
    type: Number,
    enum: [1,2]
  },
  //父行业
  parent_industry: {
    type: Schema.Types.ObjectId,
    ref: 'Industry'
  },
  //子行业
  child_industry: [{
    type: Schema.Types.ObjectId,
    ref: 'Industry'
  }]
});


mongoose.model('Industry', Industry);