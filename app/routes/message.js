'use strict';

var Message = require('../controllers/message');
var express = require('express');
var config = require('../../config/config');
var authorization = require('./middlewares/authorization');
module.exports = function(app) {

  app.get('/message/all', Message.renderAll);

  /* 这些以后站内信分类时会用到
	app.get('/message/private', Message.renderPrivate);
  app.get('/message/team', Message.renderTeam);
  app.get('/message/company', Message.renderCompany);
	app.get('/message/system', Message.renderSystem);
  */

	app.get('/message/home', Message.home);


	app.get('/message/header', Message.messageHeader);  //获取所有未读站内信

  app.post('/message/pull', Message.messageGetByHand);  //手动获取指定类型站内信

  app.post('/message/modify', Message.setMessageStatus); //修改站内信状态

	app.post('/message/push/leader', Message.leaderSendToMember);
  app.post('/message/push/campaign', Message.sendToParticipator);
	app.post('/message/push/hr', Message.hrSendToMember);

}