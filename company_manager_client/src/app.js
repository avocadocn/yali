define([
  'angular',
  'uiRouter',
  'angularBootstrap',
  './storage/storage',
  './utils/utils',
  './account/module',
  './nav/module',
  './company/module',
  './team/module'
], function(angular) {
  return angular.module('app', [
    'ui.router',
    'ui.bootstrap',
    'storage',
    'utils',
    'account',
    'nav',
    'company',
    'team'
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