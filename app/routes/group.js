'use strict';

// group routes use group controller
var group = require('../controllers/group');
var authorization = require('./middlewares/authorization');
var config = require('../../config/config');
var express = require('express');
var bodyParser = express.bodyParser({
    uploadDir: config.root + '/temp_uploads/',
    limit: '5mb' });


module.exports = function(app) {
  app.get('/group/getgroups', group.getGroups);
  app.get('/group/getCompanyGroups/:companyId', group.getCompanyGroups);
  app.get('/group/page/:teamId', authorization.teamAuthorize, group.teampage);
  app.get('/group/:teamId/info', group.info);
  //获取小队简要信息供弹出窗使用
  //app.get('/group/briefInfo/:teamId', authorization.teamAuthorize, group.getBriefInfo);
  app.get('/group/renderInfo', group.renderInfo);
  app.post('/group/saveInfo/:teamId', group.saveInfo);
  app.get('/group/timeLine/:teamId', authorization.teamAuthorize, group.timeLine);
  app.get('/group/campaign', group.renderCampaigns);
  app.get('/group/getGroupMembers/:teamId', authorization.teamAuthorize, group.getGroupMember);
  app.get('/group/sameCity/:teamId',group.renderSameCity);
  app.get('/group/sameCity',group.renderSameCity);
  app.get('/group/nearbyTeam/:teamId',group.renderSameCity);
  //app.get('/group/getMembers', group.renderMember);
  //激活、关闭小队
  app.post('/group/activateGroup/:teamId', authorization.teamAuthorize, group.activateGroup);
  app.get('/group/getLedTeams',group.getLedTeams);
  app.get('/group/getLedTeams/:teamId',authorization.teamAuthorize,group.getLedTeams);
  app.get('/group/opponentInfo/:teamId',group.getOpponentInfo);
  app.get('/group/competition/:teamId/:competitionId', authorization.teamAuthorize, group.getCompetition);
  //获取小队的tags
  app.get('/group/getTags/:teamId', authorization.teamAuthorize, group.getTags);
  app.post('/group/updateFormation/:teamId/:competitionId', authorization.teamAuthorize, group.updateFormation);
  //小队发布组内活动
  app.post('/group/campaignSponsor/:teamId', group.sponsor);
  //多队活动//暂时没用
  // app.post('/group/campaignSponsor/multi/:cid', group.sponsor);
  app.param('teamId',group.group);
  //约战
  app.post('/group/provoke/:teamId', group.provoke);
  app.post('/group/resultConfirm/:teamId/:competitionId', authorization.teamAuthorize, group.resultConfirm);
  app.get('/group/:teamId/editLogo', authorization.teamAuthorize, group.editLogo);
  app.get('/group/oneTeam/:teamId', group.getOneTeam);
  // for app
  app.get('/group/:teamId/campaigns', authorization.teamAuthorize, group.getCampaignsForApp);

  // 全家福
  app.post('/group/:teamId/family', authorization.teamAuthorize, bodyParser, group.uploadFamily);
  app.get('/group/:teamId/family', authorization.teamAuthorize, group.getFamily);
  app.post('/select/group/:teamId/family/photo/:photoId', authorization.teamAuthorize, group.toggleSelectFamilyPhoto);
  app.delete('/group/:teamId/family/photo/:photoId', authorization.teamAuthorize, group.deleteFamilyPhoto);

};
