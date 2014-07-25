'use strict';

var messageApp = angular.module('donler');

messageApp.run(['$http','$rootScope', function ($http, $rootScope) {
  $rootScope.o = 0;
}]);


messageApp.controller('messageHeaderController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
    if(location.pathname != '/message/home'){
      $http.get('/message/header').success(function(data, status) {
          var messages = data.msg;
          $rootScope.o = messages.length;
      });
    }
}]);