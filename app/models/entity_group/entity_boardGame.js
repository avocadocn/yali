//户外增强组件
'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var boardGame = new Schema({
	tid: String,
  cid: String,
  gid: String
});

mongoose.model('BoardGame', boardGame);