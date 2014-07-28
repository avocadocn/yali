'use strict';

// Company routes use company controller
var comment = require('../controllers/comment');
var authorization = require('./middlewares/authorization');
var config = require('../../config/config');

module.exports = function(app, passport) {
  app.post('/comment/pull/:commentType/:commentId', authorization.commentAuthorize,comment.getComment);
  app.post('/comment/push', comment.setComment);

  app.post('/comment/delete', comment.deleteComment);
};
