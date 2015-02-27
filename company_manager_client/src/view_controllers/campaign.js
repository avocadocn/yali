define(['./controller'], function (controllers) {
  return controllers.controller('campaign.campaignCtrl', [
    '$scope', '$rootScope', 'storageService', 'teamService', 'campaignService',
    function ($scope, $rootScope, storageService, teamService, campaignService) {
      var cid = $rootScope.company._id;
      //获取小队
      teamService.getList(cid).success(function (data) {
        $scope.data = {cid: cid, teams: data};
      })
      .error(function (data) {
        console.log(data.msg);
      });

      //campaigns
      $scope.pages = [];
      $scope.nowPage = 0;
      //调用情况：
      //  1、日期变更时
      //  2、活动单位变更
      //  3、小队变更
      //  4、翻页
      var getSuccessProcess = function(data, nextId) {
        //logo
        var campaignsLength = data.campaigns.length;
        console
        for(var i=0; i<campaignsLength; i++) {
          if(data.campaigns[i].campaignType===1) {
            data.campaigns[i].logo = $rootScope.company.logo;
          }else {
            var tid = data.campaigns[i].unitId;
            var teamsLength = $scope.data.teams.length;
            for(var j=0; j<teamsLength; j++) {
              if($scope.data.teams[j]._id === tid) {
                data.campaigns[i].logo = $scope.data.teams[j].logo;
                break;
              }
            }
          }
        }
        //翻页所需逻辑
        $scope.campaigns = data.campaigns;
        $scope.hasNext = data.hasNext;
        if($scope.nowPage===0 && !nextId) { //第一次请求
          var page = {campaigns: data.campaigns};
          if(data.hasNext) page.nextId = data.nextId;
          $scope.pages.push(page);
        }else {//下一页
          var page = {campaigns: data.campaigns, thisId: $scope.nextId};
          if(data.hasNext) page.nextId = data.nextId;
          $scope.pages.push(page);
          // $scope.campaigns = data.campaigns;
        }
        $scope.nextId = data.hasNext ? data.nextId : '';
      };

      /**
       * [getCampaigns description]
       * @param  {date} nextTime  获取下一页所用标记
       * @param  {string} nextId  获取下一页所用标记
       */
      var getCampaigns = function(nextTime,nextId) {
        if(!nextId) {
          $scope.pages = [];
          $scope.nowPage = 0;
        }
        if($scope.selectedType===1) {//获取公司&小队活动
          campaignService.getCampaigns(cid, null, 'managerList', 'allCampaign', '-start_time', nextTime || $scope.startTime, $scope.endTime, nextId, 20)
          .success(function (data, status) {
            getSuccessProcess(data, nextId);
          })
          .error(function (data, status) {
            //todo
          });
        }else if($scope.selectedType ===2) {//获取单小队活动
          campaignService.getCampaigns(cid, $scope.currentTeamId, 'managerList', null, '-start_time', nextTime || $scope.startTime, $scope.endTime, nextId, 20)
          .success(function (data, status) {
            getSuccessProcess(data, nextId);
          })
          .error(function (data, status) {
            //todo
          });
        }else {//获取公司活动
          campaignService.getCampaigns(cid, null, 'managerList', null, '-start_time', nextTime || $scope.startTime, $scope.endTime, nextId, 20)
          .success(function (data, status) {
            getSuccessProcess(data, nextId);
          })
          .error(function (data, status) {
            //todo
          });
        }
      };

      var gettingPage = false;
      $scope.getPage = function (action, number) {
        if(!gettingPage) {
          gettingPage = true;
          if(action === 'next') {//下一页
            if($scope.hasNext) {
              if($scope.pages[$scope.nowPage+1]) {
                $scope.nowPage++;
                $scope.campaigns = $scope.pages[$scope.nowPage].campaigns;
                $scope.hasNext = $scope.pages[$scope.nowPage].nextId? true: false;
                $scope.nextId = $scope.pages[$scope.nowPage].nextId;
              }
              else {
                var lastTime = new Date($scope.campaigns[$scope.campaigns.length-1].startTime).valueOf();
                getCampaigns(lastTime,$scope.nextId);
                $scope.nowPage++;
              }          }
          }else if(action === 'pre') {//上一页
            if($scope.nowPage>0) {
              $scope.nowPage--;
              $scope.campaigns = $scope.pages[$scope.nowPage].campaigns;
              $scope.hasNext = true;
              $scope.nextId = $scope.pages[$scope.nowPage].nextId;
            }
          }else if(number>-1) {
            if($scope.pages[number]) {
              $scope.campaigns = $scope.pages[number].campaigns;
              $scope.hasNext = $scope.pages[number].nextId? true: false;
              $scope.nextId = $scope.pages[number].nextId;
              $scope.nowPage = number;
            }
          }
          gettingPage = false;
        }
      };
      
      $scope.selectedType = 1;//默认全部活动
      getCampaigns();
      $scope.selectType = function(type) {
        $scope.selectedType = type;
        if(type!=2) {
          $scope.currentTeamId = '';
          getCampaigns();
        }
      };

      $scope.selectTeam = function(tid) {
        $scope.currentTeamId = tid;
        $scope.selectedType = 2;
        getCampaigns();
      };

      //calendar
      $scope.isDayView = false;
      var calendar_data = {};
      var initCalendar = function(events_source) {
        var options = {
          events_source: function () { return []; },
          view: 'month',
          time_end: '24:00',
          tmpl_path: '/tmpls-small/',
          tmpl_cache: false,
          language: 'zh-CN',
          modal: '#user_modal',
          onAfterEventsLoad: function(events) {
            if (!events) {
              return;
            }
            calendar_data.start = this.getStartDate();
          },
          onAfterViewLoad: function(view) {
            $('#calendar_title').text(this.getTitle());
            $('#calendar_nav').undelegate('[data-calendar-nav]','click').delegate('[data-calendar-nav]','click',function() {
              calendar.navigate($(this).data('calendar-nav'));
            });
            $('#calendar_view').undelegate('[data-calendar-view]','click').delegate('[data-calendar-view]','click',function() {
              calendar.view($(this).data('calendar-view'));
            });
            $('#calendar').undelegate('.cal-month-day','click').delegate('.cal-month-day','click',function(e){
              // $('#events-modal').modal('show');
              // initModalCalendar(events_source,$(this).children('span[data-cal-date]').attr('data-cal-date'));
            });
            $('#calendar').find('span[data-cal-date]').click(function(e){
              // $('#events-modal').modal('show');
              // initModalCalendar(events_source,$(this).attr('data-cal-date'));
            });
          },
          classes: {
            months: {
              general: 'label'
            }
          }
        };

        if (calendar_data.start) {
          options.day = moment(calendar_data.start).format('YYYY-MM-DD');
        }

        var calendar = $('#calendar').calendar(options);
      };
      initCalendar();
    }
  ]);
});