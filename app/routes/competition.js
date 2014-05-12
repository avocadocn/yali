'use strict';

var competition = require('../controllers/competition');

var express = require('express');
var config = require('../../config/config');

module.exports = function(app) {
  app.get('/competition/:competitionId', competition.getCompetition);
  app.post('competition/updateFormation/:competitionId', competition.updateFormation);


  app.post('/competition/provoke', competition.provoke);
  app.post('/competition/responseProvoke', competition.responseProvoke);
  app.post('/competition/resultConfirm/:competitionId', competition.resultConfirm);

  app.get('/competition/:groupId', competition.getGroupId);   //只是为了将groupId传进去

  app.param('groupId',competition.competition);
}