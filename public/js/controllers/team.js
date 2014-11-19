'use strict';

var donler = angular.module('donler');

donler.controller('TeamPageController', ['$rootScope', '$scope', '$timeout', '$location', 'Team', 'Campaign', 'anchorSmoothScroll', function($rootScope, $scope, $timeout, $location, Team, Campaign, anchorSmoothScroll) {

  var data = document.getElementById('data').dataset;
  var teamId = data.id;

  // 这并不是好的做法，仅仅是为了下面两个发活动的controller
  $rootScope.teamId = data.id;
  $rootScope.groupId = data.gid;

  Team.getTeamInfo(teamId, function (err, data) {
    if (err) {
      alertify.alert('抱歉，获取数据失败，请刷新页面重试。');
    } else {
      $scope.team = data.team;
      $scope.team._id = teamId;
      $scope.allow = data.allow;
      $scope.isShowHomeCourts = data.isShowHomeCourts;
      $scope.role = data.role;

      $scope.teamInfo = {
        name: $scope.team.name,
        brief: $scope.team.brief
      };
      $scope.team.membersWithLeader = [];
      $scope.team.membersWithLeader = $scope.team.membersWithLeader.concat($scope.team.leaders);
      $scope.team.membersWithLeader = $scope.team.membersWithLeader.concat($scope.team.members);

      $scope.homeCourt = [{
        name: '',
        loc: { coordinates: [] }
      }, {
        name: '',
        loc: { coordinates: [] }
      }];

      for (var i = 0; i < $scope.team.homeCourts.length; i++) {
        var homeCourt = $scope.team.homeCourts[i];
        if (homeCourt.name) {
          $scope.homeCourt[i] = homeCourt;
        }
        if (homeCourt.loc && homeCourt.loc.coordinates && homeCourt.loc.coordinates.length === 2) {
          $scope['showMap' + (i+1)] = true;
        }
      }

      if (!window.map_ready) { //如果没有加载过地图script则加载
        window.court_map_initialize = function() {
          $scope.initialize();
        };
        var script = document.createElement("script");
        script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=court_map_initialize";
        document.body.appendChild(script);
      }

    }
  });

  // 编辑小队信息
  $scope.isEditingInfo = false;
  $scope.editInfo = function () {
    $scope.isEditingInfo = true;
  };
  $scope.saveInfo = function () {
    Team.saveInfo(teamId, $scope.teamInfo, function (err) {
      if (err) {
        alertify.alert(err);
      } else {
        $scope.team.name = $scope.teamInfo.name;
        $scope.team.brief = $scope.teamInfo.brief;
        $scope.isEditingInfo = false;
      }
    });
  };
  $scope.cancelEditInfo = function () {
    $scope.isEditingInfo = false;
    $scope.teamInfo.name = $scope.team.name;
    $scope.teamInfo.brief = $scope.team.brief;
  };


  // 编辑主场
  $scope.MSearch1 = '';
  $scope.MSearch2 = '';
  $scope.city = '';

  var placeSearchCallBack = function(bindMap, index) {
    return function(data) {
      bindMap.clearMap();
      var lngX = data.poiList.pois[0].location.getLng();
      var latY = data.poiList.pois[0].location.getLat();
      $scope.homeCourt[index].loc.coordinates = [lngX, latY];
      var nowPoint = new AMap.LngLat(lngX, latY);
      var markerOption = {
        map: bindMap,
        position: nowPoint,
        draggable: true
      };
      var mar = new AMap.Marker(markerOption);
      bindMap.setFitView();
      var changePoint = function(e) {
        var p = e.lnglat;
        $scope.homeCourt[index].loc.coordinates = [p.getLng(), p.getLat()];
      };
      AMap.event.addListener(mar, "dragend", changePoint);
    }
  };

  var bindPlaceSearch = function(bindMap, index) {
    bindMap.plugin(["AMap.PlaceSearch"], function() {
      if (index == 0) {
        $scope.MSearch1 = new AMap.PlaceSearch({ //构造地点查询类
          pageSize: 1,
          pageIndex: 1,
          city: $scope.city

        });
        AMap.event.addListener($scope.MSearch1, "complete", placeSearchCallBack(bindMap, index)); //返回地点查询结果
      } else {
        $scope.MSearch2 = new AMap.PlaceSearch({ //构造地点查询类
          pageSize: 1,
          pageIndex: 1,
          city: $scope.city

        });
        AMap.event.addListener($scope.MSearch2, "complete", placeSearchCallBack(bindMap, index)); //返回地点查询结果
      }
    });
  };

  $scope.initialize = function() {
    $scope.locationmap1 = new AMap.Map("courtMap1");
    $scope.locationmap2 = new AMap.Map("courtMap2");
    if ($scope.homeCourt[0].name !== '') {
      var piont1 = new AMap.LngLat($scope.homeCourt[0].loc.coordinates[0], $scope.homeCourt[0].loc.coordinates[1]);
      $scope.locationmap1.setZoomAndCenter(15, piont1);
      var markerOption = {
        map: $scope.locationmap1,
        position: piont1,
        draggable: true
      };
      var mar = new AMap.Marker(markerOption);
      var changePoint = function(e) {
        var p = e.lnglat;
        $scope.homeCourt[0].loc.coordinates = [p.getLng(), p.getLat()];
      };
      AMap.event.addListener(mar, "dragend", changePoint);
    };

    if ($scope.homeCourt[1].name !== '') {
      var piont2 = new AMap.LngLat($scope.homeCourt[1].loc.coordinates[0], $scope.homeCourt[1].loc.coordinates[1]);
      $scope.locationmap2.setZoomAndCenter(15, piont2);
      var markerOption = {
        map: $scope.locationmap2,
        position: piont2,
        draggable: true
      };
      var marker2 = new AMap.Marker(markerOption);
      var changePoint = function(e) {
        var p = e.lnglat;
        $scope.homeCourt[1].loc.coordinates = [p.getLng(), p.getLat()];
      };
      AMap.event.addListener(marker2, "dragend", changePoint);
    }
    if ($scope.city != '') {
      bindPlaceSearch($scope.locationmap1, 0);
      bindPlaceSearch($scope.locationmap2, 1);
    } else {
      $scope.locationmap1.plugin(["AMap.CitySearch"], function() {
        var citysearch = new AMap.CitySearch();
        citysearch.getLocalCity();
        AMap.event.addListener(citysearch, "complete", function(result) {
          if (result && result.city && result.bounds) {
            var citybounds = result.bounds;
            $scope.city = result.city;
            bindPlaceSearch($scope.locationmap1, 0);
            bindPlaceSearch($scope.locationmap2, 1);
          }
        });
        AMap.event.addListener(citysearch, "error", function(result) {
          alert(result.info);
        });
      });
    }
    window.map_ready = true;
  };

  $scope.changeLocation1 = function() {
    $scope.showMap1 = true;
    if ($scope.MSearch1 != '') {
      $scope.MSearch1.search($scope.homeCourt[0].name);
    } else {
      $timeout(function() {
        $scope.MSearch1.search($scope.homeCourt[0].name);
      }, 0);
    }
  };

  $scope.changeLocation2 = function() {
    $scope.showMap2 = true;
    if ($scope.MSearch2 != '') {
      $scope.MSearch2.search($scope.homeCourt[1].name);
    } else {
      $timeout(function() {
        $scope.MSearch2.search($scope.homeCourt[1].name);
      }, 0);
    }
  };

  $scope.saveHomeCourt = function () {
    Team.saveInfo(teamId, {
      homecourt: $scope.homeCourt
    }, function (err) {
      if (err) {
        alertify.alert(err);
      } else {
        $scope.team.homeCourts = $scope.homeCourt;
        $scope.isEditingInfo = false;
        $('#homeCourtModal').modal('hide');
        alertify.alert('保存成功');
      }
    });
  };

  $scope.openMemberModal = function () {
    $('#memberListModal').modal('show');
    if (!$scope.teamMembers) {
      $scope.loadingMembers = true;
      Team.getTeamMembers(teamId, function (err, members) {
        if (!err) {
          $scope.teamMembers = members;
          $scope.loadingMembers = false;
        }
      });
    }
  };

  // getCampaign(now.getFullYear(), now.getMonth());

  $scope.joinTeam = function () {
    Team.join(teamId, function (err) {
      if (err) {
        alertify.alert('加入小队失败，请重试。');
      } else {
        alertify.alert('加入小队成功', function (e) {
          // todo 暂时刷新页面，应该是重新获取小队数据，在全部功能完成后需要修改这里。
          window.location.reload();
        });
      }
    });
  };

  $scope.quitTeam = function () {
    alertify.confirm('确定要退出该小队吗？', function (e) {
      if (e) {
        Team.quit(teamId, function (err) {
          if (err) {
            alertify.alert('退出小队失败，请重试。');
          } else {
            alertify.alert('退出小队成功', function (e) {
              // todo 暂时刷新页面，应该是重新获取小队数据，在全部功能完成后需要修改这里。
              window.location.reload();
            });
          }
        });
      }
    });
  };


  // calendar
  var modalEventSource = {
    all: '/campaign/team/' + teamId + '/calendar/all',
    playing: '/campaign/team/' + teamId + '/calendar/playing',
    future: '/campaign/team/' + teamId + '/calendar/future',
    end: '/campaign/team/' + teamId + '/calendar/end'
  };
  var modal_data = {};
  $scope.calStatus = 'playing';
  var options = {
    events_source: modalEventSource.all,
    view: 'month',
    time_end: '24:00',
    tmpl_path: '/tmpls-team/',
    tmpl_cache: false,
    language: 'zh-CN',
    onAfterEventsLoad: function(events) {
      if (!events) {
        return;
      }
    },
    onAfterViewLoad: function(view) {
      $('#calendar_title').text(this.getTitle());
      //$('#calendar_operator button').removeClass('active');
      //$('button[data-calendar-view="' + view + '"]').addClass('active');

      $('#calendar').undelegate('.cal-month-day','click').delegate('.cal-month-day','click',function(e){
        $('#events-modal').modal('show');
        initModalCalendar(modalEventSource.playing,$(this).children('span[data-cal-date]').attr('data-cal-date'));
        // $('#calendar_modal').view($(this).data('calendar-view'));
        // $('#calendar_modal').find('.cal-month-day[data-cal-date='+$(this).attr('data-cal-date')+']').click();
      });
      $('#calendar').find('span[data-cal-date]').click(function(e){
        $('#events-modal').modal('show');
        initModalCalendar(modalEventSource.playing,$(this).attr('data-cal-date'));
        // $('#calendar_modal').view($(this).data('calendar-view'));
        // $('#calendar_modal').find('.cal-month-day[data-cal-date='+$(this).attr('data-cal-date')+']').click();
      });

    },
    classes: {
      months: {
        general: 'label'
      }
    }
  };

  var calendar = $('#calendar').calendar(options);

  $('#calendar_nav [data-calendar-nav]').each(function() {
    var $this = $(this);
    $this.click(function() {
      calendar.navigate($this.data('calendar-nav'));
    });
  });
  $('#calendar_view [data-calendar-view]').each(function() {
    var $this = $(this);
    $this.click(function() {
      calendar.view($this.data('calendar-view'));
    });
  });


  var initModalCalendar = function(events_source, start_time, reloadEventList) {
    var modalOptions = {
      events_source: events_source,
      view: 'month',
      time_end: '24:00',
      tmpl_path: '/tmpls/',
      tmpl_cache: false,
      language: 'zh-CN',
      eventShow: 1,
      eventShowContainer: '#cal-modal-event-box',
      onAfterEventsLoad: function(events) {
        if (!events) {
          return;
        }
        modal_data.start = this.getStartDate();
      },
      onAfterViewLoad: function(view) {
        $('#calendar_title_modal').text(this.getTitle());
        //$('#calendar_operator button').removeClass('active');
        //$('button[data-calendar-view="' + view + '"]').addClass('active');
        $('#events-modal').undelegate('[data-calendar-nav]', 'click').delegate('[data-calendar-nav]', 'click', function() {
          modalCalendar.navigate($(this).data('calendar-nav'));
        });
        $('#events-modal').undelegate('[data-calendar-nav="today"]', 'click').delegate('[data-calendar-nav]', 'click', function() {
          modalCalendar.navigate($(this).data('calendar-nav'));
        });
        $('#events-modal').undelegate('[data-calendar-view]', 'click').delegate('[data-calendar-view]', 'click', function() {
          modalCalendar.view($(this).data('calendar-view'));
        });
        if (start_time) {
          $('#events-modal').find("[data-cal-date='" + start_time + "']").parent().mouseenter().click();
        } else if (reloadEventList) {
          var nowTime = $('#cal-modal-event-box').find('.cal-event-time .time').html();
          $('#events-modal').find("[data-cal-date='" + nowTime + "']").parent().mouseenter().click();
        }
      },
      classes: {
        months: {
          general: 'label'
        }
      }
    };
    if (modal_data.start) {
      modalOptions.day = moment(modal_data.start).format('YYYY-MM-DD');
    }
    if (start_time) {
      modalOptions.day = start_time;
    }
    var modalCalendar = $('#modal_calendar').calendar(modalOptions);
  };

  $scope.getCalendarCampaigns = function (type) {
    initModalCalendar(modalEventSource[type], null, 1);
    $scope.calStatus = type;
  };



  // timeline
  Campaign.getCampaignsDateRecord('team', teamId, function(err, record) {
    if (!err) {
      $scope.timelines = record;
      addCampaign(record[0].year + '_' + record[0].month[0].month);
    }
  });
  $scope.nowYear = 'timeline1_0';
  var addCampaign = function(id) {
    var temp = id.split('_');
    if (temp[0] != 'timeline1' && temp[0] != 'timeline0') {
      var paging = {
        year: temp[0],
        month: temp[1]
      }
      for (var i = $scope.timelines.length - 1; i >= 0; i--) {
        if ($scope.timelines[i].year == temp[0]) {
          for (var j = $scope.timelines[i].month.length - 1; j >= 0; j--) {
            if ($scope.timelines[i].month[j].month == temp[1]) {
              if (!$scope.timelines[i].month[j].campaigns && !$scope.timelines[i].month[j].loaded) {
                var yearIndex = i,
                  monthIndex = j;
                Campaign.getCampaignsData('team', teamId, paging, function(err, timeline) {
                  if (!err) {
                    $scope.timelines[yearIndex].month[monthIndex].campaigns = timeline.campaigns;
                    return timeline.campaigns.length;
                  }
                });
              }
              $scope.timelines[i].month[j].loaded = true;
            }
          };
          break;
        }
      };
    } else {
      return false;
    }
  };

  $scope.anchorTo = function (id) {
    $location.hash(id);
    anchorSmoothScroll.scrollTo(id);
  };

  $scope.scrollTo = function(id) {
    var temp = id.split('_');
    $scope.nowYear = temp[0];
    $scope.nowMonth = temp[1];
    $location.hash(id);
    anchorSmoothScroll.scrollTo(id);
    addCampaign(id);
  };

  $scope.loadMore = function(id) {
    var temp = id.split('_');
    $scope.nowYear = temp[0];
    $scope.nowMonth = temp[1];
    addCampaign(id);
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
      if(data.poiList.pois.length==0){
        alertify.alert('没有符合条件的地点，请重新输入');
        return;
      }
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
        $scope.locationmap.plugin(["AMap.PlaceSearch"], function() {
          $scope.MSearch = new AMap.PlaceSearch({ //构造地点查询类
            pageSize: 1,
            pageIndex: 1
          });
          AMap.event.addListener($scope.MSearch, "complete", placeSearchCallBack); //返回地点查询结果
        });
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

