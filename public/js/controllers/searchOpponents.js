'use strict';

var searchOpponents = angular.module('donler');

searchOpponents.config(['$routeProvider',function ($routeProvider) {
  $routeProvider
    .when('/sameCity/:uid', {
      templateUrl: function(params){
        return '/users/editInfo/'+params.uid;
      },
      controller: 'cityController',
      controllerAs: 'account'
    })
    .when('/timeLine/:uid', {
      templateUrl: function(params){
        return '/users/timeline/'+params.uid;
      }
    })
    .otherwise({
      redirectTo: '/'
    });
}]);

searchOpponents.run(['$rootScope', '$http', function($rootScope,$http) {
  $rootScope.select=function(teamId){
    $http.get('').success(function(err,data){
      
    });
  }
}]);

searchOpponents.controller('cityController',['$http', '$scope', '$rootScope', 'Campaign',
  function($http, $scope, $rootScope, Campaign) {

}]);