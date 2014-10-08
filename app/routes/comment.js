'use strict';

// Company routes use company controller
var comment = require('../controllers/comment');
var authorization = require('./middlewares/authorization');
var config = require('../../config/config');

module.exports = function(app, passport) {
  app.post('/comment/pull/:commentType/:hostId', authorization.appToken, authorization.commentAuthorize, comment.getComment);
  app.post('/comment/push/:commentType/:hostId', authorization.appToken, authorization.commentAuthorize, comment.setComment);
  app.post('/comment/:commentId/reply', comment.getCommentById, comment.reply);
  app.post('/comment/delete', comment.deleteComment);
  //app
};
