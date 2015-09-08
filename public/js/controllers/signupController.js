'use strict';

var app = angular.module('donler', []);
var apiBaseUrl = 'http://' + window.location.hostname + ':3002'+'/v2_0';

app.controller('userSignupController', ['$http', '$scope', '$location', '$timeout', function($http, $scope, $location, $timeout) {
  $http.post(apiBaseUrl + '/search/companies',{name:'上海'})
  .success(function(data, status) {
    $scope.companies = data.companies;
  })

  if(navigator.userAgent.indexOf('Android') >-1) {
    $scope.deviceName = 'Android';
  }
  else {
    $scope.deviceName = 'iOS';
  }
  var years = [];
  for(var i = 2015; i>=1980; i--) {
    years.push(i);
  }
  $scope.years = years;
  $scope.user = {gender: false};

  $scope.selectCompany = function() {
    $scope.user.cid = $scope.company._id;
  };

  $scope.countDown = '';

  $scope.validatePhone = function() {
    $scope.isValidating = true;
    $http.post(apiBaseUrl + '/users/validate', {
      phone: $scope.user.phone,
      from: 'website'
    })
    .success(function(data, status) {
      if(data.active) {
        $scope.tip = '此手机号已被注册！'
      }
      else {
        $scope.tip = '';
        $scope.validated = true;
        //倒计时
        $scope.countDown = 60;
        var myTime = setInterval(function() {
          $scope.countDown--;
          $scope.$digest();
          if($scope.countDown<=0) {
            $scope.countDown = null;
            $scope.$digest();
            clearInterval(myTime);
          }
        }, 1000);
      }
    })
    .error(function(data, status) {
      $scope.tip = data.msg;
    })
  };

  $scope.register = function() {
    if(!$scope.user.cid) {
      $scope.errorMSg = '请选择你的学校';
    }
    else if(!$scope.user.enrollment>1970) {
      $scope.errorMSg = '请选择入学时间';
    }
    else {
      var sendData = $scope.user;
      sendData.from = 'website';
      $http.post(apiBaseUrl + '/users', sendData).success(function(data, status) {
        $scope.success = true;
      })
      .error(function(data, status) {
        $scope.errorMSg = data.msg;
      })
    }
  };
}])