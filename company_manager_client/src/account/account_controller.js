define(['./account', 'uiRouter'], function (account) {
  return account.controller('account.LoginCtrl', [
    '$scope',
    '$http',
    '$state',
    'Account',
    function ($scope, $http, $state, Account) {
      $scope.loginData = {
        username: '',
        password: ''
      };
      $scope.login = function () {
        Account.login($scope.loginData)
          .success(function (data, status) {
            $http.defaults.headers.common['x-access-token'] = data.token;
            alert('登录成功');
            $state.go('home');
          })
          .error(function (data, status) {
            alert(data);
          });
      };
    }
  ]);
});