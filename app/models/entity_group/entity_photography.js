//下午茶增强组件
'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var photography = new Schema({
  tid: Schema.Types.ObjectId,
  cid: Schema.Types.ObjectId,
  gid: String
});

mongoose.model('Photography', photography);