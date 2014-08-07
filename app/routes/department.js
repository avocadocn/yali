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
  app.get('/departmentTree/:cid/detail', department.getDepartmentTreeDetail);

  app.post('/department', department.createDepartment);
  app.put('/department/:departmentId', authorization.departmentAuthorize, department.modifyDepartment);
  app.delete('/department/:departmentId', authorization.departmentAuthorize, department.deleteDepartment);

  app.get('/department/home/:departmentId', authorization.departmentAuthorize, department.renderHome);


  app.post('/department/:departmentId/sponsor', authorization.departmentAuthorize, department.sponsor);
  app.post('/department/:departmentId/multi_sponsor', authorization.departmentAuthorize, department.multiCampaignSponsor);

  app.post('/department/multi_sponsor/:cid', authorization.departmentAuthorize, department.multiCampaignSponsor);

  app.get('/department/campaigns', department.renderCampaigns);
  app.get('/department/applylist/:departmentId', authorization.departmentAuthorize, department.renderApplyList);

  app.post('/department/managerOperate/:departmentId', authorization.departmentAuthorize, department.managerOperate);
  app.post('/department/memberOperate/:departmentId', authorization.departmentAuthorize, department.memberOperateByRoute);

  app.get('/department/info', department.renderDepartmentInfo);
  app.get('/department/manager', department.renderDepartmentManager);

  app.post('/department/detail/:departmentId', authorization.departmentAuthorize, department.getDepartmentDetail);
  app.get('/department/detail/multi/:cid', department.getMultiDepartmentDetail);
};
