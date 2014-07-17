'use strict';

var competition = require('../controllers/competition');

var express = require('express');
var config = require('../../config/config');
var authorization = require('./middlewares/authorization');
module.exports = function(app) {
  app.get('/competition/:competitionId', authorization.campaginAuthorize, competition.getCompetition);

  app.post('/competition/resultConfirm/:competitionId',authorization.campaginAuthorize, competition.resultConfirm);

  app.param('competitionId',competition.competition);
}