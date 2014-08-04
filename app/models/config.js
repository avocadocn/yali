'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// 网站全局配置
var Config = new Schema({

    // 配置的名称，用于区分不同的配置。
    name: {
        type: String,
        unique: true
    },
    host: {
        admin: String,              //动梨后台的域名
        product: String             //动梨网站(客户使用)的域名
    },
    // 企业注册是否需要邀请码
    company_register_need_invite: {
        type: Boolean,
        default: true
    }
});

mongoose.model('Config', Config);
