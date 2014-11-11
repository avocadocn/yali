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

  Campaign.getCampaignsDateRecord('team', teamId, function (err, record) {
    if (err) {
      alertify.alert('抱歉，获取数据失败，请刷新页面重试。');
    } else {
      $scope.dateRecord = record;
    }
  });

  $scope.campaignData = [];

  var now = new Date();

  var getCampaign = $scope.getCampaign = function (year, month) {
    // 已有的不再获取
    var found = false;
    var isExistsCampaign = function (year, month) {
      for (var i = 0; i < $scope.campaignData.length; i++) {
        var yearData = $scope.campaignData[i];
        if (yearData.year === year) {
          for (var j = 0; j < yearData.months.length; j++) {
            if (yearData.months[j].month === month) {
              return true;
            }
          }
        }
      }
      return false;
    };
    found = isExistsCampaign(year, month);

    if (found) {
      return;
    }

    // 获取尚未获取的月份的活动
    Campaign.getCampaignsData('team', teamId, {
      year: year,
      month: month
    }, function (err, campaigns) {

      // 查找对应年份的数据是否存在
      var found = false;
      var data;
      for (var i = 0; i < $scope.campaignData.length; i++) {
        data = $scope.campaignData[i];
        if (data.year === year) {
          found = true;
          break;
        }
      }

      if (!found) {
        // 如果不存在对应的年份，则添加年份的数据
        $scope.campaignData.push({
          year: year,
          months: [{
            month: month,
            campaigns: campaigns
          }]
        });
        $scope.campaignData.sort(function (a, b) {
          return b.year - a.year;
        });
      } else {
        // 如果已存在对应的年份，添加一个月的数据并排序（假定这里不会重复添加）
        data.months.push({
          month: month,
          campaigns: campaigns
        });
        data.months.sort(function (a, b) {
          return b.month - a.month;
        });
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

  };

  getCampaign(now.getFullYear(), now.getMonth());

  // 这并不是一个好的做法，日后可改善。现在暂时按以前的写法，通过rootScope来设置发起活动
  $rootScope.sponsorIndex = function (index) {
    $rootScope.modal_index = index;
    if (index === 1) {//活动
      $('#sponsorCampaignModel').modal('show');
    } else {
      $('#sponsorProvokeModel').modal('show');
    }
  };

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
        $('#calendarModal').modal('show');
        initModalCalendar(modalEventSource.all,$(this).children('span[data-cal-date]').attr('data-cal-date'));
        // $('#calendar_modal').view($(this).data('calendar-view'));
        // $('#calendar_modal').find('.cal-month-day[data-cal-date='+$(this).attr('data-cal-date')+']').click();
      });
      $('#calendar').find('span[data-cal-date]').click(function(e){
        $('#calendarModal').modal('show');
        initModalCalendar(modalEventSource.all,$(this).attr('data-cal-date'));
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
        $('#calendarModal').undelegate('[data-calendar-nav]', 'click').delegate('[data-calendar-nav]', 'click', function() {
          modalCalendar.navigate($(this).data('calendar-nav'));
        });
        $('#calendarModal').undelegate('[data-calendar-nav="today"]', 'click').delegate('[data-calendar-nav]', 'click', function() {
          modalCalendar.navigate($(this).data('calendar-nav'));
        });
        $('#calendarModal').undelegate('[data-calendar-view]', 'click').delegate('[data-calendar-view]', 'click', function() {
          modalCalendar.view($(this).data('calendar-view'));
        });
        if (start_time) {
          $('#calendarModal').find("[data-cal-date='" + start_time + "']").parent().mouseenter().click();
        } else if (reloadEventList) {
          var nowTime = $('#cal-modal-event-box').find('.cal-event-time .time').html();
          $('#calendarModal').find("[data-cal-date='" + nowTime + "']").parent().mouseenter().click();
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
    initModalCalendar(modalEventSource[type]);
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
      Campaign.getCampaignsData('team', teamId, paging, function(err, timeline) {
        if (!err) {
          for (var i = $scope.timelines.length - 1; i >= 0; i--) {
            if ($scope.timelines[i].year == timeline.year) {
              for (var j = $scope.timelines[i].month.length - 1; j >= 0; j--) {
                if ($scope.timelines[i].month[j].month == timeline.month) {
                  if ($scope.timelines[i].month[j].campaigns.length == 0) {
                    $scope.timelines[i].month[j].campaigns = timeline.campaigns;
                    return timeline.campaigns.length;
                  }
                  return 0;
                }
              };
              break;
            }
          };
        }
        return 0;
      });
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



