'use strict';

var campaign = require('../controllers/campaign');


module.exports = function(app) {
  app.get('/campaign/all',campaign.getAllCampaign);
  app.get('/campaign/group/getCampaigns', campaign.getGroupCampaign);
  app.post('/campaign/company/getCampaigns', campaign.getCompanyCampaign);
  app.post('/campaign/user/getCampaigns', campaign.getUserCampaign);

  app.post('/campaign/company/sponsor', campaign.sponsorCompanyCampaign);
  app.post('/campaign/group/sponsor', campaign.sponsorGroupCampaign);
  app.post('/campaign/cancel', campaign.campaignCancel);

  // app.get('/campaign/:groupId', campaign.getGroupId);   //只是为了将groupId传进去

  app.get('/campaign/:id', campaign.getCampaign);
  //app.param('groupId',campaign.group);
};
