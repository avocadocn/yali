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
  app.get('/department/pull', department.getDepartment);
  app.post('/department/push', department.createDepartment);

  app.post('/department/modify', department.modifyDepartment);
  app.post('/department/delete', department.deleteDepartment);

  app.get('/department/home/:departmentId', department.renderHome);

  app.post('/department/:departmentId/sponsor', authorization.departmentAuthorize, department.sponsor);

};
