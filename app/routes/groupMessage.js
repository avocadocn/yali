'use strict';

var groupMessage = require('../controllers/groupMessage');
var express = require('express');
var config = require('../../config/config');
var authorization = require('./middlewares/authorization');
module.exports = function(app) {
  app.get('/message_list', groupMessage.renderMessageList)
  app.get('/groupMessage/:pageType/:pageId/:start_time', authorization.groupMessageAuthorize, groupMessage.getMessage);
}