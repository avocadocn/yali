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
      .when('/group_message', {
        templateUrl: '/message_list',
        controller: 'GroupMessageController',
        controllerAs: 'messages'
      })
      .when('/campaign', {
        templateUrl: '/users/campaign',
        controller: 'CampaignListController',
        controllerAs: 'campaign'
      })
      .when('/personal', {
        templateUrl: '/users/editInfo',
        controller: 'AccountFormController',
        controllerAs: 'account'
      })
      .when('/timeLine/:uid', {
        templateUrl: '/campaign/timeline',
        controller: 'timelineController',
        controllerAs: 'timeline'
      })
      .when('/schedule', {
        templateUrl: '/users/getScheduleList',
        controller: 'ScheduleListController',
        controllerAs: 'schedule'
      })
      .when('/changePassword', {
        templateUrl: '/users/change_password',
        controller: 'PasswordFormController',
        controllerAs: 'password'
      }).
      otherwise({
        redirectTo: '/group_message'
      });
  }]);

tabViewUser.run(['$rootScope',
    function($rootScope) {
        $rootScope.nowTab = window.location.hash.substr(2);
        $rootScope.message_for_group = false;
        $rootScope.addactive = function(value) {
            $rootScope.nowTab = value;
            $rootScope.message_corner = false;
        };
    }
]);



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
tabViewUser.controller('timelineController',['$http','$scope','$routeParams',function($http,$scope,$routeParams){
    $http.get('/users/timeline/'+$routeParams.uid+'?'+ (Math.round(Math.random() * 100) + Date.now())).success(function(data, status) {
        if(data.result===1){
            $scope.timelines = data.timelines;
            $scope.newTimeLines = data.newTimeLines;
        }
        else{
             console.log('err');
        }
    });
}]);
tabViewUser.controller('GroupMessageController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {
        $scope.new_comment = [];
        $scope.toggle = [];
        $scope.message_role = "user";
        $rootScope.nowTab = 'group_message';
        $rootScope.$watch('uid',function(uid){
            $http.get('/groupMessage/user/'+uid+'/0?' + (Math.round(Math.random() * 100) + Date.now())).success(function(data, status) {
                $scope.user = data.user;
                $rootScope.message_corner = true;
                $scope.role = data.role;
                if(data.group_messages.length<20){
                    $scope.loadMore_flag = false;
                }
                else{
                    $scope.loadMore_flag = true;
                }
                $scope.group_messages = messageConcat(data.group_messages,$rootScope,$scope,true);
            });
        });

        $scope.loadMore_flag = false;
        $scope.block = 1;
        $scope.page = 1;
        $scope.pageTime = [0];
        $scope.lastPage_flag = false;
        $scope.nextPage_flag = false;
        $scope.loadMore = function(){
            $http.get('/groupMessage/user/'+$rootScope.uid+'/'+new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime()+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
                if(data.result===1 && data.group_messages.length>0){
                    $scope.group_messages = $scope.group_messages.concat(messageConcat(data.group_messages,$rootScope,$scope,false));
                    if(data.group_messages.length<20){
                        $scope.loadMore_flag = false;
                    }
                    else{
                        $scope.loadMore_flag = true;
                    }
                    if(++$scope.block==5){
                        $scope.nextPage_flag = true;
                        $scope.loadMore_flag = false;
                        if($scope.page!=1){
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
        }
        $scope.changePage = function(flag){
            var start_time = flag ==1? new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime() :$scope.pageTime[$scope.page-2];
            $http.get('/groupMessage/user/'+$rootScope.uid+'/'+start_time+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
                if(data.result===1 && data.group_messages.length>0){
                    if(flag ==1){
                        $scope.page++;
                        $scope.pageTime.push(new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime());
                    }
                    else{
                        $scope.page--;
                        $scope.pageTime.pop();
                    }
                    $scope.group_messages = messageConcat(data.group_messages,$rootScope,$scope,true);
                    if(data.group_messages.length<20){
                        $scope.loadMore_flag = false;
                    }
                    else{
                        $scope.loadMore_flag = true;
                    }
                    $scope.nextPage_flag = false;
                    $scope.lastPage_flag = false;
                    $scope.loadOver_flag = false;
                    $scope.block = 1;
                    window.scroll(0,0);
                }
                else{
                    $scope.nextPage_flag = false;
                    $scope.loadMore_flag = false;
                    $scope.loadOver_flag = true;
                }
            });
        }

        $scope.toggleOperate = function(index){
            $scope.toggle[index] = !$scope.toggle[index];
            $scope.message_index = index;
        }
        $scope.getComment = function(index){
            if($scope.toggle){
                try {
                    $http({
                        method: 'post',
                        url: '/comment/pull',
                        data:{
                            host_id : $scope.group_messages[index].campaign._id
                        }
                    }).success(function(data, status) {
                        if(data.length > 0){
                            $scope.group_messages[index].comments = data;
                            $scope.fixed_sum = data.length;
                            for(var i = 0; i < $scope.group_messages[index].comments.length; i ++) {
                                if($scope.group_messages[index].comments[i].status == 'delete'){
                                    $scope.group_messages[index].comments.splice(i,1);
                                    i--;
                                }else{
                                    var leader = false;
                                    var find = false;
                                    //个人动态里如果出现队长权限,那么只有该小队的队长才能删除该小队对应活动的留言
                                    if($scope.role === 'LEADER' || $scope.role === 'OWNER'){
                                        for(var ii = 0; ii < $scope.group_messages[index].team.length; ii ++){
                                            for(var j = 0;j<$scope.user.team.length;j++){
                                                if($scope.user.team[j]._id === $scope.group_messages[index].team[ii].teamid){
                                                    leader = $scope.user.team[j].leader;
                                                    if(leader){
                                                        find = true;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    $scope.group_messages[index].comments[i].show = $scope.group_messages[index].comments[i].status !== 'delete';
                                    $scope.group_messages[index].comments[i].index = data.length - i;
                                    $scope.group_messages[index].comments[i].delete_permission = $scope.role === 'HR' || leader || $scope.group_messages[index].comments[i].poster._id === $scope.user._id;
                                }
                            }
                        }
                    }).error(function(data, status) {
                        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                    });
                }
                catch(e) {
                    console.log(e);
                }
            }
        }


        $scope.deleteComment = function(index){
            try {
                $http({
                    method: 'post',
                    url: '/comment/delete',
                    data:{
                        comment_id : $scope.group_messages[$scope.message_index].comments[index]._id,
                        host_type:'campaign',
                        host_id:$scope.group_messages[$scope.message_index].campaign._id
                    }
                }).success(function(data, status) {
                    if(data === 'SUCCESS'){
                        $scope.group_messages[$scope.message_index].comments.splice(index,1);
                        $scope.group_messages[$scope.message_index].campaign.comment_sum --;
                    } else {
                        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                    }
                }).error(function(data, status) {
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                });
            }
            catch(e) {
                console.log(e);
            }
        }
        $scope.comment = function(index){
            if($scope.group_messages[index].comments.length > 0){
                var tmp_comment = $scope.group_messages[index].comments[0];
                if(tmp_comment.poster._id === $scope.user._id){
                    if($scope.new_comment[index].text === tmp_comment.content){
                        alertify.alert('勿要重复留言!');
                        return;
                    }
                }
            }
            try {
                $http({
                    method: 'post',
                    url: '/comment/push',
                    data:{
                        host_id : $scope.group_messages[index].campaign._id,
                        content : $scope.new_comment[index].text,
                        host_type : 'campaign'
                    }
                }).success(function(data, status) {
                    if(data.msg === 'SUCCESS'){
                        $scope.group_messages[index].campaign.comment_sum ++;
                        $scope.group_messages[index].comments.unshift({
                            'show':true,
                            'host_id' : data.comment.host_id,
                            'content' : data.comment.content,
                            'create_date' : data.comment.create_date,
                            'poster' : data.comment.poster,
                            'host_type' : data.comment.host_type,
                            'index' : $scope.fixed_sum+1
                        });
                    } else {
                        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                    }
                }).error(function(data, status) {
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                });
            }
            catch(e) {
                console.log(e);
            }
        }

        $scope.vote = function(competition_id, vote_status, index) {
            try {
                $http({
                    method: 'post',
                    url: '/users/vote',
                    data:{
                        competition_id : competition_id,
                        aOr : vote_status,
                        tid : $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].id
                    }
                }).success(function(data, status) {
                    if(data.result===0) {
                        $rootScope.donlerAlert(data.msg);
                    } else {
                        $scope.group_messages[index].vote_flag = vote_status ? data.data.quit : -data.data.quit;
                        $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].vote.positive = data.data.positive;
                        $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].vote.negative = data.data.negative;
                        $scope.loadMore_flag = false;
                    }
                });
            }
            catch(e) {
                console.log(e);
            }
        };
        $scope.join = function(campaign_id,index) {
            try {
                $http({
                    method: 'post',
                    url: '/users/joinCampaign',
                    data:{
                        campaign_id : campaign_id
                    }
                }).success(function(data, status) {
                    if(data.result===1){
                        //alert('成功加入该活动!');
                        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN_CAMPAIGN_SUCCESS);
                        $scope.group_messages[index].join_flag = true;
                        $scope.group_messages[index].member_num++;
                    }
                    else{
                        $rootScope.donlerAlert(data.msg);
                    }
                }).error(function(data, status) {
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                });
            }
            catch(e) {
                console.log(e);
            }
        };

        $scope.quit = function(campaign_id,index) {
            try {
                $http({
                    method: 'post',
                    url: '/users/quitCampaign',
                    data:{
                        campaign_id : campaign_id
                    }
                }).success(function(data, status) {
                    if(data.result===1){
                        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT_CAMPAIGN_SUCCESS);
                        //alert('您已退出该活动!');
                        $scope.group_messages[index].join_flag = false;
                        $scope.group_messages[index].member_num--;
                    }
                    else{
                        $rootScope.donlerAlert(data.msg);
                    }
                }).error(function(data, status) {
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                });
            }
            catch(e) {
                console.log(e);
            }
        };
        //应战
        $scope.responseProvoke = function(tid,provoke_message_id) {
            try {
                $http({
                    method: 'post',
                    url: '/group/responseProvoke/'+tid,
                    data:{
                        provoke_message_id : provoke_message_id
                    }
                }).success(function(data, status) {
                    window.location.reload();
                }).error(function(data, status) {
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                });
            }
            catch(e) {
                console.log(e);
            }
        };
    }
]);

tabViewUser.controller('CampaignListController', ['$http','$scope','$rootScope',function ($http, $scope,$rootScope) {
    $scope.company = false;
    $http.get('/campaign/getCampaigns/user/all/0?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
        $scope.campaigns = data.campaigns;
        if(data.campaigns.length<20){
            $scope.loadMore_flag = false;
        }
        else{
            $scope.loadMore_flag = true;
        }
    });
    $scope.loadMore_flag = false;
    $scope.block = 1;
    $scope.page = 1;
    $scope.pageTime = [0];
    $scope.lastPage_flag = false;
    $scope.nextPage_flag = false;
    $scope.loadMore = function(){
        $http.get('/campaign/getCampaigns/user/'+$rootScope.uid+'/all/'+new Date($scope.campaigns[$scope.campaigns.length-1].start_time).getTime()+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            if(data.result===1 && data.campaigns.length>0){
                $scope.campaigns = $scope.campaigns.concat(data.campaigns);
                if(data.campaigns.length<20){
                    $scope.loadMore_flag = false;
                }
                else{
                    $scope.loadMore_flag = true;
                }
                if(++$scope.block==5){
                    $scope.nextPage_flag = true;
                    $scope.loadMore_flag = false;
                    if($scope.page!=1){
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
    }
    $scope.changePage = function(flag){
        var start_time = flag ==1? new Date($scope.campaigns[$scope.campaigns.length-1].start_time).getTime() :$scope.pageTime[$scope.page-2];
        $http.get('/campaign/getCampaigns/user/'+$rootScope.uid+'/all/'+start_time+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            if(data.result===1 && data.campaigns.length>0){
                if(flag ==1){
                    $scope.page++;
                    $scope.pageTime.push(new Date($scope.campaigns[$scope.campaigns.length-1].start_time).getTime());
                }
                else{
                    $scope.page--;
                }
                $scope.campaigns = data.campaigns;
                if(data.campaigns.length<20){
                    $scope.loadMore_flag = false;
                }
                else{
                    $scope.loadMore_flag = true;
                }
                $scope.nextPage_flag = false;
                $scope.lastPage_flag = false;
                $scope.loadOver_flag = false;
                $scope.block = 1;
                window.scroll(0,0);
            }
            else{
                $scope.nextPage_flag = false;
                $scope.loadMore_flag = false;
                $scope.loadOver_flag = true;
            }
        });
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
                    $scope.group_messages[index].join_flag = false;
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
    $scope.responseProvoke = function(tid, provoke_message_id) {
        try {
            $http({
                method: 'post',
                url: '/group/responseProvoke/' + tid,
                data: {
                    provoke_message_id: provoke_message_id
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
}]);

// tabViewUser.controller('CampaignListController', ['$http', '$scope', '$rootScope',
//     function($http, $scope, $rootScope) {
//         $scope.company = false;
//         $http.get('/campaign/getCampaigns/user/all/0?' + (Math.round(Math.random() * 100) + Date.now())).success(function(data, status) {
//             $scope.campaigns = data.campaigns;
//         });
//         $scope.loadMore_flag = true;
//         $scope.page = 1;
//         $scope.loadMore = function() {
//             $http.get('/campaign/getCampaigns/user/all/' + $scope.page + '?' + (Math.round(Math.random() * 100) + Date.now())).success(function(data, status) {
//                 if (data.result === 1 && data.campaigns.length > 0) {
//                     $scope.campaigns = $scope.campaigns.concat(data.campaigns);
//                     $scope.page++;
//                 } else {
//                     $scope.loadMore_flag = false;
//                 }
//             });
//         }
//         $scope.join = function(campaign_id, index) {
//             try {
//                 $http({
//                     method: 'post',
//                     url: '/users/joinCampaign',
//                     data: {
//                         campaign_id: campaign_id
//                     }
//                 }).success(function(data, status) {
//                     if (data.result === 1) {
//                         $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN_CAMPAIGN_SUCCESS);
//                         $scope.campaigns[index].join_flag = true;
//                         $scope.campaigns[index].member_length++;
//                     } else {
//                         alert(data.msg);
//                     }
//                 }).error(function(data, status) {
//                     $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
//                 });
//             } catch (e) {
//                 console.log(e);
//             }
//         };

//         $scope.quit = function(campaign_id, index) {
//             try {
//                 $http({
//                     method: 'post',
//                     url: '/users/quitCampaign',
//                     data: {
//                         campaign_id: campaign_id
//                     }
//                 }).success(function(data, status) {
//                     if (data.result === 1) {
//                         $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT_CAMPAIGN_SUCCESS);
//                         $scope.campaigns[index].join_flag = false;
//                         $scope.campaigns[index].member_length--;
//                     } else {
//                         alert(data.msg);
//                     }
//                 }).error(function(data, status) {
//                     $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
//                 });
//             } catch (e) {
//                 console.log(e);
//             }
//         };
//     }
// ]);


tabViewUser.controller('ScheduleListController', ['$scope', '$http', '$rootScope',
    function($scope, $http, $rootScope) {

        $scope.isCalendar = true;
        $scope.isDayView = false;

        // 判断是否是第一次加载视图，用于$scope.$digest()
        var firstLoad = true;
        $scope.campaignsType = 'all';

        $scope.calendar = function(isCalendar) {
            $scope.isCalendar = isCalendar;
            $scope.getCampaigns($scope.campaignsType);
        };

        var initCalendar = function(events_source) {
            var options = {
                events_source: events_source,
                view: 'weeks',
                time_end: '24:00',
                tmpl_path: '/tmpls/',
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
        };


        $scope.company = false; // 作用？
        $scope.getCampaigns = function(attr) {
            if ($scope.isCalendar === true) {
                $scope.campaignsType = attr;
                var events_source = '/campaign/user/' + attr + '/calendar';
                initCalendar(events_source);
            } else {
                $scope.campaignsType = attr;
                $http.get('/campaign/user/' + attr + '/list').success(function(data, status) {
                  $scope.campaigns = data.campaigns;
                  $scope.company = false;
                });
            }
        };

        $scope.getCampaigns('all');


        // $scope.join = function(campaign_id,index) {
        //     try {
        //         $http({
        //             method: 'post',
        //             url: '/users/joinCampaign',
        //             data:{
        //                 campaign_id : campaign_id
        //             }
        //         }).success(function(data, status) {
        //             if(data.result===1){
        //                 $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN_CAMPAIGN_SUCCESS);
        //                 $scope.campaigns[index].join = true;
        //                 $scope.campaigns[index].member_length++;
        //             }
        //             else{
        //                 alert(data.msg);
        //             }
        //         }).error(function(data, status) {
        //             $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
        //         });
        //     }
        //     catch(e) {
        //         console.log(e);
        //     }
        // };

        // $scope.quit = function(campaign_id,index) {
        //     try {
        //         $http({
        //             method: 'post',
        //             url: '/users/quitCampaign',
        //             data:{
        //                 campaign_id : campaign_id
        //             }
        //         }).success(function(data, status) {
        //             if(data.result===1){
        //                 $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT_CAMPAIGN_SUCCESS);
        //                 $scope.campaigns[index].join = false;
        //                 $scope.campaigns[index].member_length--;
        //             }
        //             else{
        //                 alert(data.msg);
        //             }
        //         }).error(function(data, status) {
        //             $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
        //         });
        //     }
        //     catch(e) {
        //         console.log(e);
        //     }
        // };


    }
]);

tabViewUser.controller('AccountFormController', ['$scope', '$http', '$rootScope',
    function($scope, $http, $rootScope) {
        $rootScope.nowTab = 'personal';
        $http.get('/users/'+$rootScope.uid+'/getAccount').success(function(data, status) {
            if (data.result === 1) {
                $scope.user = data.data;
            } else {
                console.log(data.msg);
            }
        }).error(function(data, status) {
            //TODO:更改对话框
            $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.ACCOUNT_FAILURE);
        });
        $scope.baseUnEdit = true;
        //$scope.baseButtonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.EDIT;
        $scope.baseButtonStatus = '编辑';
        $scope.linkUnEdit = true;
        //$scope.linkButtonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.EDIT;
        $scope.linkButtonStatus = '编辑';
        $scope.baseEditToggle = function() {
            $scope.baseUnEdit = !$scope.baseUnEdit;
            if ($scope.baseUnEdit) {
                try {
                    var _info = {
                        email: $scope.user.email,
                        nickname: $scope.user.nickname,
                        realname: $scope.user.realname,
                        position: $scope.user.position,
                        sex: $scope.user.sex,
                        birthday: $scope.user.birthday,
                        bloodType: $scope.user.bloodType,
                        introduce: $scope.user.introduce,
                    };
                    $http({
                        method: 'post',
                        url: '/users/'+$rootScope.uid+'/saveAccount',
                        data: {
                            user: _info
                        }
                    }).success(function(data, status) {
                        //TODO:更改对话框
                        if (data.result === 1) {
                            $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.MSG_UPDATE_SUCCESS);
                            //重新刷新页面
                            window.location.reload();
                        } else
                            $rootScope.donlerAlert(data.msg);
                    }).error(function(data, status) {
                        //TODO:更改对话框
                        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                    });
                } catch (e) {
                    console.log(e);
                }
                //$scope.baseButtonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.EDIT;
                $scope.baseButtonStatus = '编辑';
            } else {
                //$scope.baseButtonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.SAVE;
                $scope.baseButtonStatus = '保存';
            }
        };
        $scope.linkEditToggle = function() {
            $scope.linkUnEdit = !$scope.linkUnEdit;
            if ($scope.linkUnEdit) {
                try {
                    var _info = {
                        phone: $scope.user.phone,
                        email: $scope.user.email,
                        qq: $scope.user.qq
                    };
                    $http({
                        method: 'post',
                        url: '/users/'+$rootScope.uid+'/saveAccount',
                        data: {
                            user: _info
                        }
                    }).success(function(data, status) {
                        //TODO:更改对话框
                        if (data.result === 1)
                            $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.MSG_UPDATE_SUCCESS);
                        else
                            $rootScope.donlerAlert(data.msg);
                    }).error(function(data, status) {
                        //TODO:更改对话框
                        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                    });
                } catch (e) {
                    console.log(e);
                }
                //$scope.linkButtonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.EDIT;
                $scope.linkButtonStatus = '编辑';
            } else {
                //scope.linkButtonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.SAVE;
                $scope.linkButtonStatus = '保存';
            }
        };

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
                url: '/users/'+$rootScope.uid+'/changePassword',
                data: {
                    'nowpassword': $scope.nowpassword,
                    'newpassword': $scope.newpassword
                }
            }).success(function(data, status) {
                //TODO:更改对话框
                if (data.result === 1) {
                    $rootScope.donlerAlert(data.msg);
                    window.location.href = '#/personal';
                } else
                    $rootScope.donlerAlert(data.msg);
            }).error(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        };
    }
]);
