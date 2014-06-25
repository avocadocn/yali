'use strict';

var campaign = require('../controllers/campaign');


module.exports = function(app) {
  app.get('/campaign/all',campaign.getAllCampaign);
  app.get('/campaign/group/getCampaigns', campaign.getGroupCampaign);
  app.post('/campaign/company/getCampaigns', campaign.getCompanyCampaign);
  app.post('/campaign/user/getCampaigns', campaign.getUserCampaign);


  app.get('/campaign/:id', campaign.getCampaign);
  //app.param('groupId',campaign.group);
};
