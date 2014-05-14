'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;



var _member = new Schema({
    uid: String,
    nickname: String,
    photo: String
});


var _team = new Schema({
    name: String,
    member: [_member],
    leader: [_member],
    logo:{
        type: String,
        default: '/img/icons/default_group_logo.png'
    },
    brief: String,
    score: Number,
    photo: Array
});


/**
 * 企业组件
 */
var CompanyGroup = new Schema({
    id : String,                   //新增字段,暂时不用
    cid: String,
    gid: String,
    group_type: String,
    cname:String,
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
    arena_id: String,
    team:[_team]                  //新增字段,现在一个组件有很多队了,暂时不用,因为要改的地方太多了
});

mongoose.model('CompanyGroup', CompanyGroup);