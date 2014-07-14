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
  app.get('/department/pull', authorization.requiresLogin, department.getDepartment);
  app.post('/department/push', authorization.requiresLogin, department.createDepartment);

  app.post('/department/modify', authorization.requiresLogin, department.modifyDepartment);
  app.post('/department/delete', authorization.requiresLogin, department.deleteDepartment);

  app.get('/department/home/:id', authorization.requiresLogin, department.renderHome);

  app.post('/department/:id/sponsor', authorization.requiresLogin, department.department, department.sponsor);

};
