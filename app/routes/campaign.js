'use strict';

var campaign = require('../controllers/campaign');


module.exports = function(app) {
  app.get('/campaign/getCampaigns/:pageType/:pageId/:campaignType/:start_time', campaign.getCampaigns);
  app.post('/campaign/cancel', campaign.cancelCampaign);
  app.get('/campaign/detail/:campaignId',campaign.renderCampaignDetail);
  app.get('/campaign/user/all/calendar', campaign.getUserAllCampaignsForCalendar);
  app.get('/campaign/user/joined/calendar', campaign.getUserJoinedCampaignsForCalendar);
  app.get('/campaign/user/unjoin/calendar', campaign.getUserUnjoinCampaignsForCalendar);

  app.get('/campaign/user/all/list', campaign.getUserAllCampaignsForList);
  app.get('/campaign/user/joined/list', campaign.getUserJoinedCampaignsForList);
  app.get('/campaign/user/unjoin/list', campaign.getUserUnjoinCampaignsForList);
};
