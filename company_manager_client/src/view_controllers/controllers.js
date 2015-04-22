define([
  'angular',
  'view_controllers/account',
  'view_controllers/campaign',
  'view_controllers/company',
  'view_controllers/department',
  'view_controllers/layout',
  'view_controllers/member',
  'view_controllers/nav',
  'view_controllers/statistics',
  'view_controllers/team'
], function (angular) {
  return angular.module('controllers', [
    'accountCtrls',
    'campaignCtrls',
    'companyCtrls',
    'departmentCtrls',
    'layoutCtrls',
    'memberCtrls',
    'navCtrls',
    'statisticsCtrls',
    'teamCtrls'
  ]);
});