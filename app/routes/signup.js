'use strict';

var signup = require('../controllers/signup');

module.exports = function(app, passport) {
  app.get('/signup', signup.renderSignupPage);
};
