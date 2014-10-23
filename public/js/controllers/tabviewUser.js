'use strict';

var tabViewUser = angular.module('donler');


tabViewUser.directive('match', function($parse) {
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl) {
      scope.$watch(function() {
        return $parse(attrs.match)(scope) === ctrl.$modelValue;
      }, function(currentValue) {
        ctrl.$setValidity('mismatch', currentValue);
      });
    }
  };
});

tabViewUser.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider
      // .when('/group_message', {
      //   templateUrl: '/message_list',
      //   controller: 'GroupMessageController',
      //   controllerAs: 'messages'
      // })
      .when('/campaign/:uid', {
        templateUrl: function(params){
          return '/users/campaign/'+params.uid;
        }
      })
      .when('/personal/:uid', {
        templateUrl: function(params){
          return '/users/editInfo/'+params.uid;
        },
        controller: 'AccountFormController',
        controllerAs: 'account'
      })
      .when('/timeLine/:uid', {
        templateUrl: function(params){
          return '/users/timeline/'+params.uid;
        }
      })
      // .when('/schedule/:uid', {
      //   templateUrl: function(params){
      //       return '/users/getScheduleList/'+params.uid;
      //   },
      //   controller: 'ScheduleListController',
      //   controllerAs: 'schedule'
      // })
      .when('/changePassword/:uid', {
        templateUrl: function(params) {
          return '/users/change_password/' + params.uid;
        },
        controller: 'PasswordFormController',
        controllerAs: 'password'
      })
      .when('/', {
        template: ""
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);

tabViewUser.run(['$rootScope','$location','Report','Campaign',
  function($rootScope,$location,Report,Campaign) {
    $rootScope.message_for_group = false;
    $rootScope.$on("$routeChangeStart",function(){
      $rootScope.loading = true;
    });
    $rootScope.$on("$routeChangeSuccess",function(){
      $rootScope.loading = false;
    });
    $rootScope.pushReport = function(){
      Report.publish($rootScope.reportContent,function(err,msg){
        alertify.alert(msg);
      });
    }
    $rootScope.judgeYear = function(index){
      if(index ==0 || new Date($rootScope.showedCampaign[index].start_time).getFullYear()!=new Date($rootScope.showedCampaign[index-1].start_time).getFullYear()){
        return true;
      }
      else {
        return false;
      }
    };
    $rootScope.openModal = function(type){
      $rootScope.showedType = type;
      $rootScope.showedCampaign = $rootScope[type];
      $('#user_modal').modal();
    }
    $rootScope.join = function (index,tid) {
      Campaign.join({
        campaignId: $rootScope.recentUnjoinedCampaigns[index]._id,
        cid: $rootScope.recentUnjoinedCampaigns[index].cid,
        tid: tid
      }, function (err) {
        if (err) {
          alertify.alert(err);
        } else {
          $rootScope.recentUnjoinedCampaigns[index].join_flag =1;
          var _temp = $rootScope.recentUnjoinedCampaigns.splice(index,1);
          $rootScope.recentJoinedCampaigns.push(_temp[0]);
          alertify.alert('参加活动成功');
        }
      });
    };

    $rootScope.quit = function (index) {
      Campaign.quit($rootScope.recentJoinedCampaigns[index]._id, function (err) {
        if (err) {
          alertify.alert(err);
        } else {
          $rootScope.recentJoinedCampaigns[index].join_flag = 0;
          var _temp = $rootScope.recentJoinedCampaigns.splice(index,1);
          $rootScope.recentUnjoinedCampaigns.push(_temp[0]);
          alertify.alert('退出活动成功');
        }

      });
    };
    // $rootScope.vote = function(campaignId) {
    //     Campaign.vote(campaignId, vote_status, function (err) {
    //         if (err) {
    //             alertify.alert(err);
    //         } else {

    //         }
    //     });
    // };
    //应战
    $rootScope.responseProvoke = function(campaignId, tid, status) {
      alertify.confirm('确认要接受该挑战吗？',function(e){
        if(e){
          Campaign.responseProvoke(campaignId, tid, status, function (err) {
            if (err) {
              alertify.alert(err);
            } else {

            }
          });
        }
      });
    };
    //取消挑战
    $rootScope.cancelProvoke = function(campaignId, tid) {
      alertify.confirm('确认要取消挑战吗？',function(e){
        if(e){
          Campaign.cancelProvoke(campaignId, tid, function (err) {
            if (err) {
              alertify.alert(err);
            } else {

            }
          });
        }
      });
    };
  }
]);
tabViewUser.directive('masonry', function ($timeout) {
  return {
    restrict: 'A',
    scope: {
      reload: '=',
      items: '='
    },
    link: function (scope, elem, attrs) {
      var options = {
        itemSelector: '.masonry-item',
        transitionDuration: '0.2s',
        gutter: 10
      };
      elem.masonry(options);
      scope.$watch('items', function(newVal, oldVal) {
        if (newVal && newVal != oldVal) {
          $timeout(function () {
            elem.masonry('reloadItems');
            elem.masonry(options);
          });
        }
      }, true);
      scope.$watch('reload', function(newVal) {
        if (newVal === true) {
          $timeout(function () {
            elem.masonry('reloadItems');
            elem.masonry(options);
            scope.reload = false;
          });
        }
      });
    }
  };
});

//留言合并
var messageConcat = function(messages,rootScope,scope,reset){
  if(reset){
    rootScope.sum = 0;
  }
  rootScope.sum += messages.length;
  var new_messages = messages;
  for(var i = 0; i < new_messages.length; i ++){
    new_messages[i].comments = [];
    new_messages[i].comment_permission = ([2,3,7,8].indexOf(messages[i].message_type) == -1);//成员加退、活动开关的动态不需要留言
    scope.toggle.push(false);
    scope.new_comment.push({
      text: ''
    });
  }
  return new_messages;
}

tabViewUser.controller('recentCampaignController',['$http', '$scope', '$rootScope','$location', 'Campaign',
  function($http, $scope, $rootScope, $location, Campaign) {
    $rootScope.recentUnjoinedCampaigns = [];
    $rootScope.recentJoinedCampaigns = [];
    $rootScope.nowCampaigns = [];

    $scope.newReply =[];
    $scope.showCampaign = false;
    $rootScope.$watch('uid',function(uid){
      if(!uid)
        return;
      try{
        $http({
          method:'get',
          url: '/campaign/user/recent/list/'+uid +'?'+Math.random()*10000,
        }).success(function(data,status){
          if(data.result===1){
            $rootScope.recentCampaigns = data.campaigns;
            $rootScope.recentUnjoinedCampaigns = data.campaigns[0];
            $rootScope.recentJoinedCampaigns = data.campaigns[1];
            $rootScope.nowCampaigns = data.campaigns[2];
            $scope.showCampaign = true;
            $scope.topCampaign = data.campaigns[1][0];
          }
        }).error(function(data,status){
          alertify.alert('DATA ERROR');
        });
      }
      catch(e){
        console.log(e);
      }
    });
    $scope.reloadM = function(){
        $scope.is_reload = true;
    }
  }
]);

// tabViewUser.controller('GroupMessageController', ['$http', '$scope', '$rootScope', 'Report', 'Comment',
//     function($http, $scope, $rootScope, Report, Comment) {
//         $rootScope.nowTab = 'group_message';
//         angular.element('.tooltip').hide();
//         $scope.new_comment = [];
//         $scope.toggle = [];
//         $scope.message_role = "user";
//         $rootScope.$watch('uid',function(uid){
//             $http.get('/groupMessage/user/'+uid+'/0?' + (Math.round(Math.random() * 100) + Date.now())).success(function(data, status) {
//                 $scope.user = data.user;
//                 $rootScope.message_corner = true;
//                 $scope.role = data.role;
//                 if(data.message_length<20){
//                     $scope.loadMore_flag = false;
//                 }
//                 else{
//                     $scope.loadMore_flag = true;
//                 }
//                 $scope.group_messages = messageConcat(data.group_messages,$rootScope,$scope,true);
//             });
//         });

//         $scope.loadMore_flag = false;
//         $scope.block = 1;
//         $scope.page = 1;
//         $scope.pageTime = [0];
//         $scope.lastPage_flag = false;
//         $scope.nextPage_flag = false;
//         $scope.loadMore = function(){
//             $http.get('/groupMessage/user/'+$rootScope.uid+'/'+new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime()+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
//                 if(data.result===1 && data.group_messages.length>0){
//                     $scope.group_messages = $scope.group_messages.concat(messageConcat(data.group_messages,$rootScope,$scope,false));
//                     if(data.message_length<20){
//                         $scope.loadMore_flag = false;
//                         if($scope.pageTime.length>1){
//                             $scope.lastPage_flag = true;
//                         }
//                     }
//                     else{
//                         $scope.loadMore_flag = true;
//                     }
//                     if($scope.pageTime.length>1){
//                         $scope.lastPage_flag = true;
//                     }
//                     if(++$scope.block==5){
//                         $scope.nextPage_flag = true;
//                         $scope.loadMore_flag = false;
//                         if($scope.page!=1){
//                             $scope.lastPage_flag = true;
//                         }
//                     }
//                 }
//                 else{
//                     $scope.loadOver_flag = true;
//                     $scope.loadMore_flag = false;
//                     $scope.nextPage_flag = false;
//                 }
//             });
//         }
//         $scope.changePage = function(flag){
//             var start_time = flag ==1? new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime() :$scope.pageTime[$scope.page-2];
//             $http.get('/groupMessage/user/'+$rootScope.uid+'/'+start_time+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
//                 if(data.result===1 && data.group_messages.length>0){
//                     if(flag ==1){
//                         $scope.page++;
//                         $scope.pageTime.push(new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime());
//                     }
//                     else{
//                         $scope.page--;
//                         $scope.pageTime.pop();
//                     }
//                     $scope.group_messages = messageConcat(data.group_messages,$rootScope,$scope,true);
//                     if(data.message_length<20){
//                         $scope.loadMore_flag = false;
//                         $scope.loadOver_flag = true;
//                     }
//                     else{
//                         $scope.loadMore_flag = true;
//                         $scope.nextPage_flag = false;
//                         $scope.lastPage_flag = false;
//                         $scope.loadOver_flag = false;
//                     }
//                     if(flag==1){
//                         $scope.lastPage_flag = true;
//                         $scope.nextPage_flag = false;
//                     }
//                     else{
//                         $scope.lastPage_flag = false;
//                         $scope.nextPage_flag = true;
//                     }
//                     $scope.block = 1;
//                     window.scroll(0,0);
//                 }
//                 else{
//                     $scope.nextPage_flag = false;
//                     $scope.loadMore_flag = false;
//                     $scope.loadOver_flag = true;
//                 }
//             });
//         }

//         $scope.toggleOperate = function(index){
//             $scope.toggle[index] = !$scope.toggle[index];
//             $scope.message_index = index;
//         }
//         $scope.getComment = function(index){
//             if($scope.toggle){
//                 try {
//                     $http({
//                         method: 'post',
//                         url: '/comment/pull/campaign/'+$scope.group_messages[index].campaign._id,
//                         data:{
//                             host_id : $scope.group_messages[index].campaign._id
//                         }
//                     }).success(function(data, status) {
//                         if(data.comments.length > 0){
//                             $scope.group_messages[index].comments = data.comments;
//                             $scope.fixed_sum = data.comments.length;
//                         }
//                     }).error(function(data, status) {
//                         alertify.alert('DATA ERROR');
//                     });
//                 }
//                 catch(e) {
//                     console.log(e);
//                 }
//             }
//         }


//         $scope.deleteComment = function(index) {
//             alertify.confirm('确认要删除该评论吗？', function(e) {
//                 if (e) {
//                     try {
//                         Comment.remove($scope.group_messages[$scope.message_index].comments[index]._id, function(err) {
//                             if (err) {
//                                 alertify.alert('删除失败，请重试。');
//                             } else {
//                                 $scope.group_messages[$scope.message_index].comments.splice(index, 1);
//                                 $scope.group_messages[$scope.message_index].campaign.comment_sum--;
//                             }
//                         });
//                     } catch (e) {
//                         console.log(e);
//                     }
//                 }
//             });
//         };

//         $scope.comment = function(index,form){
//             if($scope.group_messages[index].comments.length > 0){
//                 var tmp_comment = $scope.group_messages[index].comments[0];
//                 if(tmp_comment.poster._id === $scope.user._id){
//                     if(form.new_comment.$viewValue === tmp_comment.content){
//                         alertify.alert('勿要重复留言!');
//                         return;
//                     }
//                 }
//             }
//             var message_type = $scope.group_messages[index].message_type;
//             var host_type = message_type>3 && message_type<7? 'competition' : 'campaign';
//             try {
//                 $http({
//                     method: 'post',
//                     url: '/comment/push/'+host_type+'/'+$scope.group_messages[index].campaign._id,
//                     data:{
//                         host_id : $scope.group_messages[index].campaign._id,
//                         content : form.new_comment.$viewValue,
//                         host_type : host_type
//                     }
//                 }).success(function(data, status) {
//                     if(data.msg === 'SUCCESS'){
//                         $scope.group_messages[index].campaign.comment_sum ++;
//                         $scope.group_messages[index].comments.unshift({
//                             'show':true,
//                             'host_id' : data.comment.host_id,
//                             'content' : data.comment.content,
//                             'create_date' : data.comment.create_date,
//                             'poster' : data.comment.poster,
//                             'host_type' : data.comment.host_type,
//                             'index' : $scope.fixed_sum+1,
//                             'delete_permission' : true
//                         });
//                         $scope.new_comment[index].text='';
//                         form.$setPristine();
//                     } else {
//                         alertify.alert('DATA ERROR');
//                     }
//                 }).error(function(data, status) {
//                     alertify.alert('DATA ERROR');
//                 });
//             }
//             catch(e) {
//                 console.log(e);
//             }
//         }

//         $scope.vote = function(competition_id, vote_status, index) {
//             try {
//                 $http({
//                     method: 'post',
//                     url: '/campaign/vote/'+competition_id,
//                     data:{
//                         competition_id : competition_id,
//                         aOr : vote_status,
//                         tid : $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].id
//                     }
//                 }).success(function(data, status) {
//                     if(data.result===0) {
//                         alertify.alert(data.msg);
//                     } else {
//                         $scope.group_messages[index].vote_flag = vote_status ? data.data.quit : -data.data.quit;
//                         $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].vote.positive = data.data.positive;
//                         $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].vote.negative = data.data.negative;
//                         $scope.loadMore_flag = false;
//                     }
//                 });
//             }
//             catch(e) {
//                 console.log(e);
//             }
//         };

//         var joinCommit = function(campaign_id,index,tid){
//             try {
//                 $http({
//                     method: 'post',
//                     url: '/campaign/joinCampaign/'+campaign_id,
//                     data:{
//                         campaign_id : campaign_id,
//                         tid : tid,
//                         join_team : tid ? $scope.join_teams[$scope.select_index] :tid
//                     }
//                 }).success(function(data, status) {
//                     if(data.result===1){
//                         //alert('成功加入该活动!');
//                         alertify.alert('成功加入该活动!');
//                         $scope.group_messages[index].join_flag = true;
//                         $scope.group_messages[index].member_num++;
//                     }
//                     else{
//                         alertify.alert(data.msg);
//                     }
//                 }).error(function(data, status) {
//                     alertify.alert('DATA ERROR');
//                 });
//             }
//             catch(e) {
//                 console.log(e);
//             }
//         }
//         $scope.join = function(campaign_id,index,tid) {
//             $scope.join_teams= $scope.group_messages[index].myteam;
//             $scope.join_campaign_id = campaign_id;
//             $scope.join_index = index;
//             $scope.select_index = 0;
//             console.log(campaign_id,index,tid,$scope.group_messages[index].myteam);
//             if($scope.group_messages[index].myteam && $scope.group_messages[index].myteam.length>1){
//                 $('#joinTeamSelectmodal').modal();
//             }
//             else{
//                 joinCommit(campaign_id,index,tid);
//             }
//         };
//         $scope.selcetJoinTeam = function(index){
//             $scope.select_index = index;
//         };
//         $scope.joinCampaign = function(){
//             joinCommit($scope.join_campaign_id,$scope.join_index,$scope.join_teams[$scope.select_index]._id);
//         };

//         $scope.quit = function(campaign_id,index) {
//             alertify.confirm('确认要退出活动吗？',function(e){
//                 if(e){
//                     try {
//                         $http({
//                             method: 'post',
//                             url: '/campaign/quitCampaign/'+campaign_id,
//                             data:{
//                                 campaign_id : campaign_id
//                             }
//                         }).success(function(data, status) {
//                             if(data.result===1){
//                                 alertify.alert('成功退出该活动!');
//                                 //alert('您已退出该活动!');
//                                 $scope.group_messages[index].join_flag = false;
//                                 $scope.group_messages[index].member_num--;
//                             }
//                             else{
//                                 alertify.alert(data.msg);
//                             }
//                         }).error(function(data, status) {
//                             alertify.alert('DATA ERROR');
//                         });
//                     }
//                     catch(e) {
//                         console.log(e);
//                     }
//                 }
//             });
//         };
//         $scope.getReport = function(groupMessageIndx,CommentIndex){
//             $rootScope.reportContent = {
//                 hostType: 'comment',
//                 hostContent:{
//                     _id:$scope.group_messages[groupMessageIndx].comments[CommentIndex]._id,
//                     content:$scope.group_messages[groupMessageIndx].comments[CommentIndex].content,
//                     poster:$scope.group_messages[groupMessageIndx].comments[CommentIndex].poster
//                 },
//                 reportType:''

//             }
//             $('#reportModal').modal('show');
//         }
//         //应战
//         // $scope.responseProvoke = function(tid,provoke_message_id) {
//         //     try {
//         //         $http({
//         //             method: 'post',
//         //             url: '/group/responseProvoke/'+tid,
//         //             data:{
//         //                 provoke_message_id : provoke_message_id
//         //             }
//         //         }).success(function(data, status) {
//         //             window.location.reload();
//         //         }).error(function(data, status) {
//         //             alertify.alert('DATA ERROR');
//         //         });
//         //     }
//         //     catch(e) {
//         //         console.log(e);
//         //     }
//         // };
//     }
// ]);

// tabViewUser.controller('ScheduleModalController', ['$scope', '$http', '$rootScope',
//     function($scope, $http, $rootScope) {
//         $rootScope.nowTab = 'schedule';
//         angular.element('.tooltip').hide();
//         $scope.isCalendar = true;
//         $scope.isDayView = false;

//         // 判断是否是第一次加载视图，用于$scope.$digest()
//         var firstLoad = true;
//         $scope.campaignsType = 'joined';
// $rootScope.$on('updateUser', function() {
//     $scope.user = Global.user;
//     $scope.logoRandom = new Date().getTime();
//   });
//         $scope.calendar = function(isCalendar) {
//             $scope.isCalendar = isCalendar;
//             $scope.getCampaigns($scope.campaignsType);
//         };

//         var initCalendar = function(events_source) {
//             var options = {
//                 events_source: events_source,
//                 view: 'weeks',
//                 time_end: '24:00',
//                 tmpl_path: '/tmpls/',
//                 tmpl_cache: false,
//                 language: 'zh-CN',
//                 onAfterEventsLoad: function(events) {
//                     if (!events) {
//                         return;
//                     }
//                 },
//                 onAfterViewLoad: function(view) {
//                     $('#calendar_title_modal').text(this.getTitle());
//                     //$('#calendar_operator button').removeClass('active');
//                     //$('button[data-calendar-view="' + view + '"]').addClass('active');
//                     if (view === 'day') {
//                         $scope.isDayView = true;
//                         if (firstLoad === true) {
//                             firstLoad = false;
//                         }
//                         $scope.$digest();
//                     } else {
//                         $scope.isDayView = false;
//                         if (firstLoad === false) {
//                             $scope.$digest();
//                         }
//                     }
//                 },
//                 classes: {
//                     months: {
//                         general: 'label'
//                     }
//                 }
//             };

//             var calendar = $('#calendar_modal').calendar(options);

//             $('#calendar_nav_modal [data-calendar-nav]').each(function() {
//                 var $this = $(this);
//                 $this.click(function() {
//                     calendar.navigate($this.data('calendar-nav'));
//                 });
//             });
//             $('#calendar_view_modal [data-calendar-view]').each(function() {
//                 var $this = $(this);
//                 $this.click(function() {
//                     calendar.view($this.data('calendar-view'));
//                 });
//             });
//         };


//         $scope.company = false; 
//         $scope.getCampaigns = function(attr) {
//             // if ($scope.isCalendar === true) {
//                 $scope.campaignsType = attr;
//                 var events_source = '/campaign/user/' + attr + '/calendar/'+$rootScope.uid;
//                 initCalendar(events_source);
//             // } else {
//             //     $scope.campaignsType = attr;
//             //     $http.get('/campaign/user/' + attr + '/list/'+$rootScope.uid).success(function(data, status) {
//             //       $scope.campaigns = data.campaigns;
//             //       $scope.company = false;
//             //     });
//             // }
//         };

//         $scope.getCampaigns($scope.campaignsType);
//     }
// ]);
tabViewUser.controller('ScheduleSmallController', ['$scope', '$http', '$rootScope',
  function($scope, $http, $rootScope) {
    angular.element('.tooltip').hide();
    $scope.isCalendar = true;
    $scope.isDayView = false;

    // 判断是否是第一次加载视图，用于$scope.$digest()
    var firstLoad = true;
    $scope.campaignsType = 'all';

    $scope.calendar = function(isCalendar) {
      $scope.isCalendar = isCalendar;
      $scope.getCampaigns($scope.campaignsType);
    };

    var calendar_data = {}, modal_data = {};

    var initCalendar = function(events_source) {
      var options = {
        events_source: events_source,
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
          //$('#calendar_operator button').removeClass('active');
          //$('button[data-calendar-view="' + view + '"]').addClass('active');
          if (view === 'day') {
            $scope.isDayView = true;
            if (firstLoad === true) {
              firstLoad = false;
            }
            $scope.$digest();
          } else {
            $scope.isDayView = false;
            if (firstLoad === false) {
              $scope.$digest();
            }
          }
          $('#calendar_nav').undelegate('[data-calendar-nav]','click').delegate('[data-calendar-nav]','click',function() {
            calendar.navigate($(this).data('calendar-nav'));
          });
          $('#calendar_view').undelegate('[data-calendar-view]','click').delegate('[data-calendar-view]','click',function() {
            calendar.view($(this).data('calendar-view'));
          });
          $('#calendar').undelegate('.cal-month-day','click').delegate('.cal-month-day','click',function(e){
            $('#events-modal').modal('show');
            initModalCalendar(events_source,$(this).children('span[data-cal-date]').attr('data-cal-date'));
            // $('#calendar_modal').view($(this).data('calendar-view'));
            // $('#calendar_modal').find('.cal-month-day[data-cal-date='+$(this).attr('data-cal-date')+']').click();
          });
          $('#calendar').find('span[data-cal-date]').click(function(e){
            $('#events-modal').modal('show');
            initModalCalendar(events_source,$(this).attr('data-cal-date'));
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

      if (calendar_data.start) {
        options.day = moment(calendar_data.start).format('YYYY-MM-DD');
      }

      var calendar = $('#calendar').calendar(options);
    };
    var initModalCalendar = function(events_source,start_time) {
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
          if (view === 'day') {
            $scope.isDayView = true;
            if (firstLoad === true) {
              firstLoad = false;
            }
            $scope.$digest();
          } else {
            $scope.isDayView = false;
            if (firstLoad === false) {
              $scope.$digest();
            }
          }
          $('#calendar_nav_modal').undelegate('[data-calendar-nav]','click').delegate('[data-calendar-nav]','click',function() {
            modalCalendar.navigate($(this).data('calendar-nav'));
          });
          $('#calendar_view_modal').undelegate('[data-calendar-view]','click').delegate('[data-calendar-view]','click',function() {
            modalCalendar.view($(this).data('calendar-view'));
          });
          if(start_time){
            $('#calendar_view_modal').find("[data-cal-date='"+start_time+"']").parent().mouseenter().click();
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
      if(start_time){
        modalOptions.day = start_time;
      }
      var modalCalendar = $('#calendar_modal').calendar(modalOptions);
    };
    $scope.company = false;
    //attr为未参加，已参加，全部
    //type为modal,small
    $scope.getCampaigns = function(attr,type) {
      // if ($scope.isCalendar === true) {
      $scope.campaignsType = attr;
      var events_source = '/campaign/user/' + attr + '/calendar/'+$rootScope.uid;
      if(type=='modal'){
        initModalCalendar(events_source);
      }
      else{
        initCalendar(events_source);
      }

      // } else {
      //     $scope.campaignsType = attr;
      //     $http.get('/campaign/user/' + attr + '/list/'+$rootScope.uid).success(function(data, status) {
      //       $scope.campaigns = data.campaigns;
      //       $scope.company = false;
      //     });
      // }
    };

    $scope.getCampaigns($scope.campaignsType);
  }
]);
tabViewUser.controller('CampaignListController', ['$scope', '$http', '$rootScope',
  function($scope, $http, $rootScope) {
    $scope.company = false;
    $http.get('/campaign/getCampaigns/user/'+$rootScope.uid+'/all/0/0?' + (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
      $scope.campaigns = data.campaigns;
      $rootScope.sum = $scope.campaigns.length;
      if(data.campaignLength<20){
        $scope.loadMore_flag = false;
      }
      else{
        $scope.loadMore_flag = true;
      }
    });
    $scope.loadMore_flag = true;
    $scope.block = 1;
    $scope.page = 0;
    $scope.lastPage_flag = false;
    $scope.nextPage_flag = false;
    $scope.loadMore = function(){
      $http.get('/campaign/getCampaigns/user/'+$rootScope.uid+'/all/'+$scope.page+'/'+$scope.block+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
        if(data.result===1 && data.campaigns.length>0){
          $scope.campaigns = $scope.campaigns.concat(data.campaigns);
          if(data.campaignLength<20){
            $scope.loadMore_flag = false;
          }
          else{
            $scope.loadMore_flag = true;
          }
          if(++$scope.block==5){
            $scope.nextPage_flag = true;
            $scope.loadMore_flag = false;
            if($scope.page>1){
              $scope.lastPage_flag = true;
            }
          }

        }
        else{
          $scope.loadOver_flag = true;
          $scope.loadMore_flag = false;
          $scope.nextPage_flag = false;
        }
      });
    };
    $scope.changePage = function(flag){
      $http.get('/campaign/getCampaigns/user/'+$rootScope.uid+'/all/'+($scope.page+flag)+'/0?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
        if(data.result===1 && data.campaigns.length>0){
          if(flag ==1){
            $scope.page++;
          }
          else{
            $scope.page--;
          }
          $scope.campaigns = data.campaigns;
          $scope.nextPage_flag = false;
          $scope.lastPage_flag = false;
          $scope.loadOver_flag = false;
          $scope.block = 1;
          if(data.campaignLength<20){
            $scope.loadMore_flag = false;
            if(flag==1){
              $scope.lastPage_flag = true;
              $scope.nextPage_flag = false;
            }
            else{
              $scope.lastPage_flag = false;
              $scope.nextPage_flag = true;
            }
            $scope.loadOver_flag = true;
          }
          else{
            $scope.loadMore_flag = true;
            $scope.nextPage_flag = false;
            $scope.lastPage_flag = false;
            $scope.loadOver_flag = false;
          }
          window.scroll(0,0);
        }
        else{
          $scope.nextPage_flag = false;
          $scope.loadMore_flag = false;
          $scope.loadOver_flag = true;
        }
      });
    };
    $scope.join = function(campaign_id,index,tid) {
      if(!tid||tid.length<2){
        try {
          $http({
            method: 'post',
            url: '/campaign/joinCampaign/'+campaign_id,
            data:{
              campaign_id : campaign_id,
              tid : tid?tid[0]._id : null
            }
          }).success(function(data, status) {
            if(data.result===1){
              alertify.alert('成功加入该活动!');
              $scope.campaigns[index].join_flag = 1;
            }
            else{
              alertify.alert(data.msg);
            }
          }).error(function(data, status) {
            alertify.alert('DATA ERROR');
          });
        }
        catch(e) {
          console.log(e);
        }
      }
      else{
        $scope.join_teams=tid;
        $scope.select_index = 0;
        $scope.join_team = $scope.join_teams[0];
        $('#joinTeamSelectmodal').modal();
        $scope.campaign_id = campaign_id;
        $scope.campaign_index = index;
      }
    };
    $scope.selcetJoinTeam = function(index){
      $scope.join_team = $scope.join_teams[index];
      $scope.select_index = index;
    };
    $scope.joinCampaign = function(){
      $scope.join($scope.campaign_id,$scope.campaign_index,[$scope.join_team]);
    };
  }
]);
tabViewUser.controller('AccountFormController', ['$scope', '$http', '$rootScope',
  function($scope, $http, $rootScope) {
    angular.element('.tooltip').hide();
    $scope.editing = false;

    $scope.toggleEdit = function() {
      $scope.editing = !$scope.editing;
    }

    var markUserDepartment = function(user, department) {
      if (department && user.department) {
        for (var i = 0; i < department.length; i++) {
          if (department[i]._id.toString() === user.department._id.toString()) {
            department[i].selected = true;
            $scope.last_selected_node = department[i];
            $scope.ori_selected_node = department[i];
          }
          markUserDepartment(user, department[i].department);
        }
      }
    };

    var formatData = function(data) {
      $scope.node = {
        _id: data._id,
        name: data.name,
        is_company: true,
        department: data.department
      };
      if ($scope.node.department.length === 0) {
        $scope.node.department = null;
      }
    };

    var setDepartmentOptions = function(user) {
      $http.get('/departmentTree/' + user.cid)
        .success(function(data, status) {
          formatData(data);
          markUserDepartment(user, $scope.node.department);
        });
    };

    $scope.selectNode = function(node) {
      if (node.is_company === true) {
        return;
      }
      if ($scope.last_selected_node) {
        $scope.last_selected_node.selected = false;
      }
      node.selected = true;
      $scope.last_selected_node = node;
    };

    $http.get('/users/getAccount/'+$rootScope.uid).success(function(data, status) {
      if (data.result === 1) {
        $scope.user = data.data;
        setDepartmentOptions(data.data);
      } else {
        console.log(data.msg);
      }
    }).error(function(data, status) {
      //TODO:更改对话框
      alertify.alert('DATA ERROR');
    });

  }
]);

tabViewUser.controller('PasswordFormController', ['$http', '$scope', '$rootScope',
  function($http, $scope, $rootScope) {
    $scope.nowpassword = '';
    $scope.newpassword = '';
    $scope.confirmpassword = '';
    $scope.change_password = function() {
      $http({
        method: 'post',
        url: '/users/changePassword/'+$rootScope.uid,
        data: {
          'nowpassword': $scope.nowpassword,
          'newpassword': $scope.newpassword
        }
      }).success(function(data, status) {
        //TODO:更改对话框
        if (data.result === 1) {
          alertify.alert(data.msg);
          window.location.href = '#/personal';
        } else
          alertify.alert(data.msg);
      }).error(function(data, status) {
        //TODO:更改对话框
        alertify.alert('error');
      });
    };
  }
]);
