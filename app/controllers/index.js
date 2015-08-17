'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  meanConfig = require('../../config/config');


exports.home = function(req, res) {
  var rootPath = meanConfig.root;
  res.sendfile(path.join(rootPath, '/public/index.html'));
};