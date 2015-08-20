'use strict';

var app = angular.module('donler', []);

app.controller('userSignupController', ['$http', '$scope', function($http, $scope) {
  console.log('...');
  $scope.step = 1;

  $scope.companies = [{name:'上海大学'},{name:'华东师范大学'}];
  
}])