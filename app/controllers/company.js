'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  meanConfig = require('../../config/config');


exports.renderHrManagerPage = function(req, res) {
  if (req.session && req.session.uid) {
    res.sendfile('company_manager_client/templates/index.html');
  }
  else {
    res.redirect('/company/manager/login');
  }
};

exports.renderLoginPage = function(req, res) {
  res.sendfile('templates/login.html');
};

