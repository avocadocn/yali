'use strict';

var department = angular.module('donler');

department.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/campaign', {
        //templateUrl: '/department/campaign',
        template: '<div>{{campaigns}}</div>',
        controller: 'CampaignCtrl'
      });
  }
]);

department.run(['$rootScope',
  function($rootScope) {
    $rootScope.nowTab = window.location.hash.substr(2);
    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
        $rootScope.message_corner = false;
    };
    $rootScope.loadMap = function(index) {
      $rootScope.loadMapIndex = index;
    };
  }
])

department.controller('SponsorCtrl', ['$http', '$scope', '$rootScope',
  function($http, $scope, $rootScope) {
    $scope.showMapFlag = false;
    $scope.location = {
      name: '',
      coordinates: []
    };
    $("#start_time").on("changeDate", function(ev) {
      var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
      $scope.start_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
      $('#end_time').datetimepicker('setStartDate', dateUTC);
      $('#deadline').datetimepicker('setEndDate', dateUTC);
    });
    $("#end_time").on("changeDate", function(ev) {
      var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
      $scope.end_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
      $('#start_time').datetimepicker('setEndDate', dateUTC);

    });
    $("#deadline").on("changeDate", function(ev) {
      var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
      $scope.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
    });
    $rootScope.$watch('loadMapIndex', function(value) {
      if (value == 1) {
        //加载地图
        if (!window.map_ready) {
          window.campaign_map_initialize = $scope.initialize;
          var script = document.createElement("script");
          script.src = "http://api.map.baidu.com/api?v=2.0&ak=krPnXlL3wNORRa1KYN1RAx3c&callback=campaign_map_initialize";
          document.body.appendChild(script);
        } else {
          $scope.initialize();
        }
      }
    });
    $scope.initialize = function() {
      $scope.locationmap = new BMap.Map("mapDetail"); // 创建Map实例
      $scope.locationmap.centerAndZoom('上海', 15);
      $scope.locationmap.enableScrollWheelZoom(true);
      $scope.locationmap.addControl(new BMap.NavigationControl({
        type: BMAP_NAVIGATION_CONTROL_SMALL
      }));
      var options = {
        onSearchComplete: function(results) {
          // 判断状态是否正确
          if ($scope.local.getStatus() == BMAP_STATUS_SUCCESS) {
            $scope.locationmap.clearOverlays();
            var nowPoint = new BMap.Point(results.getPoi(0).point.lng, results.getPoi(0).point.lat);
            //var myIcon = new BMap.Icon("/img/icons/favicon.ico", new BMap.Size(30,30));
            $scope.locationmap.centerAndZoom(nowPoint, 15);
            var marker = new BMap.Marker(nowPoint); // 创建标注
            $scope.locationmap.addOverlay(marker); // 将标注添加到地图中
            marker.enableDragging(); //可拖拽
            $scope.location.coordinates = [results.getPoi(0).point.lng, results.getPoi(0).point.lat];
            marker.addEventListener("dragend", function changePoint() {
              var p = marker.getPosition();
              $scope.location.coordinates = [p.lng, p.lat];
            });
          }
        }
      };
      $scope.local = new BMap.LocalSearch($scope.locationmap, options);
      window.map_ready = true;
    };

    $scope.showMap = function() {
      if ($scope.location.name == '') {
        $rootScope.donlerAlert('请输入地点');
        return false;
      } else if ($scope.showMapFlag == false) {
        $scope.showMapFlag = true;
        $scope.local.search($scope.location.name);
      } else {
        $scope.local.search($scope.location.name);
      }
    };

    $scope.sponsor = function() {
      try {
        $http({
          method: 'post',
          url: '/department/' + $scope.did + '/sponsor',
          data: {
            theme: $scope.theme,
            location: $scope.location,
            content: $scope.content,
            start_time: $scope.start_time,
            end_time: $scope.end_time,
            member_min: $scope.member_min,
            member_max: $scope.member_max,
            deadline: $scope.deadline
          }
        }).success(function(data, status) {
          //发布活动后跳转到显示活动列表页面
          window.location.reload();

        }).error(function(data, status) {
          //TODO:更改对话框
        });

      } catch (e) {
        console.log(e);
      }
    };
  }
]);

department.controller('CampaignCtrl', ['$http', '$scope', '$rootScope',
  function($http, $scope, $rootScope) {
    $rootScope.$watch('teamId', function(teamId) {
      $http.get('/campaign/getCampaigns/team/' + teamId + '/all/0?' + (Math.round(Math.random() * 100) + Date.now())).success(function(data, status) {
        $scope.campaigns = data.campaigns;
        $rootScope.sum = $scope.campaigns.length;
        if (data.campaigns.length < 20) {
          $scope.loadMore_flag = false;
        } else {
          $scope.loadMore_flag = true;
        }
      });
    });

    $scope.loadMore_flag = true;
    $scope.block = 1;
    $scope.page = 1;
    $scope.pageTime = [0];
    $scope.lastPage_flag = false;
    $scope.nextPage_flag = false;

    $scope.loadMore = function() {
      $http.get('/campaign/getCampaigns/team/' + teamId + '/all/' + new Date($scope.campaigns[$scope.campaigns.length - 1].start_time).getTime() + '?' + (Math.round(Math.random() * 100) + Date.now())).success(function(data, status) {
        if (data.result === 1 && data.campaigns.length > 0) {
          $scope.campaigns = $scope.campaigns.concat(data.campaigns);
          if (data.campaigns.length < 20) {
            $scope.loadMore_flag = false;
          } else {
            $scope.loadMore_flag = true;
          }
          if (++$scope.block == 5) {
            $scope.nextPage_flag = true;
            $scope.loadMore_flag = false;
            if ($scope.page != 1) {
              $scope.lastPage_flag = true;
            }
          }

        } else {
          $scope.loadOver_flag = true;
          $scope.loadMore_flag = false;
          $scope.nextPage_flag = false;
        }
      });
    }
    $scope.changePage = function(flag) {
      var start_time = flag == 1 ? new Date($scope.campaigns[$scope.campaigns.length - 1].start_time).getTime() : $scope.pageTime[$scope.page - 2];
      $http.get('/campaign/getCampaigns/team/' + teamId + '/all/' + start_time + '?' + (Math.round(Math.random() * 100) + Date.now())).success(function(data, status) {
        if (data.result === 1 && data.campaigns.length > 0) {
          if (flag == 1) {
            $scope.page++;
            $scope.pageTime.push(new Date($scope.campaigns[$scope.campaigns.length - 1].start_time).getTime());
          } else {
            $scope.page--;
          }
          $scope.campaigns = data.campaigns;
          $scope.nextPage_flag = false;
          $scope.lastPage_flag = false;
          $scope.loadOver_flag = false;
          $scope.block = 1;
          if (data.campaigns.length < 20) {
            $scope.loadMore_flag = false;
          } else {
            $scope.loadMore_flag = true;
          }
          window.scroll(0, 0);
        } else {
          $scope.nextPage_flag = false;
          $scope.loadMore_flag = false;
          $scope.loadOver_flag = true;
        }
      });
    }
    $scope.getId = function(cid) {
      $scope.campaign_id = cid;
    };
    $scope.join = function(campaign_id, index) {
      try {
        $http({
          method: 'post',
          url: '/users/joinCampaign',
          data: {
            campaign_id: campaign_id
          }
        }).success(function(data, status) {
          if (data.result === 1) {
            //alert('成功加入该活动!');
            $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN_CAMPAIGN_SUCCESS);
            $scope.campaigns[index].join_flag = 1;
            $scope.campaigns[index].member_num++;
          } else {
            $rootScope.donlerAlert(data.msg);
          }
        }).error(function(data, status) {
          $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
        });
      } catch (e) {
        console.log(e);
      }
    };

    $scope.quit = function(campaign_id, index) {
      try {
        $http({
          method: 'post',
          url: '/users/quitCampaign',
          data: {
            campaign_id: campaign_id
          }
        }).success(function(data, status) {
          if (data.result === 1) {
            $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT_CAMPAIGN_SUCCESS);
            //alert('您已退出该活动!');
            $scope.campaigns[index].join_flag = -1;
            $scope.campaigns[index].member_num--;
          } else {
            $rootScope.donlerAlert(data.msg);
          }
        }).error(function(data, status) {
          $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
        });
      } catch (e) {
        console.log(e);
      }
    };
    //应战
    $scope.responseProvoke = function(competition_id) {
      try {
        $http({
          method: 'post',
          url: '/group/responseProvoke',
          data: {
            competition_id: competition_id
          }
        }).success(function(data, status) {
          window.location.reload();
        }).error(function(data, status) {
          $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
        });
      } catch (e) {
        console.log(e);
      }
    };

    $scope.cancel = function(_id) {
      try {
        $http({
          method: 'post',
          url: '/campaign/cancel',
          data: {
            campaign_id: _id
          }
        }).success(function(data, status) {
          window.location.reload();
        }).error(function(data, status) {
          $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
        });
      } catch (e) {
        console.log(e);
      }
    };
  }
])