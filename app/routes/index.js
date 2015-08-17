'use strict';

var index = require('../controllers/index');

module.exports = function(app, passport) {
  app.get('/', index.home);
};
