'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * 组件消息(如果是企业发布的活动消息则归为虚拟组)
 */


var GroupMessage = new Schema({
    //动态类型，分别为1:发起活动，2:关闭活动，3:发起挑战，4:接受挑战应战，5:比赛确认，6:新成员加入
    message_type: Number,
    company: [{//如果是约战消息,要在两家公司的主页同时显示
        cid:{
            type: Schema.Types.ObjectId,
            ref:'Company'
        },
        name: String
    }],
    gid: String,
    team:[{
        teamid:{
            type: Schema.Types.ObjectId,
            ref: 'CompanyGroup'
        },
        name: String
    }],
    campaign:{
        type: Schema.Types.ObjectId,
        ref: 'Campaign'
    },
    competition:{
        type: Schema.Types.ObjectId,
        ref: 'Competition'
    },
    //可做成数组合并多个成员加入
    user:{
        user_id:{
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String
    },
    active: {
        type: Boolean, //
        default: true
    },
    create_time: {
        type: Date,
        default: Date.now()
    }
});

mongoose.model('GroupMessage', GroupMessage);