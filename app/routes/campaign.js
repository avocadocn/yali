'use strict';

var campaign = require('../controllers/campaign');
var authorization = require('./middlewares/authorization');

module.exports = function(app) {
  app.get('/campaign/getCampaigns/:pageType/:pageId/:campaignType/:campaignPage/:campaignBlock', authorization.listAuthorize, campaign.getCampaigns);
  app.post('/campaign/cancel/:campaignId', campaign.cancelCampaign);
  app.get('/campaign/detail/:campaignId', campaign.getOneNotice, campaign.addRichCommentIfNot, campaign.renderCampaignDetail);
  app.post('/campaign/edit/:campaignId', campaign.editCampaign);

  app.get('/campaign/team/calendar/:teamId', campaign.getTeamCampaigns);
  app.get('/campaign/getMolds/:hostType/:hostId',campaign.getMolds);
      //加入、退出活动
  app.post('/campaign/joinCampaign/:campaignId', campaign.joinCampaign);
  app.post('/campaign/quitCampaign/:campaignId', campaign.quitCampaign);
  // app.post('/campaign/vote/:campaignId', authorization.campaginAuthorize, campaign.vote);

  app.get('/campaign/getDateRecord/:teamId', campaign.getTeamPageCampaignDateRecord);
  app.get('/campaign/getTeamCampaigns/:teamId', campaign.getTeamPageCampaigns);
  app.get('/campaign/recentCommentCampaign', campaign.getScoreBoardMessage, campaign.getRecentCommentCampaigns);
  app.get('/campaign/user/all/calendar/:userId', campaign.getUserAllCampaignsForCalendar);
  app.get('/campaign/user/joined/calendar/:userId',authorization.userAuthorize, campaign.getUserJoinedCampaignsForCalendar);
  app.get('/campaign/user/unjoin/calendar/:userId',authorization.userAuthorize, campaign.getUserUnjoinCampaignsForCalendar);
  //处理应战:接受、拒绝、取消
  app.post('/campaign/dealProvoke/:campaignId', campaign.dealProvoke);
  //已全部用getCampaigns M
  // app.get('/campaign/user/all/list/:userId', authorization.userAuthorize,campaign.getUserAllCampaignsForList);
  // app.get('/campaign/user/joined/list/:userId', authorization.userAuthorize,campaign.getUserJoinedCampaignsForList);
  // app.get('/campaign/user/unjoin/list/:userId',authorization.userAuthorize, campaign.getUserUnjoinCampaignsForList);
  app.get('/campaign/user/recent/list/:userId', authorization.userAuthorize, campaign.getUserCampaignsForHome);
  //app
  app.get('/campaign/getCampaigns/:campaignId/:userId/:appToken', authorization.appToken, authorization.campaginAuthorize, campaign.getCampaignDetail);
  app.get('/campaign/user/all/applist/:page/:userId/:appToken', authorization.appToken, authorization.userAuthorize, campaign.getUserAllCampaignsForAppList);
  app.get('/campaign/user/joined/applist/:page/:userId/:appToken', authorization.appToken, authorization.userAuthorize, campaign.getUserJoinedCampaignsForAppList);
  app.get('/campaign/user/all/appcalendar/:userId/:appToken', authorization.appToken, authorization.userAuthorize, campaign.getUserAllCampaignsForAppCalendar);
  app.get('/campaign/user/now/applist/:userId/:appToken', authorization.appToken, authorization.userAuthorize, campaign.getUserNowCampaignsForAppList);
  app.get('/campaign/user/new/applist/:userId/:appToken', authorization.appToken, authorization.userAuthorize, campaign.getUserNewCampaignsForAppList);
  app.get('/campaign/user/newfinish/applist/:userId/:appToken', authorization.appToken, authorization.userAuthorize, campaign.getUserNewFinishCampaignsForAppList);

  app.param('campaignId', campaign.campaign);
};
