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
    .when('/search/:tid',{
      templateUrl: function(params){
        return '/group/sameCity/'+params.tid;
      },
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
    window.location.hash= '#/';
    $rootScope.selectTeamId = null;
    $rootScope.selectedStatus='unactive';
  };
  $rootScope.needSearch=0;
  $rootScope.search = function(keyEvent){
    if(!keyEvent || keyEvent.which === 13)
      $rootScope.needSearch ++;
  }
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
        //小队选完同城小队个数不会变
        $scope.headline = data.city+"共有"+maxNumber+"+个相关小队"
        $scope.currentPage=1;
        $scope.resultTeams = data.teams;
        if(data.teams.length>0){
          $scope.getOpponentInfo(0);
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
    };
    $scope.loadNextPage=function(){
      $scope.loadPage($scope.currentPage+1);
    };
    $scope.getOpponentInfo=function(index){
      if(index!==$scope.selectedIndex){
        $scope.selectedIndex = index;
        var tid = $scope.resultTeams[index]._id;
        Search.getOpponentInfo(tid,function(status,data){
          if(!status){
            $scope.opponent = data.team;
          }
        });
      }
    };
}]);

searchOpponents.controller('nearbyController',['$http', '$scope', '$rootScope', 'Search',
  function($http, $scope, $rootScope, Search) {
    $rootScope.nowTab = 'nearbyTeam';
    $scope.isShowMap = true;
    $scope.needSetting = $rootScope.myTeam.home_court.length===0;
    //获取附近小队
    //有此函数原因：小队选完，由于有两个主场，附近小队个数可能会变
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
            $scope.getOpponentInfo(0);
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
      if(index!==$scope.selectedIndex){
        $scope.selectedIndex = index;
        var tid = $scope.resultTeams[index]._id;
        Search.getOpponentInfo(tid,function(status,data){
          if(!status){
            $scope.opponent = data.team;
          }
        });
      }
    };
    $scope.toggleHomecourt=function(index){
      $scope.search(index);
    };
    $scope.changeHomecourt=function(){
      $scope.needSetting=true;
    }
    //-地图
    //搜索地图的增加标记函数
    $scope.addMarkers = function(){
      if($scope.map_ready&&$scope.resultTeams.length>0){
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
    //搜索地图的初始化函数
    $scope.fullMapInitialize = function(){
      $scope.fullMap = new AMap.Map("fullMap",{
        rotateEnable:true,
        dragEnable:true,
        zoomEnable:true,
      });
      $scope.map_ready =true;
      $scope.addMarkers();
    };
    
    //设置主场的地址搜索回调
    var placeSearchCallBack = function(bindMap, index){
      return function(data){
        bindMap.clearMap();
        var lngX = data.poiList.pois[0].location.getLng();
        var latY = data.poiList.pois[0].location.getLat();
        if(!$rootScope.myTeam.home_court[index].loc){
          $rootScope.myTeam.home_court[index].loc={'coordinates':[]};
        }
        $rootScope.myTeam.home_court[index].loc.coordinates=[lngX, latY];
        var nowPoint = new AMap.LngLat(lngX,latY);
        var markerOption = {
          map: bindMap,
          position: nowPoint,
          draggable: true
        };
        var mar = new AMap.Marker(markerOption);
        bindMap.setFitView();
        var changePoint = function (e) {
          var p = e.lnglat;
          $rootScope.myTeam.home_court[index].loc.coordinates=[p.getLng(), p.getLat()];
        };
        AMap.event.addListener(mar,"dragend", changePoint);
      }
    };
    //绑定主场搜索函数
    $scope.MSearch=[];
    var bindPlaceSearch = function(bindMap,index){
      bindMap.plugin(["AMap.PlaceSearch"], function() {
        $scope.MSearch[index] = new AMap.PlaceSearch({ //构造地点查询类
          pageSize:1,
          pageIndex:1,
          city: $scope.city
        });
        AMap.event.addListener($scope.MSearch[index], "complete", placeSearchCallBack(bindMap,index));//返回地点查询结果
      });
    };
    //显示主场地图时初始化标记及增加位置变更的监听事件
    var initializeMarkers = function(){
      var homecourts = $rootScope.myTeam.home_court;
      for(var i =0;i<homecourts.length;i++){
        if(homecourts[i].name!==''){
          var piont = new AMap.LngLat(homecourts[i].loc.coordinates[0],homecourts[i].loc.coordinates[1]);
          $scope.locationmap[i].setZoomAndCenter(15,piont);
          var markerOption = {
              map: $scope.locationmap[i],
              position: piont,
              draggable: true
          };
          var mar = new AMap.Marker(markerOption);
          var changePoint = function (e) {
              var p = e.lnglat;
              $rootScope.myTeam.home_court[i].loc.coordinates=[p.getLng(), p.getLat()];
          };
          AMap.event.addListener(mar,"dragend", changePoint);
        }
      }
    };
    //设置设置主场地图时初始化城市
    var searchCity=function(){
      $scope.locationmap[0].plugin(["AMap.CitySearch"], function() {
        var citysearch = new AMap.CitySearch();
        citysearch.getLocalCity();
        AMap.event.addListener(citysearch, "complete", function(result){
          if(result && result.city && result.bounds) {
            var citybounds = result.bounds;
            $scope.city = result.city;
            bindPlaceSearch($scope.locationmap[0],0);
            bindPlaceSearch($scope.locationmap[1],1);
          }
        });
        AMap.event.addListener(citysearch, "error", function(result){alert(result.info);});
      });
    };
    //设置主场地图的初始化函数
    $scope.setMapsInitialize = function(){
      $scope.locationmap=[{},{}];
      $scope.locationmap[0] = new AMap.Map("courtMap1");
      $scope.locationmap[1] = new AMap.Map("courtMap2");
      initializeMarkers();
      if($scope.city){
        bindPlaceSearch($scope.locationmap[0],0);
        bindPlaceSearch($scope.locationmap[1],1);
      }
      else {
        searchCity();
      }
      $scope.maps_ready =true;
    };
    $scope.$watch("needSetting",function(value){//刚进页面的初始化
      if(!value){
        if(!$scope.map_ready){//如果没有加载过地图script则加载
          window.fullMapInitialize = function(){
              $scope.fullMapInitialize();
          };
          var script = document.createElement("script");
          script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=fullMapInitialize";
          document.body.appendChild(script);
        }
      }
      else{
        if(!$scope.maps_ready){
          window.setMapsInitialize = function(){
              $scope.setMapsInitialize();
          };
          var script = document.createElement("script");
          script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=setMapsInitialize";
          document.body.appendChild(script);
        }
      }
    });
    //修改主场地址后改变地图点
    $scope.changeLocation = function(index){
      if ($scope.MSearch[index]!='') {
        $scope.MSearch[index].search($rootScope.myTeam.home_court[index].name); 
      }
      else{
        $timeout(function(){
          $scope.MSearch[index].search($rootScope.myTeam.home_court[index].name);
        },0);
      }
    };
    $scope.saveHomecourt = function(){
      if($rootScope.myTeam.home_court.length===0){
        alertify.alert('请填写至少一个主场啊亲~');
      }
      else{
        $http.post('/group/saveInfo/'+$rootScope.myTeam._id,{'homecourt':$rootScope.myTeam.home_court})
        .success(function(data,status){
          $scope.needSetting=false;
          $scope.search(0);
        })
        .error(function(data,status){
          alertify.alert('保存出错,请刷新页面后重试!');
        });
      }
    };
}]);

searchOpponents.controller('searchController',['$http', '$scope', '$rootScope', 'Search',
  function($http, $scope, $rootScope, Search) {
    $rootScope.nowTab="search";

    $scope.searchTeam=function(){
      Search.searchTeam($rootScope.tid,$rootScope.keywords,0,function(status,data){
        if(!status){
          var maxNumber = (data.maxPage-1)*10;
          if(data.maxPage===1 &&data.maxPage<10)
            maxNumber = data.teams.length;
          $scope.headline = "&quot;"+$rootScope.keywords+"&quot;共有"+maxNumber+"+个相关小队";
          $scope.currentPage=1;
          $scope.resultTeams = data.teams;
          if(data.teams.length>0){
            $scope.getOpponentInfo(0);
          }
          $scope.maxPage = data.maxPage;
          var showMaxPage = $scope.maxPage>5? 5:$scope.maxPage;
          $scope.pages=[];
          for(var i=1;i<=showMaxPage;i++){
            $scope.pages.push(i);
          }
        }
      });
    };
    $rootScope.$watch("needSearch",function(value){
      if(value){
        $scope.searchTeam();
      }
    });
    $scope.getOpponentInfo=function(index){
      if(index!==$scope.selectedIndex){
        $scope.selectedIndex = index;
        var tid = $scope.resultTeams[index]._id;
        Search.getOpponentInfo(tid,function(status,data){
          if(!status){
            $scope.opponent = data.team;
          }
        });
      }
    };
    $scope.loadPage=function(pageNumber){
      $scope.currentPage=pageNumber;
      Search.searchTeam($rootScope.tid,$rootScope.keywords,function(status,data){
        if(!status){
          $scope.resultTeams = data.teams;
          if(data.teams.length>0){
            $scope.getOpponentInfo(data.teams[0]._id);
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
    };
    $scope.loadNextPage=function(){
      $scope.loadPage($scope.currentPage+1);
    };
}]);

searchOpponents.controller('ProvokeController',['$http', '$scope', '$rootScope', 'Campaign',
  function($http, $scope, $rootScope, Campaign) {

}]);
