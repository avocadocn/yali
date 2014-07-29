'use strict';

var campaign = require('../controllers/campaign');
var authorization = require('./middlewares/authorization');

module.exports = function(app) {
  app.get('/campaign/getCampaigns/:pageType/:pageId/:campaignType/:start_time', authorization.listAuthorize, campaign.getCampaigns);
  app.post('/campaign/cancel/:campaignId', authorization.campaginAuthorize, campaign.cancelCampaign);
  app.get('/campaign/detail/:campaignId', authorization.campaginAuthorize, campaign.renderCampaignDetail);
  app.get('/campaign/getCampaigns/:campaignId', authorization.campaginAuthorize, campaign.getCampaignDetail);

      //加入、退出活动
  app.post('/campaign/joinCampaign/:campaignId', authorization.campaginAuthorize, campaign.joinCampaign);
  app.post('/campaign/quitCampaign/:campaignId', authorization.campaginAuthorize, campaign.quitCampaign);
  app.post('/campaign/vote/:campaignId', authorization.campaginAuthorize, campaign.vote);


  app.get('/campaign/user/all/calendar/:userId', authorization.userAuthorize,campaign.getUserAllCampaignsForCalendar);
  app.get('/campaign/user/joined/calendar/:userId',authorization.userAuthorize, campaign.getUserJoinedCampaignsForCalendar);
  app.get('/campaign/user/unjoin/calendar/:userId',authorization.userAuthorize, campaign.getUserUnjoinCampaignsForCalendar);

  app.get('/campaign/user/all/list/:userId', authorization.userAuthorize,campaign.getUserAllCampaignsForList);
  app.get('/campaign/user/joined/list/:userId', authorization.userAuthorize,campaign.getUserJoinedCampaignsForList);
  app.get('/campaign/user/unjoin/list/:userId',authorization.userAuthorize, campaign.getUserUnjoinCampaignsForList);

  app.get('/campaign/user/all/applist/:userId', authorization.userAuthorize, campaign.getUserAllCampaignsForAppList);

  app.param('campaignId', campaign.campaign);
};
