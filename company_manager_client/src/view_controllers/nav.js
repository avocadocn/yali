define(['angular'], function (angular) {
  return angular.module('navCtrls', []).controller('nav.navCtrl', [
    '$rootScope',
    '$scope',
    '$http',
    '$state',
    'accountService',
    'storageService',
    function ($rootScope, $scope, $http, $state, accountService, storageService) {
      $scope.logout = function () {
        accountService.logout().success(function () {
          storageService.session.remove('cid');
          storageService.session.remove('x-access-token');
          $rootScope.company = null;
          $state.go('login');
        });
      };

    }
  ]);
});