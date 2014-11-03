'use strict';

var donler = angular.module('donler');

donler.controller('TeamPageController', ['$rootScope', '$scope', 'Team', function($rootScope, $scope, Team) {

  var data = document.getElementById('data').dataset;
  var teamId = data.id;

  // todo 这并不是好的做法，仅仅是为了下面两个发活动的controller
  $rootScope.teamId = data.id;
  $rootScope.groupId = data.gid;

  Team.getTeamInfo(teamId, function (err, data) {
    if (err) {
      alertify.alert('抱歉，获取数据失败，请刷新页面重试。');
    } else {
      $scope.team = data.team;
      $scope.team._id = teamId;
    }
  });

  // 这并不是一个好的做法，日后可改善。现在暂时按以前的写法，通过rootScope设置活动
  $rootScope.sponsorIndex = function (index) {
    $rootScope.modal_index = index;
    if (index === 1) {//活动
      $('#sponsorCampaignModel').modal('show');
    } else {
      $('#sponsorProvokeModel').modal('show');
    }
  };


}]);

// 应该作为独立的模块，这两个控制器的代码似乎重复了好几次
donler.controller('SponsorController', ['$http', '$scope', '$rootScope', 'Campaign',
  function($http, $scope, $rootScope, Campaign) {
    $scope.showMapFlag = false;

    //打开发活动modal时
    $('#sponsorCampaignModel').on('show.bs.modal', function(e) {
      if (!$scope.moldsgot) {
        Campaign.getMolds('team', $rootScope.teamId, function(status, data) {
          if (!status) {
            $scope.molds = data.molds;
            $scope.moldsgot = true;
            $scope.mold = $scope.molds[0].name;
          }
        });
      }
      //加载地图
      if (!window.map_ready) {
        window.campaign_map_initialize = $scope.initialize;
        var script = document.createElement("script");
        script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=campaign_map_initialize";
        document.body.appendChild(script);
      } else {
        $scope.initialize();
      }
      $scope.location = {
        name: '',
        coordinates: []
      };
      $("#start_time").on("changeDate", function(ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.start_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#end_time').datetimepicker('setStartDate', dateUTC);
      });
      $("#end_time").on("changeDate", function(ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.end_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#start_time').datetimepicker('setEndDate', dateUTC);
      });
    });

    var placeSearchCallBack = function(data) {
      $scope.locationmap.clearMap();
      var lngX = data.poiList.pois[0].location.getLng();
      var latY = data.poiList.pois[0].location.getLat();
      $scope.location.coordinates = [lngX, latY];
      var nowPoint = new AMap.LngLat(lngX, latY);
      var markerOption = {
        map: $scope.locationmap,
        position: nowPoint,
        draggable: true
      };
      var mar = new AMap.Marker(markerOption);
      var changePoint = function(e) {
        var p = mar.getPosition();
        $scope.location.coordinates = [p.getLng(), p.getLat()];
      };
      $scope.locationmap.setFitView();
      AMap.event.addListener(mar, "dragend", changePoint);

    }
    $scope.initialize = function() {
      $scope.locationmap = new AMap.Map("mapDetail"); // 创建Map实例
      $scope.locationmap.plugin(["AMap.CitySearch"], function() {
        //实例化城市查询类
        var citysearch = new AMap.CitySearch();
        //自动获取用户IP，返回当前城市
        citysearch.getLocalCity();
        //citysearch.getCityByIp("123.125.114.*");
        AMap.event.addListener(citysearch, "complete", function(result) {
          if (result && result.city && result.bounds) {
            var citybounds = result.bounds;
            //地图显示当前城市
            $scope.locationmap.setBounds(citybounds);
            $scope.locationmap.plugin(["AMap.PlaceSearch"], function() {
              $scope.MSearch = new AMap.PlaceSearch({ //构造地点查询类
                pageSize: 1,
                pageIndex: 1,
                city: result.city

              });
              AMap.event.addListener($scope.MSearch, "complete", placeSearchCallBack); //返回地点查询结果
            });
          }
        });
        AMap.event.addListener(citysearch, "error", function(result) {
          alert(result.info);
        });
      });
      window.map_ready = true;
    };
    $scope.showMap = function() {
      if ($scope.location.name == '') {
        alertify.alert('请输入地点');
        return false;
      } else if ($scope.showMapFlag == false) {
        $scope.showMapFlag = true;
        $scope.MSearch.search($scope.location.name); //关键字查询
      } else {
        $scope.MSearch.search($scope.location.name); //关键字查询
      }
    };

    $scope.selectMold = function(name) {
      $scope.mold = name;
    };

    $scope.sponsor = function() {
      if ($scope.member_max < $scope.member_min) {
        alertify.alert('最少人数须小于最大人数');
      } else {
        var _data = {
          theme: $scope.theme,
          location: $scope.location,
          start_time: $scope.start_time,
          end_time: $scope.end_time,
          campaign_mold: $scope.mold
        };
        var _url = '/group/campaignSponsor/' + $rootScope.teamId;
        Campaign.sponsor(_url, _data, function(status, data) {
          if (!status) {
            // window.location.reload();
            window.location = '/campaign/detail/' + data.campaign_id + '?stat=editing';
          } else {
            alertify.alert('活动发布出错');
          }
        });
      }
    };
  }
]);

donler.controller('ProvokeController', ['$http', '$scope', '$rootScope', 'Campaign',
  function($http, $scope, $rootScope, Campaign) {
    $scope.search_type = "team";
    $scope.companies = [];
    $scope.teams = [];
    $scope.showMapFlag = false;
    $scope.location = {
      name: '',
      coordinates: []
    };
    $scope.modal = 0;
    $scope.result = 0; //是否已搜索
    $scope.selected_index = -1;

    //决定要打开哪个挑战的modal
    $rootScope.$watch('modal_index', function(value) {
      if (value === 3) {
        $scope.modal = 2;
        Campaign.getLedTeams($rootScope.teamId, function(status, teamdata) {
          if (!status) {
            $scope.ledTeams = teamdata.teams;
            if (teams.length === 1) {
              $scope.modal = 3;
              $scope.team_opposite = $scope.ledTeams[0];
              Campaign.getMolds('team', $rootScope.teamId, function(status, data) {
                if (!status) {
                  $scope.mold = data.molds[0].name;
                  $scope.molds = data.molds;
                  $scope.cid = data.cid;
                }
              });
            }
          }
        });
      } else if (value === 2) {
        $scope.recommandTeam();
      }
      if (value === 2 || value === 3) {
        //加载地图
        if (!window.map_ready) {
          window.campaign_map_initialize = $scope.initialize;
          var script = document.createElement("script");
          script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=campaign_map_initialize";
          document.body.appendChild(script);
        } else {
          $scope.initialize();
        }
      }
    });

    $("#competition_start_time").on("changeDate", function(ev) {
      var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
      $scope.competition_date = moment(dateUTC).format("YYYY-MM-DD HH:mm");
      $('#competition_end_time').datetimepicker('setStartDate', dateUTC);
    });
    $("#competition_end_time").on("changeDate", function(ev) {
      var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
      $('#competition_start_time').datetimepicker('setEndDate', dateUTC);
    });

    $scope.recommandTeam = function() {
      $scope.homecourt = true;

      try {
        $http({
          method: 'post',
          url: '/search/recommandteam',
          data: {
            gid: $rootScope.groupId,
            tid: $rootScope.teamId
          }
        }).success(function(data, status) {
          if (data.result === 1) {
            $scope.teams = data.teams;
          } else if (data.result === 2) //没填主场
            $scope.homecourt = false;
        }).error(function(data, status) {
          console.log('推荐失败');
        });
      } catch (e) {
        console.log(e);
      }
    };

    $scope.search = function() {
      //按公司搜索
      if ($scope.search_type === 'company') {
        $scope.getCompany();
        //按队名搜索
      } else {
        $scope.getTeam();
      }
      $scope.result = 1; //已搜索，显示搜索结果
      $scope.selected_index = -1;
    };
    var placeSearchCallBack = function(data) {
      $scope.locationmap.clearMap();
      var lngX = data.poiList.pois[0].location.getLng();
      var latY = data.poiList.pois[0].location.getLat();
      $scope.location.coordinates = [lngX, latY];
      var nowPoint = new AMap.LngLat(lngX, latY);
      var markerOption = {
        map: $scope.locationmap,
        position: nowPoint,
        draggable: true
      };
      var mar = new AMap.Marker(markerOption);
      var changePoint = function(e) {
        var p = mar.getPosition();
        $scope.location.coordinates = [p.getLng(), p.getLat()];
      };
      $scope.locationmap.setFitView();
      AMap.event.addListener(mar, "dragend", changePoint);
    }
    $scope.initialize = function() {
      $scope.locationmap = new AMap.Map("competitionMapDetail"); // 创建Map实例
      $scope.locationmap.plugin(["AMap.CitySearch"], function() {
        //实例化城市查询类
        var citysearch = new AMap.CitySearch();
        //自动获取用户IP，返回当前城市
        citysearch.getLocalCity();
        //citysearch.getCityByIp("123.125.114.*");
        AMap.event.addListener(citysearch, "complete", function(result) {
          if (result && result.city && result.bounds) {
            var citybounds = result.bounds;
            //地图显示当前城市
            $scope.locationmap.setBounds(citybounds);
            $scope.locationmap.plugin(["AMap.PlaceSearch"], function() {
              $scope.MSearch = new AMap.PlaceSearch({ //构造地点查询类
                pageSize: 1,
                pageIndex: 1,
                city: result.city

              });
              AMap.event.addListener($scope.MSearch, "complete", placeSearchCallBack); //返回地点查询结果
            });
          }
        });
        AMap.event.addListener(citysearch, "error", function(result) {
          alert(result.info);
        });
      });
      window.map_ready = true;
    };

    $scope.showMap = function() {
      if ($scope.location.name == '') {
        alertify.alert('请输入地点');
        return false;
      } else if ($scope.showMapFlag == false) {
        $scope.showMapFlag = true;
        $scope.MSearch.search($scope.location.name); //关键字查询
      } else {
        $scope.MSearch.search($scope.location.name); //关键字查询
      }
    };

    $scope.getCompany = function() {
      try {
        $scope.show_team = [];
        $http({
          method: 'post',
          url: '/search/company',
          data: {
            regx: $scope.s_value
          }
        }).success(function(data, status) {
          $scope.companies = data;
          var tmp = 0;
          for (var i = 0; i < $scope.companies.length; i++) {
            var team_tmp = $scope.companies[i].team;
            $scope.companies[i].team = [];
            for (var j = 0; j < team_tmp.length; j++) {
              if (team_tmp[j].gid === $rootScope.groupId) {
                if (team_tmp[j].id.toString() !== $rootScope.teamId) {
                  $scope.companies[i].team.push(team_tmp[j]);
                }
              }
            }
          }
          $scope.teams = [];
          if ($scope.companies.length <= 0) {
            alertify.alert("没有找到符合条件的公司!");
          } else {
            for (var i = 0; i < $scope.companies.length; i++) {
              $scope.show_team.push(false);
            }
          }
        }).error(function(data, status) {
          alertify.alert('DATA ERROR');
        });
      } catch (e) {
        console.log(e);
      }
    }

    var show_team_index = -1;
    $scope.toggleTeam = function(cid, index) {
      if (show_team_index !== -1)
        $scope.show_team[show_team_index] = false;
      $scope.show_team[index] = true;
      if ($scope.show_team[index] && show_team_index !== index) {
        $scope.getSelectTeam(cid);
        $scope.selected_index = -1;
      }
      show_team_index = index;
    }

    $scope.getSelectTeam = function(cid) {
      try {
        $scope.teams = [];
        $http({
          method: 'post',
          url: '/search/team',
          data: {
            cid: cid,
            gid: $rootScope.groupId,
            tid: $rootScope.teamId,
            operate: 'part'
          }
        }).success(function(data, status) {
          $scope.teams = data;
          var len = $scope.teams.length;
        }).error(function(data, status) {
          alertify.alert('DATA ERROR');
        });
      } catch (e) {
        console.log(e);
      }
    }
    //选择小队
    $scope.getTeam = function() {
      try {
        $http({
          method: 'post',
          url: '/search/team',
          data: {
            regx: $scope.s_value,
            gid: $rootScope.groupId,
            tid: $rootScope.teamId,
            operate: 'all'
          }
        }).success(function(data, status) {
          $scope.teams = data;
          $scope.companies = [];
          if ($scope.teams.length <= 0) {
            alertify.alert("没有找到符合条件的小队!");
          }
        }).error(function(data, status) {
          alertify.alert('DATA ERROR');
        });
      } catch (e) {
        console.log(e);
      }
    };

    //选择对战小队
    $scope.provoke_select = function(index) {
      if (!index) { //在自己队发挑战
        $scope.team_opposite = $scope.teams[$scope.selected_index];
        Campaign.getMolds('team', $rootScope.teamId, function(status, data) {
          if (!status) {
            $scope.mold = data.molds[0].name;
            $scope.user_cid = data.cid;
          }
        });
      } else { //到对方队动
        $scope.team_opposite = $scope.ledTeams[$scope.selected_index];
        Campaign.getMolds('team', $scope.team_opposite._id, function(status, data) {
          if (!status) {
            $scope.mold = data.molds[0].name;
            $scope.molds = data.molds;
            $scope.user_cid = data.cid;
          }
        });
      }
      $scope.modal++;
      $rootScope.loadMapIndex = 2;
    };
    $scope.selectMold = function(name) {
      $scope.mold = name;
    };

    //约战
    $scope.provoke = function() {
      if ($scope.member_max < $scope.member_min) {
        alertify.alert('最少人数须小于最大人数');
      } else {
        var _data = {
          theme: $scope.theme,
          location: $scope.location,
          start_time: $scope.start_time,
          end_time: $scope.end_time,
          campaign_mold: $scope.mold
        };
        var callback = function(status, data) {
          if (!status) {
            window.location = '/campaign/detail/' + data.campaign_id + '?stat=editing';
          } else {
            alertify.alert(data.msg);
          }
        };
        if ($scope.modal === 1) { //在自己的小队约战
          _data.team_opposite_id = $scope.team_opposite._id
          Campaign.sponsor('/group/provoke/' + $rootScope.teamId, _data, callback);
        } else { //在其它小队约战
          _data.team_opposite_id = $rootScope.teamId;
          Campaign.sponsor('/group/provoke/' + $scope.team_opposite._id, _data, callback);
        }
      }
    };

    $scope.preStep = function() {
      $scope.modal--;
    };

    $scope.selcet_team = function(index) {
      $scope.selected_index = index;
    };
  }
]);