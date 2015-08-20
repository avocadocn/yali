'use strict';

// Company routes use company controller
var signup = require('../controllers/signup');

module.exports = function(app, passport) {
  // app.get('/', company.renderHrManagerPage);
  app.get('/signup', signup.renderSignupPage);
  app.get('/signup/success', signup.renderSignupSuccessPage);
  app.get('/signup/fail', signup.renderSignupFailPage);
};
