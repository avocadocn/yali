//比赛数据结构
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;





var _member = new Schema({
    camp: {                //阵营
      type: String,
      enum: ['A','B']
    },
    cid: String,
    uid: String,
    photo: String,         //队员头像路径
    nickname: String,
    number: Number         //球队分配的个人号码
});

//阵形图子文档
var _formation = new Schema({
    uid: String,
    x: Number,
    y: Number
});


var _camp = new Schema({
  id : Schema.Types.ObjectId,              //小队id
  logo: String,                            //队徽路径
  tname: String,
  member:[_member],
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


/**
 * 比赛数据结构
 */
var Competition = new Schema({
    group_type: String,
    gid: String,
    brief: {
      location: {
        type: {
          type:String
        },
        coordinates: [],
        name: String,
        address : String
      },
      competition_date: Date,
      deadline: Date,
      competition_format: String,              //赛制
      remark: String,                          //备注
      number: Number                           //人数
    },
    camp:[_camp],                              //阵营
    poster: {
        cid: String,                   //活动发起者所属的公司
        cname: String,
        uid: String,
        nickname: String,
        role: {
            type: String,
            enum: ['HR','LEADER','GUESTLEADER','GUESTHR']      //HR 组长
        },
    },
    content: String,
    convert_to_campaign: {
        type: Boolean,
        default: false
    },
    provoke_message_id: Schema.Types.ObjectId,
    arena_flag: {
        type: Boolean,
        default: false
    },
    arena_id: Schema.Types.ObjectId
});

mongoose.model('Competition', Competition);