'use strict';

// group routes use group controller
var group = require('../controllers/group');
var authorization = require('./middlewares/authorization');
var express = require('express');
var config = require('../../config/config');
var photoBodyParser = express.bodyParser({
  uploadDir: config.root + '/temp_uploads/',
  limit: 1024 * 500 });


module.exports = function(app) {
  app.get('/group/getgroups', authorization.requiresLogin, group.getGroups);

  app.get('/group/getCompanyGroups/:id', authorization.requiresLogin, group.getCompanyGroups);
  app.get('/group/getCompanyGroups', authorization.requiresLogin, group.getCompanyGroups);


  app.get('/group/home/:groupId', authorization.requiresLogin, group.home);
  app.get('/group/home', authorization.requiresLogin, group.home);

  app.get('/group/info/:groupId', authorization.requiresLogin, group.info);
  app.get('/group/info', authorization.requiresLogin, group.info);

  app.get('/group/renderInfo', authorization.requiresLogin, group.renderInfo);

  app.post('/group/saveInfo', authorization.requiresLogin, group.saveInfo);

  app.get('/group/getCampaigns', authorization.requiresLogin, group.getGroupCampaign);
  app.get('/group/getGroupMessages', authorization.requiresLogin, group.getGroupMessage);
  app.get('/group/getGroupMembers', authorization.requiresLogin, group.getGroupMember);

  app.post('/group/campaignCancel', authorization.requiresLogin, group.campaignCancel);

  app.get('/group/competition/:competitionId', authorization.requiresLogin, group.getCompetition);
  app.post('/group/updateFormation/:competitionId', authorization.requiresLogin, group.updateFormation);
  //小组发布活动
  app.post('/group/campaignSponsor', authorization.requiresLogin, group.sponsor);
  app.param('groupId',group.group);
  app.param('competitionId',group.competition);

  //约战、应战
  app.post('/group/provoke',  authorization.requiresLogin, group.provoke);
  app.post('/group/responseProvoke', authorization.requiresLogin, group.responseProvoke);

  app.post('/group/resultConfirm/:competitionId', authorization.requiresLogin, group.resultConfirm);

  app.post('/group/tempLogo', photoBodyParser, group.tempLogo);
  app.post('/group/saveLogo', group.saveLogo);

  app.get('/group/editLogo', group.editLogo);

  app.get('/groupLogo/:id/:width/:height', group.getLogo);

  app.get('/group/:gid/managePhotoAlbum', group.managePhotoAlbum);
  app.get('/group/:gid/photoAlbum/:photoAlbumId', group.groupPhotoAlbumDetail);

  app.get('/group/competition/:competitionId/photoAlbum/:photoAlbumId', group.competitionPhotoAlbumDetail);


};
