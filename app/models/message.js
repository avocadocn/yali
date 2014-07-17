//Donler 定制版站内信

'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Message = new Schema({
  rec_id: Schema.Types.ObjectId,  // 接收者_id
  MessageContent: {
    type:Schema.Types.ObjectId,  // Model.MessageContent._id
    ref:"MessageContent"
  },
  type: {
    type: String,
    enum: ['private', 'team', 'department', 'company','global']
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'delete', 'sender_delete']
  },
  create_date:{
    type:Date,
    default:Date.now
  }
});

mongoose.model('Message', Message);