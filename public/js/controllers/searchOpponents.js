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
    .when('/search',{
      templateUrl:'/group/search',
      controller: 'searchController',
      controllerAs: 'search'
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

searchOpponents.controller('cityController',['$http', '$scope', '$rootScope', 'Search',
  function($http, $scope, $rootScope, Search) {
    $rootScope.nowTab = 'sameCity';
    //获取选中小队信息
    var tid = window.location.hash.split("/")[2];
    $http.get('/group/oneTeam/'+tid).success(function(data,status){
      $rootScope.myTeam = data;
      $rootScope.selectedStatus = 'active';
      $rootScope.selectTeamId = data._id;
    });
    //获取同城小队
    Search.searchSameCity(tid,1,function(status,data){
      if(!status){
        $scope.currentPage=1;
        $scope.resultTeams = data.teams;
        if(data.length>0)
          $scope.getOpponentInfo(data.teams[0]._id);
        var maxPage = data.maxPage;
        var showMaxPage = maxPage>5? 5:maxPage;
        for(i=0;i<showMaxPage;i++){
          $scope.pages.push(i);
        }
      }
      else{
        console.log(status);
      }
    });

    $scope.loadPage=function(pageNumber){
      $scope.currentPage=pageNumber;
      Search.searchSameCity(tid,pageNumber,function(status,data){

      });
    };
    $scope.getOpponentInfo=function(tid){
      $http.get('/group/opponentInfo/'+tid).success(function(data,status){
        if(data.result===1){
          $scope.opponent = data;
        }
      })
    };
}]);

searchOpponents.controller('nearbyController',['$http', '$scope', '$rootScope', 'Search',
  function($http, $scope, $rootScope, Search) {
    $rootScope.nowTab = 'nearbyTeam';
    var tid = window.location.hash.split("/")[2];
    $http.get('/group/oneTeam/'+tid).success(function(data,status){
      $rootScope.myTeam = data;
      $rootScope.selectedStatus = 'active';
      $rootScope.selectTeamId = data._id;
    });
    $scope.isShowMap = true;
    //获取附近小队


    $scope.loadPage=function(pageNumber){

    };
}]);

searchOpponents.controller('searchController',['$http', '$scope', '$rootScope', 'Search',
  function($http, $scope, $rootScope, Search) {
    $scope.loadPage=function(pageNumber){

    };
}]);

searchOpponents.controller('ProvokeController',['$http', '$scope', '$rootScope', 'Campaign',
  function($http, $scope, $rootScope, Campaign) {

}]);
