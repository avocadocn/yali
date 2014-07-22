'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;




var _sender = new Schema({
  _id:Schema.Types.ObjectId,
  nickname:String,
  photo:String,
  role:{
    type:String,
    enum:['USER','LEADER','HR']
  }
});

var _team = new Schema({
  _id : Schema.Types.ObjectId,
  name : String,
  logo : String,
  provoke_status: {
    type: Number,
    enum: [0,1,2,3]              //
  }
});
/**
 * type=private时，对应 Message 里的 private team department 三种情况
 */
var MessageContent = new Schema({
  caption: String,
  content: String,
  sender: [_sender],
  team: [_team],  // 消息所属小队
  company_id: Schema.Types.ObjectId,  // 消息所属公司的_id
  campaign_id: Schema.Types.ObjectId,
  groupmessage_id: Schema.Types.ObjectId,
  department_id: Schema.Types.ObjectId,
  status:{
    type:String,
    enum: ['delete','undelete'],
    default:'undelete'
  },
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

