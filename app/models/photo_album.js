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
      name: String,
      type: {
        type: String,
        enum: ['user', 'hr']
      }
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


var PhotoAlbum = new Schema({
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
  photos: [Photo],
  photo_count: {
    type: Number,
    default: 0
  }
});


mongoose.model('PhotoAlbum', PhotoAlbum);

