'use strict';

// group routes use group controller
var department = require('../controllers/department');
var authorization = require('./middlewares/authorization');
var config = require('../../config/config');
var express = require('express');
var bodyParser = express.bodyParser({
    uploadDir: config.root + '/temp_uploads/',
    limit: 1024 * 1024 * 5 });


module.exports = function(app) {
  app.post('/department/push', authorization.requiresLogin, department.createDepartment);

};
