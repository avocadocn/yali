define(['angular', 'moment', 'map/map', 'pen'], function (angular, moment) {
  return angular.module('campaignCtrls', ['AMap']).controller('campaign.campaignCtrl', [
    '$scope', '$rootScope', 'storageService', 'teamService', 'campaignService', 'apiBaseUrl',
    function ($scope, $rootScope, storageService, teamService, campaignService, apiBaseUrl) {
      var cid = $rootScope.company._id;
      //获取小队
      $scope.teamsGot = false;
      teamService.getList(cid).success(function (data) {
        $scope.data = {cid: cid, teams: data};
        $scope.teamsGot = true;
      })
      .error(function (data) {
        console.log(data.msg);
      });
      $scope.numbers = [
        {id: 1, num: 10},
        {id: 2, num: 25},
        {id: 3, num: 50},
        {id: 4, num: 100}
      ];
      $('#startTime').datetimepicker({
        format: 'yyyy-mm-dd',
        autoclose: true,
        minView: 2,
        language: 'zh-CN',
        pickerPosition: "bottom-left"
      });
      $('#endTime').datetimepicker({
        format: 'yyyy-mm-dd',
        autoclose: true,
        minView: 2,
        language: 'zh-CN',
        pickerPosition:"bottom-left"
      });

      $("#startTime").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.start_time = moment(dateUTC).format("YYYY-MM-DD");
        $scope.startTime = dateUTC.valueOf();
        $('#endTime').datetimepicker('setStartDate', dateUTC); //开始时间应小于结束时间
      });

      $("#endTime").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.end_time = moment(dateUTC).format("YYYY-MM-DD");
        $scope.endTime = dateUTC.valueOf();
        $('#startTime').datetimepicker('setEndDate', dateUTC); //开始时间应小于结束时间
      });

      //campaigns
      $scope.pages = [];
      $scope.nowPage = 0;
      $scope.number = $scope.numbers[0];
      $scope.numOfPage = 10;
      //调用情况：
      //  1、日期变更时
      //  2、活动单位变更
      //  3、小队变更
      //  4、翻页
      //  5、每页数目变更
      var getSuccessProcess = function(data, nextId) {
        //logo
        var campaignsLength = data.campaigns.length;
        for(var i=0; i<campaignsLength; i++) {
          if(data.campaigns[i].campaignType===1 || data.campaigns[i].campaignType>5) {
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
        var params =  {'cid':cid, 'result':'managerList', 'attrs':['showClose'], 'sort':'-start_time', 'limit':$scope.numOfPage};
        if(nextTime || $scope.endTime) params.to = nextTime || $scope.endTime;
        if($scope.startTime) params.from = $scope.startTime;
        if(nextId) params.nextId = nextId;

        if($scope.selectedType===1) {//获取公司&小队活动
          params.attrs.push('allCampaign');
          campaignService.getCampaigns(params)
          .success(function (data, status) {
            getSuccessProcess(data, nextId);
          })
          .error(function (data, status) {
            //todo
          });
        }else if($scope.selectedType ===2) {//获取单小队活动
          params.tids = $scope.currentTeamId;
          campaignService.getCampaigns(params)
          .success(function (data, status) {
            getSuccessProcess(data, nextId);
          })
          .error(function (data, status) {
            //todo
          });
        }else {//获取公司活动
          campaignService.getCampaigns(params)
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
      $scope.$watch('teamsGot', function(value) {//由于必须等待小队获取完后方能获取活动，故监听是否获取完毕
        if(value) {
          getCampaigns();
        }
      })
      // $scope.selectType = function(type) {
      //   $scope.selectedType = type;
      //   if(type!=2) {
      //     $scope.currentTeamId = '';
      //     getCampaigns();
      //   }
      //   switch(type) {
      //     case 1:
      //       var events_source = apiBaseUrl + '/campaigns?result=calendar&attrs=allCampaign&attrs=closeShow&limit=200&cid='+ cid;
      //       initCalendar(events_source);
      //       break;
      //     case 3:
      //       var events_source = apiBaseUrl + '/campaigns?result=calendar&attrs=closeShow&limit=200&cid='+ cid;
      //       initCalendar(events_source);
      //       break;
      //   }
      // };

      $scope.selectTeam = function(tid) {
        $scope.currentTeamId = tid;
        $scope.selectedType = 2;
        getCampaigns();
        // var events_source = apiBaseUrl + '/campaigns?result=calendar&limit=200&attrs=closeShow&cid='+ cid + '&tid=' + tid;
      };

      $scope.quitTeam = function() {
        $scope.currentTeamId = null;
        $scope.selectedType = 1;
        getCampaigns();
      }

      // $scope.recoverDate = function() {
      //   $scope.nowDay = null;
      //   $scope.startTime = null;
      //   $scope.endTime = null;
      //   getCampaigns();
      // };

      $scope.selectNumOfPage = function() {
        $scope.nowDay = null;
        $scope.startTime = null;
        $scope.endTime = null;
        $scope.numOfPage = $scope.number.num;
        getCampaigns();
      };
      // $scope.goDetail = function (campaignId) {
      //   $scope.campaignId = campaignId;
      //   $('#editCampaignModal').modal('show');
      // };
      $scope.searchCampaignByTime = function() {
        if($scope.startTime == undefined || $scope.startTime == null || $scope.endTime == undefined || $scope.endTime == null) {
          return ;
        }
        getCampaigns();
      }
      $scope.quitSearchCampaignByTime = function() {
        $scope.start_time = null;
        $scope.end_time = null;
        $scope.startTime = null;
        $scope.endTime = null;
        getCampaigns();
      }
      $scope.closeCampaign = function (campaign) {
        if(campaign.active) {
          campaign.active = false;
          campaignService.closeCampaign(campaign._id)
          .success(function (data, status) {

            alert('已关闭');
          })
          .error(function (data, status) {
            alert('关闭失败，请重试');
          });
        }
      };
    }
  ]).controller('campaign.createCampaignCtrl', [
    '$scope',
    'initData',
    'campaignService',
    'teamList',
    'molds',
    function($scope, initData, campaignService, teamList, molds) {
      $scope.teamList = teamList.map(function(team) {
        return {
          _id: team._id,
          name: team.name,
          selected: false
        };
      });
      var teamIds = [];

      var refreshTeamIds = function() {
        if ($scope.formData.tid) {
          $scope.formData.tid = $scope.teamList.filter(function(team) {
            return team.selected;
          }).map(function(team) {
            return team._id;
          });
          if ($scope.formData.tid.length === 0) {
            $scope.createCampaignForm.$setValidity('tid', false);
          }
          else {
            $scope.createCampaignForm.$setValidity('tid', true);
          }
        }
      };

      $scope.toggleSelectTeam = function(team) {
        team.selected = !team.selected;
        refreshTeamIds();
      };

      $scope.molds = molds;

      $scope.campaignType = 'company'; // 'company' or 'team';
      $scope.formData = {
        cid: [initData.company._id],
        campaign_type: 1,
        theme: '',
        location: {
          name: '',
          coordinates: []
        },
        start_time: null,
        end_time: null,
        deadline: null,
        campaign_mold: molds[0].name,
        member_max: 0,
        member_min: 0,
        content: ''
      };

      var clearFormData = function() {
        $scope.formData = {
          cid: [initData.company._id],
          campaign_type: 1,
          theme: '',
          location: {
            name: '',
            coordinates: []
          },
          start_time: null,
          end_time: null,
          deadline: null,
          campaign_mold: molds[0].name,
          member_max: 0,
          member_min: 0,
          content: ''
        };
        $('#start_time').datetimepicker('setEndDate', null);
        $('#end_time').datetimepicker('setStartDate', null);
        $('#deadline').datetimepicker('setEndDate', null);
      };

      $scope.selectType = function(type) {
        switch (type) {
        case 'company':
          $scope.campaignType = 'company';
          $scope.formData.campaign_type = 1;
          $scope.createCampaignForm.$setValidity('tid', true);
          delete $scope.formData.tid;
          // todo
          break;
        case 'team':
          $scope.campaignType = 'team';
          $scope.formData.campaign_type = 2;
          $scope.formData.tid = teamIds;
          refreshTeamIds();
        }
      };

      //时间相关
      var initDatetimePicker = function(query) {
        $(query).datetimepicker({
          autoclose: true,
          language: 'zh-CN',
          startDate: new Date(),
          pickerPosition:"bottom-left"
        });
      };

      initDatetimePicker('#start_time');
      initDatetimePicker('#end_time');
      initDatetimePicker('#deadline');

      $("#start_time").on("changeDate",function (ev) {
          var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
          $scope.formData.start_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
          $('#end_time').datetimepicker('setStartDate', dateUTC); //开始时间应小于结束时间
      });
      $("#end_time").on("changeDate",function (ev) {
          var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
          $scope.formData.end_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
          $('#start_time').datetimepicker('setEndDate', dateUTC); //开始时间应小于结束时间
          $('#deadline').datetimepicker('setEndDate', dateUTC);   //截至时间应小于结束时间
      });
      $("#deadline").on("changeDate",function (ev) {
          var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
          $scope.formData.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
          $('#end_time').datetimepicker('setStartDate', dateUTC); //截至时间应小于结束时间
      });

      // 地图
      $scope.mapCtrl = {};
      $scope.hasSearch = false;

      $scope.search = function() {
        $scope.mapCtrl.search($scope.formData.location.name).then(function(res) {
          $scope.hasSearch = true;
          var lnglat = res.location;
          $scope.formData.location.coordinates = [lnglat.getLng(), lnglat.getLat()];
        }, function(err) {
          console.log(err);
        });
        $scope.mapCtrl.onRemark(function(e) {
          var lnglat = e.lnglat;
          $scope.formData.location.coordinates = [lnglat.getLng(), lnglat.getLat()];
        });
      };

      // 编辑器
      var options = {
        editor: document.getElementById('create_cp_page_pen_content'), // {DOM Element} [required]
        textarea: '<textarea name="content" ng-model="formData.content"></textarea>', // fallback for old browsers
        list: ['h5', 'p', 'insertorderedlist','insertunorderedlist', 'indent', 'outdent', 'bold', 'italic', 'underline'], // editor menu list
        stay: false,
        toolBarId: 'create_cp_page_pen_toolbar'
      };

      var editor = new Pen(options);

      // 发布相关
      $scope.sending = false;
      $scope.publish = function() {
        $scope.sending = true;
        campaignService.sponsor($scope.formData)
          .success(function() {
            alert('活动发布成功');
            $scope.sending = false;
            clearFormData();
          })
          .error(function(data) {
            $scope.sending = false;
            alert(data.msg || '发布失败');
          });
      };

    }
  ]).controller('campaign.campaignCalendarCtrl', [
    '$scope', 
    '$rootScope', 
    'storageService', 
    'teamService', 
    'campaignService', 
    'apiBaseUrl',
    function($scope, $rootScope, storageService, teamService, campaignService, apiBaseUrl) {
      var cid = $rootScope.company._id;
      $scope.teamsGot = false;
      teamService.getList(cid).success(function (data) {
        $scope.data = {cid: cid, teams: data};
        $scope.teamsGot = true;
      })
      .error(function (data) {
        console.log(data.msg);
      });

      $scope.$watch('teamsGot', function(value) { //由于必须等待小队获取完后方能获取活动，故监听是否获取完毕
        if (value) {
          var date = new Date();
          date.setHours(0,0,0,0);
          $scope.startTime = date.valueOf();
          date.setHours(23,59,59,999);
          $scope.endTime = date.valueOf();
          getCampaigns();
        }
      })

      $scope.numbers = [
        {id: 1, num: 10},
        {id: 2, num: 25},
        {id: 3, num: 50},
        {id: 4, num: 100}
      ];

      //campaigns
      $scope.pages = [];
      $scope.nowPage = 0;
      $scope.number = $scope.numbers[0];
      $scope.numOfPage = 10;
      //调用情况：
      //  1、日期变更时
      //  2、翻页
      //  3、每页数目变更
      var getSuccessProcess = function(data, nextId) {
        //logo
        var campaignsLength = data.campaigns.length;
        for(var i=0; i<campaignsLength; i++) {
          if(data.campaigns[i].campaignType===1 || data.campaigns[i].campaignType>5) {
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
        var params =  {'cid':cid, 'result':'managerList', 'attrs':['showClose'], 'sort':'-start_time', 'limit':$scope.numOfPage};
        if(nextTime || $scope.endTime) params.to = nextTime || $scope.endTime;
        if($scope.startTime) params.from = $scope.startTime;
        if(nextId) params.nextId = nextId;

        params.attrs.push('allCampaign');
        campaignService.getCampaigns(params)
          .success(function(data, status) {
            getSuccessProcess(data, nextId);
          })
          .error(function(data, status) {
            //todo
          });
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

      //calendar
      $scope.isDayView = false;
      var calendar_data = {};
      var initCalendar = function(events_source) {
        var options = {
          events_source: events_source,
          view: 'month',
          time_end: '24:00',
          tmpl_path: '/company_client/calendar-template/',
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
            $('#calendar').undelegate('.cal-month-day','click').delegate('.cal-month-day','click',function(e){
              $scope.nowDay = $(this).children('span[data-cal-date]').attr('data-cal-date');
              var day = new Date($scope.nowDay);
              day.setHours(0,0,0,0);
              $scope.startTime = day.valueOf();
              day.setHours(23,59,59,999);
              $scope.endTime = day.valueOf();
              getCampaigns();
            });
            $('#calendar').find('span[data-cal-date]').click(function(e){
              $scope.nowDay =$(this).attr('data-cal-date');
              var day = new Date($scope.nowDay);
              day.setHours(0,0,0,0);
              $scope.startTime = day.valueOf();
              day.setHours(23,59,59,999);
              $scope.endTime = day.valueOf();
              $scope.show = false;
              getCampaigns();
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
      var events_source = apiBaseUrl + '/campaigns?result=calendar&attrs=allCampaign&attrs=showClose&limit=200&sort=-start&cid='+ cid;
      initCalendar(events_source);

      $scope.selectNumOfPage = function() {
        $scope.numOfPage = $scope.number.num;
        getCampaigns();
      };
      $scope.goDetail = function (campaignId) {
        $scope.campaignId = campaignId;
        $('#editCampaignModal').modal('show');
      };
      $scope.closeCampaign = function (campaign) {
        if(campaign.active) {
          campaign.active = false;
          campaignService.closeCampaign(campaign._id)
          .success(function (data, status) {

            alert('已关闭');
          })
          .error(function (data, status) {
            alert('关闭失败，请重试');
          });
        }
      };
    }
  ]);
});