'use strict';

var app = angular.module('donler', []);
var apiBaseUrl = 'http://' + window.location.hostname + ':3002'+'/v2_0';

app.controller('userSignupController', ['$http', '$scope', '$location', function($http, $scope, $location) {
  //----------------------- step 1 找学校
  $scope.step = 1;
  $scope.showCompanies = false;
  $http.post(apiBaseUrl + '/search/companies',{name:'上海'})
  .success(function(data, status) {
    $scope.companies = data.companies;
    $scope.showCompanies = true;
  })

  $scope.search = function(keyEvent) {
    if($scope.keyword && (keyEvent.which === 13 || !keyEvent)) {
      $http.post(apiBaseUrl + '/search/companies',{name:$scope.keyword})
      .success(function(data, status) {
        $scope.companies = data.companies;
      })
      .error(function(data, status) {
        $scope.companies = [];
      })
    }
  };

  $scope.select = function(company) {
    $scope.step = 2;
    $scope.company = company;
  };

  //----------------------- step 2 输入资料

  $scope.goto = function(step) {
    $scope.step = step;
  };

  //----------------------- step 3 验证手机

  $scope.isValidating = false;
  $scope.validatePhone = function() {
    $scope.isValidating = true;
    $http.post('/users/validate', $scope.user.phone)
  };

  $scope.register = function() {
    $http.post(apiBaseUrl + '/users', $scope.user).success(function(data, status) {
      $location.path('/signup/success');
    })
    .error(function(data, status) {
      $location.path('/signup/fail');
    })
  }
  
}])