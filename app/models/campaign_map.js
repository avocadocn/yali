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
var CampaignMap = new Schema({
    map:[{
        campaign_type:String,
        campaign_module:[{type:String}]
    }]
});


mongoose.model('CampaignMap', CampaignMap);