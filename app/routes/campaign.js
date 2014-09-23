'use strict';

var campaign = require('../controllers/campaign');
var authorization = require('./middlewares/authorization');

module.exports = function(app) {
  app.get('/campaign/getCampaigns/:pageType/:pageId/:campaignType/:campaignPage/:campaignBlock', authorization.listAuthorize, campaign.getCampaigns);
  app.post('/campaign/cancel/:campaignId', authorization.campaginAuthorize, campaign.cancelCampaign);
  app.get('/campaign/detail/:campaignId', authorization.campaginAuthorize, campaign.renderCampaignDetail);
  app.post('/campaign/edit/:campaignId', authorization.campaginAuthorize, campaign.editCampaign);

  app.get('/campaign/team/calendar/:teamId', campaign.getTeamCampaigns);

      //加入、退出活动
  app.post('/campaign/joinCampaign/:campaignId', authorization.campaginAuthorize, campaign.joinCampaign);
  app.post('/campaign/quitCampaign/:campaignId', authorization.campaginAuthorize, campaign.quitCampaign);
  app.post('/campaign/vote/:campaignId', authorization.campaginAuthorize, campaign.vote);


  app.get('/campaign/user/all/calendar/:userId', authorization.userAuthorize,campaign.getUserAllCampaignsForCalendar);
  app.get('/campaign/user/joined/calendar/:userId',authorization.userAuthorize, campaign.getUserJoinedCampaignsForCalendar);
  app.get('/campaign/user/unjoin/calendar/:userId',authorization.userAuthorize, campaign.getUserUnjoinCampaignsForCalendar);
  
  //已全部用getCampaigns M
  // app.get('/campaign/user/all/list/:userId', authorization.userAuthorize,campaign.getUserAllCampaignsForList);
  // app.get('/campaign/user/joined/list/:userId', authorization.userAuthorize,campaign.getUserJoinedCampaignsForList);
  // app.get('/campaign/user/unjoin/list/:userId',authorization.userAuthorize, campaign.getUserUnjoinCampaignsForList);
  app.get('/campaign/user/recent/list/:userId', authorization.userAuthorize, campaign.getUserNowCampaignsForAppList);
  //app
  app.get('/campaign/getCampaigns/:campaignId/:userId/:appToken', authorization.appToken, authorization.campaginAuthorize, campaign.getCampaignDetail);
  app.get('/campaign/getCampaignCommentsAndPhotos/:campaignId/:userId/:appToken', authorization.appToken, authorization.campaginAuthorize, campaign.getCampaignCommentsAndPhotos);
  app.get('/campaign/user/all/applist/:page/:userId/:appToken', authorization.appToken, authorization.userAuthorize, campaign.getUserAllCampaignsForAppList);
  app.get('/campaign/user/joined/applist/:page/:userId/:appToken', authorization.appToken, authorization.userAuthorize, campaign.getUserJoinedCampaignsForAppList);
  app.get('/campaign/user/all/appcalendar/:userId/:appToken', authorization.appToken, authorization.userAuthorize, campaign.getUserAllCampaignsForAppCalendar);
  app.get('/campaign/user/now/applist/:userId/:appToken', authorization.appToken, authorization.userAuthorize, campaign.getUserNowCampaignsForAppList);
  app.get('/campaign/user/new/applist/:userId/:appToken', authorization.appToken, authorization.userAuthorize, campaign.getUserNewCampaignsForAppList);
  app.get('/campaign/user/newfinish/applist/:userId/:appToken', authorization.appToken, authorization.userAuthorize, campaign.getUserNewFinishCampaignsForAppList);

  app.param('campaignId', campaign.campaign);
};
