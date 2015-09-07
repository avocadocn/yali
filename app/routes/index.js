'use strict';

var index = require('../controllers/index');

module.exports = function(app, passport) {
  app.get('/', index.home);
  app.get('/s/:shortId', index.skipUrl);
  app.get('/index/:template', index.template);
};
