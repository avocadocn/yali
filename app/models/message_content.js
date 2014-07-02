'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;




var _sender = new Schema({
  _id:Schema.Types.ObjectId,
  nickname:String,
  leader:false
});

var _team = new Schema({
  _id : Schema.Types.ObjectId,
  name : String,
  provoke_status: {
    type: Number,
    enum: [0,1,2]              //0:生成挑战动态   1:挑战转化为比赛   2.比赛结束,结果确认
  }
});
/**
 * type=private时，对应 Message 里的 private team 两种情况
 */
var MessageContent = new Schema({
  caption: String,
  content: String,
  sender: [_sender],
  team: [_team],  // 消息所属小队
  company_id: Schema.Types.ObjectId,  // 消息所属公司的_id
  type: {
    type: String,
    enum: ['private','company','global']
  },
  post_date: {
    type: Date,
    default: Date.now
  },
  deadline:{
    type: Date,
    default: Date.now
  }
});

mongoose.model('MessageContent', MessageContent);

