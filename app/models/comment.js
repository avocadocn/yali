//评论数据结构

'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Comment = new Schema({
  host_id: Schema.Types.ObjectId,  //留言主体的id,这个主体可以是 一条活动、一条动态、一张照片、一场比赛等等
  content: String,
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
  reply_to: {
    _id: Schema.Types.ObjectId,
    nickname: String
  },
  reply_count: {
    type: Number,
    default: 0
  },
  status:{
    type: String,
    enum:['active','delete','shield'],
    // 此默认值是后来才加上的, 此处有大坑, 之前的数据没有默认值, 所以不能用status==active的查询条件
    // 但在查询结果中, 如果没有此属性, mongoose会设为'active'
    default: 'active'
  },
  host_type:{
    type: String,
    enum: ['message', 'album', 'campaign', 'competition', 'campaign_detail', 'photo', 'comment']
  },
  //2014/10以后代码中不会有message、campaign_detail了～
  photos: [{
    _id: Schema.Types.ObjectId,
    uri: String
  }]
});

mongoose.model('Comment', Comment);