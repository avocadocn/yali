'use strict';

var group_message = require('../controllers/groupMessage');
var express = require('express');
var config = require('../../config/config');

module.exports = function(app) {
  app.get('/campaign/group/getMessages', group_message.getGroupMessage);
  app.get('/campaign/company/getMessages', group_message.getCompanyMessage);
  app.get('/campaign/user/getMessages', group_message.getUserMessage);

  app.get('/groupMessage/:groupId', group_message.getGroupId);
  //app.param('groupId',group_message.group);
}