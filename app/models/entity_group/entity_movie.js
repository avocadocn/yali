 //影视增强组件
'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var movie = new Schema({
	tid: String,
  cid: String,
  gid: String
});

mongoose.model('Movie', movie);