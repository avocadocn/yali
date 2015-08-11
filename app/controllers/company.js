'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  meanConfig = require('../../config/config');


exports.renderHrManagerPage = function(req, res) {
  var rootPath = meanConfig.root;
  //先取消获取html内容的权限认证
  // if (req.session && req.session.mgcid) {
    res.sendfile(path.join(rootPath, 'company_manager_client/templates/index.html'));
  // }
  // else {
  //   res.redirect('/company/manager/login');
  // }
};

exports.renderLoginPage = function(req, res) {
  var rootPath = meanConfig.root;
  res.sendfile(path.join(rootPath, 'company_manager_client/templates/login.html'));
};

