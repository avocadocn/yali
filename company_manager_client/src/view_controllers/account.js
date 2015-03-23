define(['./controller'], function (controllers) {
  return controllers.controller('account.loginCtrl', [
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
  ])
    .controller('account.settingCtrl', [
      '$rootScope',
      '$scope',
      '$http',
      '$state',
      'accountService',
      function ($rootScope, $scope, $http, $state, accountService) {
        $scope.domains = $rootScope.company.domains;
        $scope.newDomain ={};
        $scope.addDomain = function () {
          if($scope.domains.length<3){
            $scope.domains.push($scope.newDomain.domain);
            $scope.newDomain.domain = undefined;
          }
        };
        $scope.removeDomain = function (index) {
          $scope.domains.splice(index,1)
        };
        $scope.updateDomain = function () {
          accountService.update($rootScope.company._id,{domain:$scope.domains.join(' ')}).success(function (data) {
            alert('修改邮箱后缀成功')
          })
          .error(function (data) {
            alert(data.msg);
          });
        };
        $scope.changePassword = function () {
          var passwordData = {
            oldPassword: $scope.oldPassword,
            password: $scope.password
          };
          accountService.update($rootScope.company._id,passwordData).success(function (data) {
            alert('修改密码成功')
          })
          .error(function (data) {
            alert(data.msg);
          });
        };


      }
    ]);
});

