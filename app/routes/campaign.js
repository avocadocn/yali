'use strict';

var campaign = require('../controllers/campaign');


module.exports = function(app) {
  app.get('/campaign/getCampaigns/:pageType/:campaignType', campaign.getCampaigns);
  app.get('/campaign/getCampaigns/:pageType', campaign.getCampaigns);
  app.post('/campaign/cancel', campaign.cancelCampaign);
};
