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
    $rootScope.getTeam(tid);
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
    $scope.getOpponentInfo=function(index){
      $scope.selectedIndex = index;
      var tid = $scope.resultTeams[index]._id;
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
    $scope.search=function(hc_index) {
      Search.searchNearby($rootScope.tid,1,hc_index,function(status,data){
        if(!status){
          $scope.homecourtIndex=hc_index;
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
          $scope.addMarkers();
        }
      });
    }
    if($rootScope.myTeam.home_court.length>0){
      $scope.search(0);
    }
    $scope.loadPage=function(pageNumber){
      $scope.currentPage=pageNumber;
      Search.searchNearby($rootScope.tid,pageNumber,$scope.homecourtIndex,function(status,data){
        if(!status){
          $scope.resultTeams = data.teams;
          if(data.teams.length>0){
            $scope.getOpponentInfo(data.teams[0]._id);
            $scope.selectedIndex = 0;
          }
          var start = Math.floor(pageNumber/10)*10+1;
          var end = Math.ceil(pageNumber/10)*10;
          var end = end>$scope.maxPage? $scope.maxPage:end;
          $scope.addMarkers();
          $scope.pages=[];
          for(var i=start;i<=end;i++){
            $scope.pages.push(i);
          }
        }
      });
    };
    $scope.loadPrePage=function(){
      $scope.loadPage($scope.currentPage-1);
    };
    $scope.loadNextPage=function(){
      $scope.loadPage($scope.currentPage+1);
    };
    $scope.getOpponentInfo=function(index){
      $scope.isShowMap = false;
      $scope.selectedIndex = index;
      var tid = $scope.resultTeams[index]._id;
      Search.getOpponentInfo(tid,function(status,data){
        if(!status){
          $scope.opponent = data.team;
        }
      });
    };
    $scope.toggleHomecourt=function(index){
      $scope.search(index);
    };

    //-地图
    $scope.fullMapInitialize = function(){
      $scope.fullMap = new AMap.Map("fullMap",{
        rotateEnable:true,
        dragEnable:true,
        zoomEnable:true,
      });
      window.map_ready =true;
      $scope.addMarkers();
    };
    $scope.addMarkers = function(){
      if(window.map_ready&&$scope.resultTeams.length>0){
        //清除地图的标记
        $scope.fullMap.clearMap();
        //增加标记
        var points=[],markers=[];
        for(var i=0;i<$scope.resultTeams.length;i++){
          var point = new AMap.LngLat($scope.resultTeams[i].home_court[0].loc.coordinates[0],$scope.resultTeams[i].home_court[0].loc.coordinates[1]);
          var imageNumber = i+1;
          markers[i] = new AMap.Marker({
            icon:"http://webapi.amap.com/images/"+imageNumber+".png",
            map:$scope.fullMap,
            position:point
          });
        }
        $scope.fullMap.setFitView();
      }
    };
    if($rootScope.myTeam.home_court.length>0){
      if(!window.map_ready){//如果没有加载过地图script则加载
        window.fullMapIntialize = function(){
            $scope.fullMapInitialize();
        };
        var script = document.createElement("script");
        script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=fullMapIntialize";
        document.body.appendChild(script);
      }
    }
}]);

searchOpponents.controller('searchController',['$http', '$scope', '$rootScope', 'Search',
  function($http, $scope, $rootScope, Search) {

}]);

searchOpponents.controller('ProvokeController',['$http', '$scope', '$rootScope', 'Campaign',
  function($http, $scope, $rootScope, Campaign) {

}]);
