define(['./account'], function (account) {
  return account.controller('account.loginCtrl', [
    '$rootScope',
    '$scope',
    '$http',
    '$state',
    'accountService',
    'storageService',
    function ($rootScope, $scope, $http, $state, accountService, storageService) {
      $scope.loginData = {
        username: '',
        password: ''
      };
      $scope.login = function () {
        accountService.login($scope.loginData)
          .success(function (data) {
            $http.defaults.headers.common['x-access-token'] = data.token;
            storageService.session.set('x-access-token', data.token);
            storageService.session.set('cid', data.id);

            accountService.get(data.id).success(function (data) {
              $rootScope.company = data;
              $state.go('home');
            });

          })
          .error(function (data) {
            alert(data.msg);
          });
      };


    }
  ]);
});