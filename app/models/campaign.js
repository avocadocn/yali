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
    camp: {                //阵营
      type: String,
      enum: ['A','B']
    },
    cid: String,
    uid: String,
    nickname: String,
    photo: String
});

//阵营
var _camp = new Schema({
  id : Schema.Types.ObjectId,              //小队id
  logo: String,                            //队徽路径
  tname: String,
  member:[_member],
  member_quit:[_member],
  cid: String,
  gid: String,
  start_confirm: {                         //双方组长都确认后才能开战
    type: Boolean,
    default: false
  },
  formation:[_formation],
  result: {                                //比赛结果确认
    confirm: {
      type: Boolean,
      default: false
    },
    content: String,
    start_date: Date
  },
  score: Number,
  vote: {
    positive: {                             //赞成员工投票数
        type: Number,
        default: 0
    },
    positive_member: [_member],             //赞成员工id,cid
    negative: {                             //反对员工投票数
        type: Number,
        default: 0
    },
    negative_member: [_member]              //反对员工id,cid
  }
});


//阵形图子文档
var _formation = new Schema({
    uid: String,
    x: Number,
    y: Number
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
    finish:{
        type: Boolean,
        default: false
    },
    cid: [{
        type: Schema.Types.ObjectId,
        ref: 'Company'
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
            enum: ['HR','LEADER']     //HR 队长
        },
    },
    theme:{//主题
        type:String,
        required: true
    },
    content: {//简介
        type: String
    },
    member_min: {//最少人数
        type:Number,
        default: 0
    },
    member_max: {//人数上限
        type:Number,
        default: 0
    },
    location: {
        type: {
          type:String
        },
        coordinates: [],
        name: String
      },
    start_time: Date,
    end_time: Date,
    deadline: Date,
    photo_album: {
        type: Schema.Types.ObjectId,
        ref: 'PhotoAlbum'
    },
    member: [_member],
    member_quit:[_member],
    create_time: {
        type: Date,
        default: Date.now
    },
    camp:[_camp],    //阵营
    comment_sum:{
        type:Number,
        default:0
    }
});


mongoose.model('Campaign', Campaign);