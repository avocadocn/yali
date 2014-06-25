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
    //动态类型
    //0:发起公司活动，
    // 1:发起小队活动，
    // 2:关闭公司活动，
    // 3:关闭小组活动，
    // 4：发起挑战，
    // 5:接受挑战应战，
    // 6:比赛确认，
    // 7:公司新成员加入，
    // 8:小组新成员加人
    message_type: Number,
    company: [{//如果是约战消息,要在两家公司的主页同时显示
        cid:{
            type: Schema.Types.ObjectId,
            ref:'Company'
        },
        name: String,
        logo:String
    }],
    team:[{
        teamid:{
            type: Schema.Types.ObjectId,
            ref: 'CompanyGroup'
        },
        name: String,
        logo:String
    }],
    campaign:{
        type: Schema.Types.ObjectId,
        ref: 'Campaign'
    },
    //可做成数组合并多个成员加入
    user:{
        user_id:{
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        logo:String
    },
    active: {
        type: Boolean, //
        default: true
    },
    create_time: {
        type: Date,
        default: new Date()
    }
});

mongoose.model('GroupMessage', GroupMessage);