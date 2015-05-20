define([
  'angular',
  'bindonce',
  'angulardatatables',
  'uiRouter',
  'angularBootstrap',
  'bootstrap',
  'datetimepicker',
  'datetimepickerLang',
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
], function(angular, bindonce, angulardatatables) {
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
    'search',
    'pasvaz.bindonce',
    'datatables'
  ]).run([
    '$rootScope',
    '$state',
    '$stateParams',
    '$http',
    'storageService',
    'accountService',
    'initData',
    'companyService',
    'DTDefaultOptions',
    function($rootScope, $state, $stateParams, $http, storageService, accountService, initData, companyService, DTDefaultOptions) {
      // set dataTable default display
      DTDefaultOptions.setDisplayLength(25);

      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;

      $rootScope.isAppLoaded = true;

      var token = storageService.local.get('x-access-token');
      if (!token) {
        location.pathname = '/company/manager/login';
        return;
      } else {
        $http.defaults.headers.common['x-access-token'] = token;
        $.ajaxSetup({
          beforeSend: function (xhr)
          {
            xhr.setRequestHeader("x-access-token", token);
          }
        });
        var cid = storageService.local.get('cid');
        if (!cid) {
          location.pathname = '/company/manager/login';
          return;
        }

        $rootScope.company = initData.company;
        $state.go('manager.home');
      }

    }
  ]);
});