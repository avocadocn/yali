//评论数据结构

'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Report = new Schema({
  host_type:{
    type: String,
    enum: ['album', 'campaign', 'photo', 'comment', 'user', 'company']
  },
  host_id: Schema.Types.ObjectId,  //留言主体的id,这个主体可以是 一条活动、一条评论、一张照片、一场比赛等等
  content: String,
  report_type:Number,
  //0:淫秽色情
  //1:敏感信息
  //2:垃圾营销
  //3:诈骗
  //4:人身攻击
  //5:泄露我的隐私

  create_date:{
    type:Date,
    default: Date.now
  },
  poster:{
    _id:Schema.Types.ObjectId,
    cid:Schema.Types.ObjectId,
    cname:String,
    nickname : String,
    realname:String,
    photo:String
  },
  status:{
    type: String,
    enum:['active','inactive','shield'],
    default: 'active'
  }
});

mongoose.model('Report', Report);