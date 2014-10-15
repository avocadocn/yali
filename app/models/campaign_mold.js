//活动与组件映射表
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
/**
 * 映射表
 */
var CampaignMold = new Schema({
    name:String,
    module:[String],
    enable: {
      type: Boolean,
      default: true
    }
});


mongoose.model('CampaignMold', CampaignMold);
											