'use strict';

// group routes use group controller
var group = require('../controllers/group');
var authorization = require('./middlewares/authorization');
var utils = require('./middlewares/utils');
var config = require('../../config/config');
var express = require('express');
var bodyParser = express.bodyParser({
    uploadDir: config.root + '/temp_uploads/',
    limit: '5mb' });


module.exports = function(app) {
  app.get('/group/getgroups', group.getGroups);
  app.get('/group/getCompanyGroups/:companyId', group.getCompanyGroups);
  app.get('/group/home/:teamId', utils.nocache, authorization.teamAuthorize, group.home);

  app.get('/group/info/:teamId', authorization.teamAuthorize, group.info);
  //获取小队简要信息供弹出窗使用
  //app.get('/group/briefInfo/:teamId', authorization.teamAuthorize, group.getBriefInfo);
  app.get('/group/renderInfo', group.renderInfo);
  app.post('/group/saveInfo/:teamId', authorization.teamAuthorize, group.saveInfo);
  app.get('/group/timeLine/:teamId', authorization.teamAuthorize, group.timeLine);
  app.get('/group/campaign', group.renderCampaigns);

  app.get('/group/getGroupMembers/:teamId', authorization.teamAuthorize, group.getGroupMember);
  //app.get('/group/getMembers', group.renderMember);
  //激活、关闭小队
  app.post('/group/activateGroup/:teamId', authorization.teamAuthorize, group.activateGroup);
  app.get('/group/getSimiliarTeams/:teamId',authorization.teamAuthorize,group.getSimiliarTeams);
  app.get('/group/competition/:teamId/:competitionId', authorization.teamAuthorize, group.getCompetition);



  app.post('/group/updateFormation/:teamId/:competitionId', authorization.teamAuthorize, group.updateFormation);
  //小队发布活动
  app.post('/group/campaignSponsor/:teamId', authorization.teamAuthorize, group.sponsor);
  app.param('teamId',group.group);
  //约战、应战
  app.post('/group/provoke/:teamId', authorization.teamAuthorize, group.provoke);
  app.post('/group/responseProvoke/:teamId', authorization.teamAuthorize, group.responseProvoke);

  app.post('/group/resultConfirm/:teamId/:competitionId', authorization.teamAuthorize, group.resultConfirm);

  app.get('/group/:teamId/editLogo', authorization.teamAuthorize, group.editLogo);

  app.post('/group/oneTeam/:teamId', authorization.teamAuthorize, group.getOneTeam);

  // for app
  app.get('/group/:teamId/campaigns', authorization.teamAuthorize, group.getCampaignsForApp);

  // 全家福
  app.post('/group/:teamId/family', authorization.teamAuthorize, bodyParser, group.uploadFamily);
  app.get('/group/:teamId/family', authorization.teamAuthorize, group.getFamily);
  app.post('/select/group/:teamId/family/photo/:photoId', authorization.teamAuthorize, group.toggleSelectFamilyPhoto);
  app.delete('/group/:teamId/family/photo/:photoId', authorization.teamAuthorize, group.deleteFamilyPhoto);

};
