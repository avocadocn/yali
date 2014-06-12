'use strict';

var mongoose = require('mongoose');
var validator = require('validator');

var Schema = mongoose.Schema;



var Photo = new Schema({
  uri: String,
  thumbnail_uri: String,
  upload_date: {
    type: Date,
    default: Date.now
  },
  hidden: {
    type: Boolean,
    default: false
  },
  name: String,
  tags: [String],
  comments: [{
    content: String,
    publish_user: {
      _id: Schema.Types.ObjectId,
      nickname: String
    },
    publish_date: {
      type: Date,
      default: Date.now
    }
  }],
  upload_user: {
    _id: Schema.Types.ObjectId,
    nickname: String
  }
});

Photo.pre('save', function(next) {
  this.comment = validator.escape(this.comment);
  return next();
});


var PhotoAlbum = new Schema({
  name: {
    type: String,
    default: Date.now().toString()
  },
  create_date: {
    type: Date,
    default: Date.now
  },
  create_user: {
    _id: Schema.Types.ObjectId,
    nickname: String
  },
  update_user: {
    _id: Schema.Types.ObjectId,
    nickname: String
  },
  update_date: {
    type: Date,
    default: Date.now
  },
  hidden: {
    type: Boolean,
    default: false
  },
  photos: [Photo]
});

PhotoAlbum.pre('save', function(next) {
  this.name = validator.escape(this.name);
  this.update_date = Date.now();
  return next();
});

mongoose.model('PhotoAlbum', PhotoAlbum);

