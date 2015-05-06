define(['angular', 'init_data'], function (angular, initDataModule) {
  return angular.module('accountCtrls', []).controller('account.loginCtrl', [
    '$rootScope',
    '$scope',
    '$http',
    '$state',
    'accountService',
    'companyService',
    'storageService',
    'initData',
    function ($rootScope, $scope, $http, $state, accountService, companyService, storageService, initDataValue) {
      $scope.loginData = {
        username: '',
        password: ''
      };
      $scope.login = function () {
        accountService.login($scope.loginData)
          .success(function (data) {
            $http.defaults.headers.common['x-access-token'] = data.token;
            storageService.login.set('x-access-token', data.token);
            storageService.login.set('cid', data.id);

            initDataModule.get({
              company: accountService.get(data.id),
              hasLeader: companyService.getHasLeader(data.id)
            }).then(function(initData) {
              $rootScope.company = initData.company;
              initDataValue.company = initData.company;
              initDataValue.hasLeader = initData.hasLeader.hasLeader;
              $state.go('manager.home');
            }, function(err) {
              console.log(err);
              alert('获取公司数据失败，请刷新页面重试');
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
        $scope.domains = []
        $rootScope.company.domains.forEach(function(domain){
          $scope.domains.push({domain:domain})
        });;
        $scope.newDomain ={domain:undefined};
        $scope.addDomain = function () {
          if($scope.domains.length<3){
            $scope.domains.push($scope.newDomain);
            $scope.newDomain.domain = undefined;
          }
        };
        $scope.removeDomain = function (index) {
          $scope.domains.splice(index,1)
        };
        $scope.updateDomain = function () {
          var formatDomains =[]
          $scope.domains.forEach(function(domain){
            formatDomains.push(domain.domain)
          });
          accountService.update($rootScope.company._id,{domain:formatDomains.join(' ')}).success(function (data) {
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

