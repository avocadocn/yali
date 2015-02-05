define([
  'angular',
  'uiRouter',
  'angularBootstrap',
  './storage/storage',
  './utils/utils',
  './account/module',
  './nav/module',
  './company/module',
  './team/module',
  './campaign/module'
], function(angular) {
  return angular.module('app', [
    'ui.router',
    'ui.bootstrap',
    'storage',
    'utils',
    'account',
    'nav',
    'company',
    'team',
    'campaign'
  ]).run([
    '$rootScope',
    '$state',
    '$stateParams',
    '$http',
    'storageService',
    'accountService',
    function($rootScope, $state, $stateParams, $http, storageService, accountService) {
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;

      var token = storageService.session.get('x-access-token');
      if (!token) {
        $state.go('login');
        return;
      } else {
        $http.defaults.headers.common['x-access-token'] = token;
        var cid = storageService.session.get('cid');
        if (!cid) {
          $state.go('login');
          return;
        }
        accountService.get(cid).success(function (data) {
          $rootScope.company = data;
        });
      }
    }
  ]);
});