'use strict';

// Arena routes use arena controller
var industry = require('../controllers/industry');

module.exports = function(app, passport) {

  app.get('/industries', industry.getIndustries);

};