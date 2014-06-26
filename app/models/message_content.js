'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

/**
 * type=private时，只设置send_id=发送者id
 * type=public时，只设置group_id或company_id
 * type=global时，不设置这3个id
 */
var MessageContent = new Schema({
  caption: String,
  content: String,
  type: {
    type: String,
    enum: ['private', 'public', 'global']
  },
  send_id: Schema.Types.ObjectId,  // Model.User._id
  team_id: Schema.Types.ObjectId,  // 消息所属小队(小队)的_id
  company_id: Schema.Types.ObjectId,  // 消息所属公司的_id
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

