'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * 用于子文档嵌套
 */
var _member = new Schema({
    cid: String,
    uid: String,
    nickname: String,
    photo: String
});

/**
 * 活动
 */

var Campaign = new Schema({
    team:[{
        type: Schema.Types.ObjectId,
        ref: 'CompanyGroup'
    }],
    active: {
        type: Boolean,
        default: false
    },
    gid: Array,
    group_type: Array,
    cid: [{
        type: Schema.Types.ObjectId
    }],                        //参加该活动的所有公司
    cname: Array,
    poster: {
        cid: String,                   //活动发起者所属的公司
        cname: String,
        tname: String,
        uid: String,
        nickname: String,
        role: {
            type: String,
            enum: ['HR','LEADER']      //HR 组长
        },
    },
    theme:{//主题
        type:String,
        required: true
    },
    content: {//简介
        type: String,
        required: true
    },

    location: {//地点
        type: String,
        required: true
    },

    photo_album: {
        pid: Schema.Types.ObjectId,
        name: {
            type: String,
            default: '活动相册'
        }
    },

    member: [_member],

    create_time: {
        type: Date,
        default: Date.now()
    },
    start_time: Date,
    end_time: Date,
    provoke: {                        //约战活动
        competition_format: String,   //赛制
        active: {
            type: Boolean,
            default: false
        },                            //如果是true就显示为约战活动,否则为普通活动
        competition_id: Schema.Types.ObjectId     //对应的比赛的id
    }
});


mongoose.model('Campaign', Campaign);