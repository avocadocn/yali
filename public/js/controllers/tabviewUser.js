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
      .when('/campaign/:uid', {
        templateUrl: function(params){
            return '/users/campaign/'+params.uid;
        },
        controller: 'CampaignListController',
        controllerAs: 'campaign'
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
        },
        controller: 'TimeLineController'
      })
      .when('/schedule/:uid', {
        templateUrl: function(params){
            return '/users/getScheduleList/'+params.uid;
        },
        controller: 'ScheduleListController',
        controllerAs: 'schedule'
      })
      .when('/changePassword/:uid', {
        templateUrl: function(params) {
            return '/users/change_password/' + params.uid;
        },
        controller: 'PasswordFormController',
        controllerAs: 'password'
      })
      .otherwise({
        redirectTo: '/group_message'
      });
  }]);

tabViewUser.run(['$rootScope','$location',
    function($rootScope,$location) {
        if($location.hash()!=='')
            $rootScope.nowTab = window.location.hash.substr(2);
        else if($location.path()!=='')
            $rootScope.nowTab = $location.path().substr(1);
        $rootScope.message_for_group = false;
        $rootScope.addactive = function(value) {
            $rootScope.nowTab = value;
            $rootScope.message_corner = false;
            angular.element('.tooltip').hide();
        };
        $rootScope.$on("$routeChangeStart",function(){
            $rootScope.loading = true;
        });
        $rootScope.$on("$routeChangeSuccess",function(){
            $rootScope.loading = false;
        });
        $rootScope.$watch("role",function(role){
            if (role && $location.hash()=='' && $location.path()==''){
                if(role === 'OWNER'){
                    $location.path('/group_message');
                    $rootScope.nowTab='group_message';
                }
                else{
                    $location.path('/personal/'+$rootScope.uid);
                    $rootScope.nowTab='personal/'+$rootScope.uid;
                }
            }
        });
    }
]);


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
tabViewUser.controller('recentCampaignController',['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {
        $scope.recentCampaigns = [];
        $rootScope.$watch('uid',function(uid){
            if(!uid)
                return;
            try{
                $http({
                    method:'get',
                    url: '/campaign/user/recent/list/'+uid +'?'+Math.random()*10000,
                }).success(function(data,status){
                    if(data.result===1){
                        $scope.recentCampaigns = data.campaigns;
                    }
                }).error(function(data,status){
                    alertify.alert('DATA ERROR');
                });
            }
            catch(e){
                console.log(e);
            }
        });
        
    }
]);
tabViewUser.controller('TimeLineController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {
        $rootScope.nowTab = 'timeLine';
    }
]);
tabViewUser.controller('GroupMessageController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {
        $rootScope.nowTab = 'group_message';
        angular.element('.tooltip').hide();
        $scope.new_comment = [];
        $scope.toggle = [];
        $scope.message_role = "user";
        $rootScope.nowTab = 'group_message';
        $rootScope.$watch('uid',function(uid){
            $http.get('/groupMessage/user/'+uid+'/0?' + (Math.round(Math.random() * 100) + Date.now())).success(function(data, status) {
                $scope.user = data.user;
                $rootScope.message_corner = true;
                $scope.role = data.role;
                if(data.message_length<20){
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
                    if(data.message_length<20){
                        $scope.loadMore_flag = false;
                        if($scope.pageTime.length>1){
                            $scope.lastPage_flag = true;
                        }
                    }
                    else{
                        $scope.loadMore_flag = true;
                    }
                    if($scope.pageTime.length>1){
                        $scope.lastPage_flag = true;
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
                    if(data.message_length<20){
                        $scope.loadMore_flag = false;
                        $scope.loadOver_flag = true;
                    }
                    else{
                        $scope.loadMore_flag = true;
                        $scope.nextPage_flag = false;
                        $scope.lastPage_flag = false;
                        $scope.loadOver_flag = false;
                    }
                    if(flag==1){
                        $scope.lastPage_flag = true;
                        $scope.nextPage_flag = false;
                    }
                    else{
                        $scope.lastPage_flag = false;
                        $scope.nextPage_flag = true;
                    }
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
                        url: '/comment/pull/user/0',
                        data:{
                            host_id : $scope.group_messages[index].campaign._id
                        }
                    }).success(function(data, status) {
                        if(data.comments.length > 0){
                            $scope.group_messages[index].comments = data.comments;
                            $scope.fixed_sum = data.comments.length;
                        }
                    }).error(function(data, status) {
                        alertify.alert('DATA ERROR');
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
                        comment_id : $scope.group_messages[$scope.message_index].comments[index]._id
                    }
                }).success(function(data, status) {
                    if(data === 'SUCCESS'){
                        $scope.group_messages[$scope.message_index].comments.splice(index,1);
                        $scope.group_messages[$scope.message_index].campaign.comment_sum --;
                    } else {
                        alertify.alert('DATA ERROR');
                    }
                }).error(function(data, status) {
                    alertify.alert('DATA ERROR');
                });
            }
            catch(e) {
                console.log(e);
            }
        }
        $scope.comment = function(index,form){
            if($scope.group_messages[index].comments.length > 0){
                var tmp_comment = $scope.group_messages[index].comments[0];
                if(tmp_comment.poster._id === $scope.user._id){
                    if(form.new_comment.$viewValue === tmp_comment.content){
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
                        content : form.new_comment.$viewValue,
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
                        $scope.new_comment[index].text='';
                        form.$setPristine();
                    } else {
                        alertify.alert('DATA ERROR');
                    }
                }).error(function(data, status) {
                    alertify.alert('DATA ERROR');
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
                    url: '/campaign/vote/'+competition_id,
                    data:{
                        competition_id : competition_id,
                        aOr : vote_status,
                        tid : $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].id
                    }
                }).success(function(data, status) {
                    if(data.result===0) {
                        alertify.alert(data.msg);
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
        var joinCommit = function(campaign_id,index,tid){
            try {
                $http({
                    method: 'post',
                    url: '/campaign/joinCampaign/'+campaign_id,
                    data:{
                        campaign_id : campaign_id,
                        tid : tid
                    }
                }).success(function(data, status) {
                    if(data.result===1){
                        //alert('成功加入该活动!');
                        alertify.alert('成功加入该活动!');
                        $scope.group_messages[index].join_flag = true;
                        $scope.group_messages[index].member_num++;
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
        $scope.join = function(campaign_id,index,tid) {
            if($scope.group_messages[index].myteam.length>1){
                $scope.join_teams=$scope.group_messages[index].myteam;
                $scope.join_campaign_id = campaign_id;
                $scope.join_index = index;
                $scope.select_index = 0;
                $('#joinTeamSelectmodal').modal();
            }
            else{
                joinCommit(campaign_id,index,tid);
            }
        };
        $scope.selcetJoinTeam = function(index){
            $scope.select_index = index;
        };
        $scope.joinCampaign = function(){
            joinCommit($scope.join_campaign_id,$scope.join_index,$scope.join_teams[$scope.select_index]._id);
        };

        $scope.quit = function(campaign_id,index,tid) {
            try {
                $http({
                    method: 'post',
                    url: '/campaign/quitCampaign/'+campaign_id,
                    data:{
                        campaign_id : campaign_id,
                        tid : tid
                    }
                }).success(function(data, status) {
                    if(data.result===1){
                        alertify.alert('成功退出该活动!');
                        //alert('您已退出该活动!');
                        $scope.group_messages[index].join_flag = false;
                        $scope.group_messages[index].member_num--;
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
                    alertify.alert('DATA ERROR');
                });
            }
            catch(e) {
                console.log(e);
            }
        };
    }
]);

tabViewUser.controller('ScheduleListController', ['$scope', '$http', '$rootScope',
    function($scope, $http, $rootScope) {
        $rootScope.nowTab = 'schedule';
        angular.element('.tooltip').hide();
        $scope.isCalendar = true;
        $scope.isDayView = false;

        // 判断是否是第一次加载视图，用于$scope.$digest()
        var firstLoad = true;
        $scope.campaignsType = 'joined';

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


        $scope.company = false; 
        $scope.getCampaigns = function(attr) {
            // if ($scope.isCalendar === true) {
                $scope.campaignsType = attr;
                var events_source = '/campaign/user/' + attr + '/calendar/'+$rootScope.uid;
                initCalendar(events_source);
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
        $rootScope.nowTab = 'campaign';
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
        $scope.judgeYear = function(index){
            if(index ==0 || new Date($scope.campaigns[index].start_time).getFullYear()!=new Date($scope.campaigns[index-1].start_time).getFullYear()){
                return true;
            }
            else {
                return false;
            }
        };
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
        $rootScope.nowTab = 'personal';
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
        $rootScope.nowTab = 'personal';
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
