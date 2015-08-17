'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  meanConfig = require('../../config/config');


exports.renderHrManagerPage = function(req, res) {
  var rootPath = meanConfig.root;
  if (req.session && req.session.uid) {
    res.sendfile(path.join(rootPath, 'company_manager_client/templates/index.html'));
  }
  else {
    res.redirect('/company/manager/login');
  }
};

exports.renderLoginPage = function(req, res) {
  var rootPath = meanConfig.root;
  res.sendfile(path.join(rootPath, 'company_manager_client/templates/login.html'));
};

