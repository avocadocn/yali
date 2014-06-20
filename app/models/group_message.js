'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * 组件消息(如果是企业发布的活动消息则归为虚拟组)
 */


var _camp = new Schema({
    cid: String,
    tid: String,
    tname: {
        type: String,
        default: 'unknown'
    },
    vote: {                           //在投票按钮上显示票数,由于异步方式的多表查询有问题,所以这样定义也是无奈之举啊
        positive: {
            type: Number,
            default: 0
        },
        negative: {
            type: Number,
            default: 0
        }
    }
});

var GroupMessage = new Schema({
    team:[{
        type: Schema.Types.ObjectId,
        ref: 'CompanyGroup'
    }],
    id: String,
    cid: [{                            //如果是约战消息,要在两家公司的主页同时显示
        type: Schema.Types.ObjectId
    }],
    group: {
        gid: Array,
        group_type: Array
    },
    active: Boolean, //
    create_time: {
        type: Date,
        default: Date.now()
    },
    poster: {
        cid: String,                  //消息发布者所属的公司
        uid: String,
        cname: String,
        tname: String,                //哪个小队发布的
        nickname: String,
        role: {
            type: String,
            enum: ['HR','LEADER','GUESTLEADER','GUESTHR']     //HR 队长
        },
    },
    theme: String,
    content: String,
    location: {
        type: {
          type:String
        },
        coordinates: [],
        name: String
    },                 //地点
    start_time: Date,                 //活动开始时间(或者比赛时间)
    end_time: Date,                   //活动结束时间(或者比赛截止时间)
    deadline:Date,
    comment_sum:{                     //该动态的留言数量
        type:Number,
        default:0
    },
    provoke: {                        //约战动态
        active: {
            type: Boolean,
            default: false            //如果是true就显示为约战动态,否则为普通动态
        },
        camp: [_camp],                //双方队名、投票情况
        start_confirm: {
            type: Boolean,
            default: false
        }                           //双方确认后才能变为true,此时不再显示"投票"按钮
    }
});

mongoose.model('GroupMessage', GroupMessage);