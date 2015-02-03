define(['./account', 'uiRouter'], function (account) {
  return account.controller('account.LoginCtrl', [
    '$scope',
    '$http',
    '$state',
    'accountService',
    'storageService',
    function ($scope, $http, $state, accountService, storageService) {
      $scope.loginData = {
        username: '',
        password: ''
      };
      $scope.login = function () {
        accountService.login($scope.loginData)
          .success(function (data, status) {
            $http.defaults.headers.common['x-access-token'] = data.token;
            storageService.session.set('x-access-token', data.token);
            storageService.session.set('cid', data.id);
            $state.go('home');
          })
          .error(function (data, status) {
            alert(data.msg);
          });
      };


    }
  ]);
});