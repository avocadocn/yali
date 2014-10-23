//活动组件表
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
/**
 * 组件
 */
var CampaignModule = new Schema({
  name:{
    type:String,
    unique:true
  },
  note:String,
  enable: {
    type: Boolean,
    default: true
  }
});


mongoose.model('CampaignModule', CampaignModule);
