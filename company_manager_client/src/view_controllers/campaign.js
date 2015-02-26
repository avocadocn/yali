define(['./controller'], function (controllers) {
  return controllers.controller('campaign.campaignCtrl', [
    '$scope', '$rootScope', 'storageService', 'teamService',
    function ($scope, $rootScope, storageService, teamService) {
      var cid = $rootScope.company._id;
      //获取小队
      teamService.getList(cid).success(function (data) {
        $scope.data = {cid: cid, teams: data};
      })
      .error(function (data) {
        console.log(data.msg);
      });

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
      //campaigns
      //调用情况：
      //  1、日期变更时
      //  2、活动单位变更
      //  3、小队变更
      //  4、翻页
      /**
       * [getCampaigns description]
       * @param  {string} id   cid/tid
       * @param  {???} time 某一天/null
       * @param  {string} page 'next'/'previous'/null
       */
      var getCampaigns = function(id, time, page) {
        //type就根据$scope.selectedType吧...
      }
      
      $scope.selectedType = 1;//默认全部活动
      $scope.selectType = function(type) {
        $scope.selectedType = type;
        //取campaign todo
        switch(type) {
          case 1:
            $scope.currentTeamId='';
            break;
          case 2:
            break;
          case 3:
            $scope.currentTeamId='';
            break;
        }
      };

      $scope.selectTeam = function(tid) {
        $scope.currentTeamId = tid;
        $scope.selectedType = 2;
        getCampaigns(tid, null, null);
      };
    }
  ]);
});