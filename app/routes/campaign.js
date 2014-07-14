'use strict';

var campaign = require('../controllers/campaign');
var authorization = require('./middlewares/authorization');

module.exports = function(app) {
  app.get('/campaign/getCampaigns/:pageType/:pageId/:campaignType/:start_time', authorization.listAuthorize, campaign.getCampaigns);
  app.post('/campaign/cancel/:campaignId', authorization.campaginAuthorize, campaign.cancelCampaign);
  app.get('/campaign/detail/:campaignId', authorization.campaginAuthorize,campaign.renderCampaignDetail);
      //加入、退出活动
  app.post('/campaign/joinCampaign/:campaignId', authorization.campaginAuthorize, campaign.joinCampaign);
  app.post('/campaign/quitCampaign/:campaignId', authorization.campaginAuthorize, campaign.quitCampaign);
  app.get('/campaign/user/all/calendar', campaign.getUserAllCampaignsForCalendar);
  app.get('/campaign/user/joined/calendar', campaign.getUserJoinedCampaignsForCalendar);
  app.get('/campaign/user/unjoin/calendar', campaign.getUserUnjoinCampaignsForCalendar);

  app.get('/campaign/user/all/list', campaign.getUserAllCampaignsForList);
  app.get('/campaign/user/joined/list', campaign.getUserJoinedCampaignsForList);
  app.get('/campaign/user/unjoin/list', campaign.getUserUnjoinCampaignsForList);

  app.param('campaignId', campaign.campaign);
};
