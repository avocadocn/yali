define([
  'angular',
  'uiRouter',
  'angularBootstrap',
  'bootstrap',
  'datetimepicker',
  'pen',
  'markdown',
  'moment',
  'calendar',
  'jsZip',
  'jsXlsx',
  'view_controllers/controllers',
  './storage/storage',
  './utils/utils',
  './utils/filters',
  './account/module',
  './company/module',
  './team/module',
  './campaign/module',
  './member/module',
  './department/module',
  './search/module'
], function(angular) {
  return angular.module('app', [
    'ui.router',
    'ui.bootstrap',
    'controllers',
    'storage',
    'utils',
    'filters',
    'account',
    'company',
    'team',
    'campaign',
    'member',
    'department',
    'search'
  ]).run([
    '$rootScope',
    '$state',
    '$stateParams',
    '$http',
    'storageService',
    'accountService',
    'initData',
    'companyService',
    function($rootScope, $state, $stateParams, $http, storageService, accountService, initData, companyService) {
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;

      var token = storageService.session.get('x-access-token');
      if (!token) {
        $state.go('login');
        return;
      } else {
        $http.defaults.headers.common['x-access-token'] = token;
        $.ajaxSetup({
          beforeSend: function (xhr)
          {
            xhr.setRequestHeader("x-access-token", token);
          }
        });
        var cid = storageService.session.get('cid');
        if (!cid) {
          $state.go('login');
          return;
        }

        $rootScope.company = initData.company;
        $state.go('manager.home');
      }

    }
  ]);
});