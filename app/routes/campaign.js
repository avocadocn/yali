'use strict';

var campaign = require('../controllers/campaign');


module.exports = function(app) {
  app.get('/campaign/getCampaigns/:pageType/:campaignType/:page', campaign.getCampaigns);
  app.post('/campaign/cancel', campaign.cancelCampaign);
};
