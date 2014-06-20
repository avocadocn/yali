'use strict';

var groupMessage = require('../controllers/groupMessage');
var express = require('express');
var config = require('../../config/config');
var authorization = require('./middlewares/authorization');
module.exports = function(app) {
  app.get('/group/message_list', authorization.requiresLogin, groupMessage.renderMessageList)
  app.get('/groupMessage/user', authorization.requiresLogin, groupMessage.getUserMessage);
  app.get('/groupMessage/team', authorization.requiresLogin, groupMessage.getTeamMessage);
}