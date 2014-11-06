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
    .when('/', {
      templateUrl:'/group/sameCity'
    })
    .otherwise({
      redirectTo: '/'
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
  $rootScope.getTeam=function(tid){
     $http.get('/group/oneTeam/'+tid).success(function(data,status){
      $rootScope.myTeam = data;
      $rootScope.selectedStatus = 'active';
      $rootScope.selectTeamId = data._id;
    });
  }
  //获取选中小队信息
  var tid = window.location.hash.split("/")[2];
  $rootScope.tid = tid;
  if(tid){
    $rootScope.getTeam(tid);
  }
  $rootScope.addactive = function(value) {
    $rootScope.nowTab = value;
  };
  $rootScope.select=function(tid){
    window.location.hash = '#/sameCity/'+tid;
    $rootScope.selectedStatus = 'active';
    $rootScope.myTeam = true;
    $rootScope.tid = tid;
  };
  $rootScope.changeTeam = function(){
    $rootScope.myTeam = null;
    window.location.hash= '#/sameCity';
    $rootScope.selectTeamId = null;
    $rootScope.selectedStatus='unactive';
  };
}]);

searchOpponents.controller('cityController',['$http', '$scope', '$rootScope', 'Search',
  function($http, $scope, $rootScope, Search) {
    $rootScope.nowTab = 'sameCity';
    //获取同城小队
    Search.searchSameCity($rootScope.tid,1,function(status,data){
      if(!status){
        var maxNumber = (data.maxPage-1)*10;
        if(data.maxPage===1 &&data.maxPage<10)
            maxNumber = data.teams.length;
        $scope.headline = data.city+"共有"+maxNumber+"+个相关小队"
        $scope.currentPage=1;
        $scope.resultTeams = data.teams;
        if(data.teams.length>0){
          $scope.getOpponentInfo(data.teams[0]._id);
          $scope.selectedIndex = 0;
        }
        $scope.maxPage = data.maxPage;
        var showMaxPage = $scope.maxPage>5? 5:$scope.maxPage;
        $scope.pages=[];
        for(var i=1;i<=showMaxPage;i++){
          $scope.pages.push(i);
        }
      }
    });

    $scope.loadPage=function(pageNumber){
      $scope.currentPage=pageNumber;
      Search.searchSameCity($rootScope.tid,pageNumber,function(status,data){
        if(!status){
          $scope.resultTeams = data.teams;
          if(data.teams.length>0){
            $scope.getOpponentInfo(data.teams[0]._id);
            $scope.selectedIndex = 0;
          }
          var start = Math.floor(pageNumber/10)*10+1;
          var end = Math.ceil(pageNumber/10)*10;
          var end = end>$scope.maxPage? $scope.maxPage:end;
          $scope.pages=[];
          for(var i=start;i<=end;i++){
            $scope.pages.push(i);
          }
        }
      });
    };
    $scope.loadPrePage=function(){
      $scope.loadPage($scope.currentPage-1);
    }
    $scope.loadNextPage=function(){
      $scope.loadPage($scope.currentPage+1);
    }
    $scope.getOpponentInfo=function(tid,index){
      $scope.selectedIndex = index;
      Search.getOpponentInfo(tid,function(status,data){
        if(!status){
          $scope.opponent = data.team;
        }
      });
    };
}]);

searchOpponents.controller('nearbyController',['$http', '$scope', '$rootScope', 'Search',
  function($http, $scope, $rootScope, Search) {
    $rootScope.nowTab = 'nearbyTeam';
    $scope.isShowMap = true;
    //获取附近小队
    if($rootScope.myTeam.home_court.length>0){
      Search.searchNearby($rootScope.tid,1,function(status,data){
        if(!status){
          var maxNumber = (data.maxPage-1)*10;
          if(data.maxPage===1 &&data.maxPage<10)
            maxNumber = data.teams.length;
          $scope.headline = "附近共有"+maxNumber+"+个相关小队"
          $scope.currentPage=1;
          $scope.resultTeams = data.teams;
          $scope.maxPage = data.maxPage;
          var showMaxPage = $scope.maxPage>5? 5:$scope.maxPage;
          $scope.pages=[];
          for(var i=1;i<=showMaxPage;i++){
            $scope.pages.push(i);
          }
        }
      });
    }
    
    $scope.loadPage=function(pageNumber){
      $scope.currentPage=pageNumber;
      Search.searchNearby($rootScope.tid,pageNumber,function(status,data){
        if(!status){
          $scope.resultTeams = data.teams;
          if(data.teams.length>0){
            $scope.getOpponentInfo(data.teams[0]._id);
            $scope.selectedIndex = 0;
          }
          var start = Math.floor(pageNumber/10)*10+1;
          var end = Math.ceil(pageNumber/10)*10;
          var end = end>$scope.maxPage? $scope.maxPage:end;
          $scope.pages=[];
          for(var i=start;i<=end;i++){
            $scope.pages.push(i);
          }
        }
      });
    };
    $scope.loadPrePage=function(){
      $scope.loadPage($scope.currentPage-1);
    }
    $scope.loadNextPage=function(){
      $scope.loadPage($scope.currentPage+1);
    }
}]);

searchOpponents.controller('searchController',['$http', '$scope', '$rootScope', 'Search',
  function($http, $scope, $rootScope, Search) {
    $scope.loadPage=function(pageNumber){

    };
}]);

searchOpponents.controller('ProvokeController',['$http', '$scope', '$rootScope', 'Campaign',
  function($http, $scope, $rootScope, Campaign) {

}]);
