'use strict';

var campaign = require('../controllers/campaign');

var express = require('express');
var config = require('../../config/config');

module.exports = function(app) {
  app.get('/campaign/group/getCampaigns', campaign.getGroupCampaign);
  app.get('/campaign/company/getCampaigns', campaign.getCompanyCampaign);
  app.get('/campaign/user/getCampaigns', campaign.getUserCampaign);

  app.post('/campaign/company/sponsor', campaign.sponsorCompanyCampaign);
  app.post('/campaign/group/sponsor', campaign.sponsorGroupCampaign);
  app.post('/campaign/cancel', campaign.campaignCancel);

  app.get('/campaign/:groupId', campaign.getGroupId);   //只是为了将groupId传进去

  app.param('groupId',campaign.group);
}