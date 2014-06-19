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
      nickname: String,
      photo: String
    },
    publish_date: {
      type: Date,
      default: Date.now
    }
  }],
  upload_user: {
    _id: Schema.Types.ObjectId,
    name: String,
    type: {
      type: String,
      enum: ['user', 'hr']
    }
  }
});

Photo.pre('save', function(next) {
  this.comment = validator.escape(this.comment);
  return next();
});


var PhotoAlbum = new Schema({
  owner: {
    _id: Schema.Types.ObjectId,
    model: String
  },
  owner_company: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  owner_company_group: {
    type: Schema.Types.ObjectId,
    ref: 'CompanyGroup'
  },
  name: {
    type: String,
    default: '相册'
  },
  create_date: {
    type: Date,
    default: Date.now
  },
  create_user: {
    _id: Schema.Types.ObjectId,
    name: String,
    type: {
      type: String,
      enum: ['user', 'hr']
    }
  },
  update_user: {
    _id: Schema.Types.ObjectId,
    name: String,
    type: {
      type: String,
      enum: ['user', 'hr']
    }
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

