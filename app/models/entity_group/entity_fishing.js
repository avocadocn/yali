//钓鱼增强组件
'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var fishing = new Schema({
	tid: String,
    cid: String,
    gid: String
});

mongoose.model('Fishing', fishing);