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
    .when('/sameCity', {
      templateUrl:'/group/sameCity'
    })
    .otherwise({
      redirectTo: '/sameCity'
    });
}]);

searchOpponents.run(['$rootScope', '$http', function($rootScope,$http) {
  $rootScope.nowTab = window.location.hash.substr(2);
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
    window.location.hash = '#/sameCity/'+tid;
    $rootScope.selectedStatus = 'active';
    $rootScope.myTeam = true;
  };
  $rootScope.changeTeam = function(){
    $rootScope.myTeam = null;
    window.location.hash= '#/sameCity';
    $rootScope.selectTeamId = null;
  };

}]);

searchOpponents.controller('cityController',['$http', '$scope', '$rootScope', 'Campaign',
  function($http, $scope, $rootScope, Campaign) {
    $rootScope.nowTab = 'sameCity';
    //获取选中小队信息
    var tid = window.location.hash.split("/")[2];
    $http.get('/group/oneTeam/'+tid).success(function(data,status){
      $rootScope.myTeam = data;
      $rootScope.selectedStatus = 'active';
      $rootScope.selectTeamId = data._id;
    });
    //获取同城小队
    $http.get('/search/sameCityTeam/'+tid).success(function(data,status){
      if(data.result===1){
        $scope.resultTeams = data;
        if(data.length>0)
          $scope.getOpponentInfo(data[0]._id);
      }
    });
    $scope.getOpponentInfo=function(tid){
      $http.get('/group/opponentInfo/'+tid).success(function(data,status){
        if(data.result===1){
          $scope.opponent = data;
        }
      })
    };
}]);

searchOpponents.controller('nearbyController',['$http', '$scope', '$rootScope', 'Campaign',
  function($http, $scope, $rootScope, Campaign) {
    $rootScope.nowTab = 'nearbyTeam';
    var tid = window.location.hash.split("/")[2];
    $http.get('/group/oneTeam/'+tid).success(function(data,status){
      $rootScope.myTeam = data;
      $rootScope.selectedStatus = 'active';
      $rootScope.selectTeamId = data._id;
    });
    $scope.isShowMap = true;
}]);
