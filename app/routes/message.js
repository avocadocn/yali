'use strict';

var Message = require('../controllers/message');
var express = require('express');
var config = require('../../config/config');
var authorization = require('./middlewares/authorization');
module.exports = function(app) {
  app.get('/message/init', authorization.requiresLogin, Message.messageInit);  //自动获取站内信
  app.post('/message/get', authorization.requiresLogin, Message.messageInit);  //手动获取站内信

  app.post('/message/campaign', authorization.requiresLogin, Message.newCampaignCreate);
  app.post('/message/leader', authorization.requiresLogin, Message.leaderSendToMember);
  app.post('/message/hr', authorization.requiresLogin, Message.hrSendToMember);
  app.post('/message/confirm', authorization.requiresLogin, Message.resultConfirm);
}