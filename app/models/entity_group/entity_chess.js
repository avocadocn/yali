//棋牌增强组件
'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var chess = new Schema({
	tid: String,
  cid: String,
  gid: String
});

mongoose.model('Chess', chess);