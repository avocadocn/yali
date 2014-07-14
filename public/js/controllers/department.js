'use strict';

var department = angular.module('donler');

department.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {


  }
]);

department.run(['$rootScope',
  function($rootScope) {
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
])