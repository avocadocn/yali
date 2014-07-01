'use strict';

// group routes use group controller
var group = require('../controllers/group');
var authorization = require('./middlewares/authorization');
var config = require('../../config/config');



module.exports = function(app) {
  app.get('/group/getgroups', group.getGroups);
  app.get('/group/getCompanyGroups', group.getCompanyGroups);
  app.get('/group/home/:teamId', authorization.requiresLogin,group.authorize, group.home);

  app.get('/group/info/:teamId', authorization.requiresLogin, group.info);

  app.get('/group/renderInfo', authorization.requiresLogin, group.renderInfo);
  app.post('/group/saveInfo', authorization.requiresLogin, group.saveInfo);
  app.get('/group/timeLine', authorization.requiresLogin, group.timeLine);
  app.get('/group/campaign', authorization.requiresLogin, group.renderCampaigns);

  app.get('/group/getCampaigns/:teamId', authorization.requiresLogin, group.getGroupCampaign);
  app.get('/group/getGroupMembers/:teamId', authorization.requiresLogin, group.getGroupMember);
  //app.get('/group/getMembers', authorization.requiresLogin, group.renderMember);
  //激活、关闭小队
  app.post('/group/activateGroup', authorization.requiresLogin,group.activateGroup);

  app.get('/group/competition/:competitionId', authorization.requiresLogin, group.getCompetition);

  app.get('/group/campaign/:campaignId', authorization.requiresLogin,group.renderCampaignDetail);
  app.get('/group/campaignData', authorization.requiresLogin,group.getCampaignDetail);


  app.post('/group/updateFormation/:competitionId', authorization.requiresLogin, group.updateFormation);
  //小队发布活动
  app.post('/group/campaignSponsor/:teamId', authorization.requiresLogin, group.sponsor);
  app.param('teamId',group.group);
  app.param('competitionId',group.competition);

  //约战、应战
  app.post('/group/provoke/:teamId',  authorization.requiresLogin, group.provoke);
  app.post('/group/responseProvoke/:teamId', authorization.requiresLogin, group.responseProvoke);

  app.post('/group/resultConfirm/:competitionId', authorization.requiresLogin, group.resultConfirm);

  app.get('/group/editLogo', authorization.requiresLogin, group.editLogo);

  app.post('/group/oneTeam',authorization.requiresLogin, group.getOneTeam);

  // for app
  app.get('/group/:teamId/campaigns', authorization.requiresLogin, group.getCampaignsForApp);

};
