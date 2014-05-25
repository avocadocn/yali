'use strict';

// group routes use group controller
var group = require('../controllers/group');
var authorization = require('./middlewares/authorization');
var express = require('express');
var config = require('../../config/config');
var fileBodyParser = express.bodyParser({
  uploadDir: config.root + '/temp_uploads/',
  limit: 1024 * 1024 * 5 });


module.exports = function(app) {
  app.get('/group/getgroups', group.getGroups);
  app.get('/group/getCompanyGroups', authorization.requiresLogin, group.getCompanyGroups);
  app.get('/group/home/:teamId', authorization.requiresLogin,group.authorize, group.home);

  app.get('/group/info/:teamId', authorization.requiresLogin, group.info);

  app.get('/group/renderInfo', authorization.requiresLogin, group.renderInfo);
  app.post('/group/saveInfo', authorization.requiresLogin, group.saveInfo);
  app.get('/group/timeLine', authorization.requiresLogin, group.timeLine);
  app.get('/group/campaign', authorization.requiresLogin, group.renderCampaigns);
  app.get('/group/getCampaigns/:teamId', authorization.requiresLogin, group.getGroupCampaign);
  app.get('/group/getGroupMessages/:teamId', authorization.requiresLogin, group.getGroupMessage);
  app.get('/group/getGroupMembers/:teamId', authorization.requiresLogin, group.getGroupMember);
  app.get('/group/getMembers', authorization.requiresLogin, group.renderMember);

  app.post('/group/campaignCancel', authorization.requiresLogin, group.campaignCancel);

  app.get('/group/competition/:competitionId', authorization.requiresLogin, group.getCompetition);
  app.get('/group/campaign/:campaignId', authorization.requiresLogin, group.getCampaign);

  app.post('/group/updateFormation/:competitionId', authorization.requiresLogin, group.updateFormation);
  //小组发布活动
  app.post('/group/campaignSponsor/:teamId', authorization.requiresLogin, group.sponsor);
  app.param('teamId',group.group);
  app.param('competitionId',group.competition);

  //约战、应战
  app.post('/group/provoke/:teamId',  authorization.requiresLogin, group.provoke);
  app.post('/group/responseProvoke/:teamId', authorization.requiresLogin, group.responseProvoke);

  app.post('/group/resultConfirm/:competitionId', authorization.requiresLogin, group.resultConfirm);

  app.post('/group/saveLogo', authorization.requiresLogin,fileBodyParser, group.saveLogo);

  app.get('/group/editLogo', authorization.requiresLogin, group.editLogo);

  app.get('/groupLogo/:id/:width/:height',authorization.requiresLogin, group.getLogo);

  app.get('/group/:teamId/managePhotoAlbum', authorization.requiresLogin,group.managePhotoAlbum);
  app.get('/group/:tid/photoAlbum/:photoAlbumId', authorization.requiresLogin, authorization.requiresLogin, group.groupPhotoAlbumDetail);

  app.get('/group/competition/:competitionId/photoAlbum/:photoAlbumId', authorization.requiresLogin, group.competitionPhotoAlbumDetail);
  app.get('/group/campaign/:campaignId/photoAlbum/:photoAlbumId', authorization.requiresLogin, group.campaignPhotoAlbumDetail);
  app.post('/group/oneTeam',authorization.requiresLogin, group.getOneTeam);

  // for app
  app.get('/group/:teamId/campaigns', authorization.requiresLogin, group.getCampaignsForApp);

};
