'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Message = new Schema({
  rec_id: Schema.Types.ObjectId,  // 接收者_id
  message_content_id: Schema.Types.ObjectId,  // Model.MessageContent._id
  status: {
    type: String,
    enum: ['unread', 'read', 'delete']
  }
});

mongoose.model('Message', Message);