'use strict';

// Company routes use company controller
var comment = require('../controllers/comment');
var authorization = require('./middlewares/authorization');
var config = require('../../config/config');

module.exports = function(app, passport) {
  // 为啥要用post请求获取数据？
  app.post('/comment/pull/:commentType/:hostId', authorization.appToken, authorization.commentAuthorize,comment.getComment);
  app.post('/comment/push', comment.setComment);
  app.post('/comment/:commentId/reply', comment.getCommentById, comment.reply);
  app.post('/comment/delete', comment.deleteComment);
  //app
};
