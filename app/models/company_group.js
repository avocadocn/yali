'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;



var _member = new Schema({
    _id: {
        type: String,
        ref: 'User'
    },
    nickname: String,
    photo: String
});




/**
 * 企业组件
 */
var CompanyGroup = new Schema({
    _id : String,
    cid: {
        type: String,
        ref: 'Company'
    },
    gid: {
        type: String,
        ref: 'Group'
    },
    group_type: String,
    cname: String,
    name: String,
    member: [_member],
    leader: [_member],
    logo: {
        type: String,
        default: '/img/icons/default_group_logo.png'
    },
    entity_type: String,
    brief: String,
    score: Number,                //和增强组件里的score相同,避免多表查询,注意保持一致性!
    photo: Array,
    arena_id: String
});

mongoose.model('CompanyGroup', CompanyGroup);