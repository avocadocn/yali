define(['angular'], function (angular) {
  return angular.module('navCtrls', []).controller('nav.navCtrl', [
    '$rootScope',
    '$scope',
    '$http',
    'accountService',
    'storageService',
    function ($rootScope, $scope, $http, accountService, storageService) {
      $scope.logout = function () {
        accountService.logout().success(function () {
          storageService.local.remove('cid');
          storageService.local.remove('x-access-token');
          $rootScope.company = null;
          location.pathname = '/company/manager/login';
        });
      };

    }
  ]);
});