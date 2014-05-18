//阅读增强组件
'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var reading = new Schema({
	tid: String,
    cid: String,
    gid: String
});

mongoose.model('Reading', reading);