'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;



var _member = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    nickname: String,
    photo: String,
    join_time:{
        type: Date,
        default: Date.now
    }
});

var familyPhoto = new Schema({
    uri: String,
    remark: String,
    upload_user: {
        _id: Schema.Types.ObjectId,
        name: String,
        photo: String
    },
    upload_date: {
        type: Date,
        default: Date.now
    },
    hidden: {
        type: Boolean,
        default: false
    },
    select: {
        type: Boolean,
        default: true
    }
});

var _home_court = new Schema({
    type: {
        type:String,
        default: 'Point'
    },
    coordinates: [],
    name: String
});

/**
 * 企业组件
 */
var CompanyGroup = new Schema({
    cid: {
        type: Schema.Types.ObjectId,
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
    photo_album_list: [{
        type: Schema.Types.ObjectId,
        ref: 'PhotoAlbum'
    }],
    arena_id: Schema.Types.ObjectId,
    active: {
        type: Boolean,
        default: true
    },
    home_court: [_home_court],       //主场(可能有多个)
    create_time:{
        type: Date,
        default: Date.now
    },
    count:{
        current_week_campaign: {
            type: Number,
            default: 0
        },
        current_week_member: {
            type: Number,
            default: 0
        },
        last_week_campaign: {
            type: Number,
            default: 0
        },
        last_week_member: {
            type: Number,
            default: 0
        },
        last_month_campaign: {
            type: Number,
            default: 0
        },
        last_month_member: {
            type: Number,
            default: 0
        }
    },
    family: [familyPhoto]
});

mongoose.model('CompanyGroup', CompanyGroup);