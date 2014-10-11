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
  if (hostData.hostType === 'campaign_detail') {
    hostData.hostType = 'campaign';
  }
  Comment
    .find({
      host_type: hostData.hostType,
      host_id: hostData.hostId,
      status: 'active',
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
    getComments({
      hostType: this.host_type,
      hostId: this.host_id
    }, Date.now(), function (err, comments, nextStartDate) {
      if (err) {
        return callback(err);
      }
      callback({
        comments: comments,
        nextStartDate: nextStartDate
      });
    });
  }

};

mongoose.model('RichComment', RichComment);