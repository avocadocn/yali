'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var _district = new Schema({
    name: String
});

var _city = new Schema({
    name: String,
    district: [_district]
});


var Province = new Schema({
    name: String,
    city: [_city]
});



mongoose.model('Region', Province);