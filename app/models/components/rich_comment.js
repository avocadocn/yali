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

RichComment.statics = {

  /**
   * 创建组件并初始化数据
   * @param {Object} host 评论对象
   * @param {Function} callback 创建成功后的回调函数，形式为callback(err, richComment)。创建成功是指保存至数据库成功。
   */
  establish: function (host, callback) {
    var modelName = host.constructor.modelName;
    var hostType;
    switch (modelName) {
      case 'Campaign':
        hostType = 'campaign';
        break;
      case 'PhotoAlbum':
        hostType = 'photo';
        break;
      default:
        return callback(err);
    }
    var richComment = new this({
      host_type: hostType,
      host_id: host._id,
      photo_album_id: host.populated('photo_album') || host.photo_album
    });

    richComment.save(function (err) {
      if (err) { return callback(err); }
      else { callback (null, richComment); }
    });
  }
};

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