'use strict';

var Message = require('../controllers/message');
var express = require('express');
var config = require('../../config/config');
var authorization = require('./middlewares/authorization');
module.exports = function(app) {

	app.get('/message/private', authorization.requiresLogin, Message.renderPrivate);
  app.get('/message/team', authorization.requiresLogin, Message.renderTeam);
  app.get('/message/company', authorization.requiresLogin, Message.renderCompany);
	app.get('/message/system', authorization.requiresLogin, Message.renderSystem);

	app.get('/message/home', authorization.requiresLogin, Message.home);


	app.get('/message/header', authorization.requiresLogin, Message.messageHeader);  //获取所有未读站内信


	app.post('/message/all', authorization.requiresLogin, Message.messageAll);  //手动获取所有未删站内信

  app.post('/message/pull', authorization.requiresLogin, Message.messageGetByHand);  //手动获取指定类型站内信

  app.post('/message/modify', authorization.requiresLogin, Message.messageGetByHand); //修改站内信状态

	app.post('/message/push/leader', authorization.requiresLogin, Message.leaderSendToMember);
	app.post('/message/push/hr', authorization.requiresLogin, Message.hrSendToMember);
}