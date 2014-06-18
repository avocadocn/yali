//评论数据结构

'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Comment = new Schema({
  host_id: Schema.Types.ObjectId,  //留言主体的id,这个主体可以是 一条活动、一条动态、一张照片、一场比赛等等
  content: String,
  create_date:{
    type:Date,
    default:Date.now
  },
  poster:{
    _id:Schema.Types.ObjectId,
    cid:Schema.Types.ObjectId,
    cname:String,
    nickname : String,
    realname:String,
    photo:String
  },
  host_type:{
    type: String,
    enum: ['message', 'album', 'campaign', 'competition']
  }
});

mongoose.model('Comment', Comment);