'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RichComment = new Schema({
  host_type: {
    type: String,
    enum: ['campaign', 'photo']
  },
  host_id: Schema.Types.ObjectId,
  photo_album_id: Schema.Types.ObjectId,
  enable: {
    type: Boolean,
    default: true
  }
});


RichComment.methods = {

  /**
   * 获取该组件的初始数据, 用于前端directive初始化
   * @param callback callback(data)
   */
  getData: function (callback) {
    callback({
      hostType: this.host_type,
      hostId: this.host_id,
      photoAlbumId: this.photo_album_id
    });
  }

};

mongoose.model('RichComment', RichComment);