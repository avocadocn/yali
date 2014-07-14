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
  app.get('/departmentTree/:cid', department.getDepartment);

  app.post('/department', department.createDepartment);
  app.put('/department/:departmentId', authorization.departmentAuthorize, department.modifyDepartment);
  app.delete('/department/:departmentId', authorization.departmentAuthorize, department.deleteDepartment);

  app.get('/department/home/:departmentId', department.renderHome);

  app.post('/department/:departmentId/sponsor', authorization.departmentAuthorize, department.sponsor);

  app.get('/department/campaigns', department.renderCampaigns);

};
