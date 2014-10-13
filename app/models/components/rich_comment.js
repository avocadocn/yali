'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Comment = mongoose.model('Comment');

var pageSize = 20;

var RichComment = new Schema({
  host_type: {
    type: String,
    enum: ['campaign', 'photo']
  },
  host_id: Schema.Types.ObjectId,
  enable: {
    type: Boolean,
    default: true
  }
});

/**
 * 获取该组件的评论内容
 * @param {Object} hostData
 * @param {Date} pageStartDate 该页第一个评论的createDate
 * @param {Function} callback callback(err, comments, nextStartDate)
 */
var getComments = function (hostData, pageStartDate, callback) {
  var hostType = hostData.hostType;

  // 兼容旧的数据, 现在只有campaign
  if (hostData.hostType === 'campaign_detail' || hostData.hostType === 'campaign') {
    hostType = { '$in': ['campaign', 'campaign_detail'] };
  }
  Comment
    .find({
      host_type: hostType,
      host_id: hostData.hostId,
      status: { '$ne': 'delete' },
      create_date: {
        '$lte': pageStartDate || Date.now()
      }
    })
    .limit(pageSize + 1).exec()
    .then(function (comments) {
      if (comments.length === pageSize + 1) {
        var nextComment = comments.pop();
        callback(null, comments, nextComment.create_date);
      } else {
        callback(null, comments);
      }
    })
    .then(null, function (err) {
      callback(err);
    });
};

RichComment.statics = {

  getComments: getComments,

  /**
   * 发表评论
   * @param {Object} data 评论内容相关数据
   */
  publish: function (data) {
    // to do: 发表评论
  }

};

RichComment.methods = {

  /**
   * 获取该组件的初始数据, 用于前端directive初始化
   * @param callback callback(data)
   */
  getData: function (callback) {
    var self = this;
    getComments({
      hostType: this.host_type,
      hostId: this.host_id
    }, Date.now(), function (err, comments, nextStartDate) {
      if (err) {
        return callback(err);
      }
      callback({
        hostType: self.host_type,
        hostId: self.host_id,
        comments: comments,
        nextStartDate: nextStartDate
      });
    });
  }

};

mongoose.model('RichComment', RichComment);