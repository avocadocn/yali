'use strict';

var searchOpponents = angular.module('donler');

searchOpponents.config(['$routeProvider',function ($routeProvider) {
  $routeProvider
    .when('/sameCity/:tid', {
      templateUrl: function(params){
        return '/group/sameCity/'+params.tid;
      },
      controller: 'cityController',
      controllerAs: 'city'
    })
    .when('/nearbyTeam/:tid', {
      templateUrl: function(params){
        return '/group/nearbyTeam/'+params.tid;
      },
      controller: 'nearbyController',
      controllerAs: 'nearby'
    })
    .when('sameCity', {
      templateUrl:'/group/sameCity'
    })
    .otherwise({
      redirectTo: '/sameCity'
    });
}]);

searchOpponents.run(['$rootScope', '$http', function($rootScope,$http) {
  console.log(window.location.hash);
  $rootScope.nowTab = window.location.hash.substr(1);
  $rootScope.selectedStatus = 'unactive';
  $rootScope.$on("$routeChangeStart",function(){
      $rootScope.loading = true;
  });
  $rootScope.$on("$routeChangeSuccess",function(){
      $rootScope.loading = false;
  });
  $rootScope.addactive = function(value) {
    $rootScope.nowTab = value;
  };
  $rootScope.select=function(tid){
    $http.get('/group/oneTeam/'+tid).success(function(data,status){
      $rootScope.myTeam = data;
      $rootScope.selectedStatus = 'unactive';
    });
  };
  $rootScope.changeTeam = function(){
    $rootScope.myTeam = null;
  };

}]);

searchOpponents.controller('cityController',['$http', '$scope', '$rootScope', 'Campaign',
  function($http, $scope, $rootScope, Campaign) {
    //获取选中小队
}]);

searchOpponents.controller('nearbyController',['$http', '$scope', '$rootScope', 'Campaign',
  function($http, $scope, $rootScope, Campaign) {

}]);