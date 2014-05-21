'use strict';

var tabViewGroup = angular.module('tabViewGroup', ['ngRoute','ngAnimate','mgcrea.ngStrap.datepicker','mgcrea.ngStrap.timepicker']);

tabViewGroup.run(['$rootScope', function( $rootScope) {
    $rootScope.nowTab = window.location.hash.substr(2);
    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
    };
}]);
tabViewGroup.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/group_message', {
        templateUrl: '/views/group_message_list.html',
        controller: 'GroupMessageController',
        controllerAs: 'messages'
      })
      .when('/group_campaign', {
        templateUrl: '/group/campaign',
        controller: 'CampaignListController',
        controllerAs: 'campaign'
      })
      .when('/group_member', {
        templateUrl: '/group/getMembers',
        controller: 'MemberListController',
        controllerAs: 'member'
      })
      .when('/group_info', {
        templateUrl: '/group/renderInfo',
        controller: 'infoController',
        controllerAs: 'account',
      })
      .when('/timeLine', {
        templateUrl: '/group/timeLine',
        //controller: 'infoController',
        //controllerAs: 'account',
      }).
      otherwise({
        redirectTo: '/group_message'
      });
  }]);

tabViewGroup.controller('GroupMessageController', ['$http','$scope','$rootScope',
  function ($http, $scope,$rootScope) {

    var teamId;
    $scope.$watch('teamId',function(tid){
        teamId = tid;
        $http.get('/group/getGroupMessages/'+tid +'?' + Math.round(Math.random()*100)).success(function(data, status) {
            $scope.group_messages = data.group_messages;
            $scope.role = data.role;
        });
    });

    //var teamId = $('#team_content').attr('team-id');
    $rootScope.nowTab ='group_message';
    //消除ajax缓存
    $scope.vote = function(provoke_message_id, status, index) {
         try {
            $http({
                method: 'post',
                url: '/users/vote',
                data:{
                    provoke_message_id : provoke_message_id,
                    aOr : status
                }
            }).success(function(data, status) {
                if(data.msg != undefined && data.msg != null) {
                    alert(data.msg);
                } else {
                    $scope.group_messages[index].positive = data.positive;
                    $scope.group_messages[index].negative = data.negative;
                }
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    //应战
    $scope.responseProvoke = function(provoke_message_id) {
         try {
            $http({
                method: 'post',
                url: '/group/responseProvoke/'+teamId,
                data:{
                    provoke_message_id : provoke_message_id
                }
            }).success(function(data, status) {
                window.location.reload();
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);


tabViewGroup.controller('CampaignListController', ['$http', '$scope','$rootScope',
  function($http, $scope,$rootScope) {
    $rootScope.nowTab = 'group_campaign';


    var groupId,teamId;
    $scope.$watch('teamId',function(tid){
        //消除ajax缓存
        teamId = tid;
        $http.get('/group/getCampaigns/'+tid+'?' + Math.round(Math.random()*100)).success(function(data, status) {
            $scope.campaigns = data.data;
            $scope.role = data.role;    //只有改组的组长才可以操作活动(关闭、编辑等)
        });

        //TODO 发起活动或者挑战时搜索应约对象 暂时先放在这里
        $http.get('/search/company').success(function(data, status) {
            $scope.companies = data;
        });
    });

    $scope.$watch('groupId',function(gid){
        groupId = gid;
    });


    $scope.company = false;

    $scope.provoke_select = function (team) {
        $scope.team_opposite = team;
        alert("您将对"+team.cname+"的"+team.name+"发起挑战!");
    };
    $scope.getTeam = function (cid) {
        try {
            $http({
                method: 'post',
                url: '/search/team',
                data:{
                    cid : cid,
                    gid : groupId
                }
            }).success(function(data, status) {
                $scope.teams = data;
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    //约战
    $scope.provoke = function() {
         try {
            $http({
                method: 'post',
                url: '/group/provoke/'+teamId,
                data:{
                    provoke_model : 'against',
                    team_opposite : $scope.team_opposite,
                    content : $scope.content,
                    location: $scope.location,
                    remark: $scope.remark,
                    competition_date: $scope.competition_date,
                    deadline: $scope.deadline,
                    competition_format: $scope.competition_format,
                    number: $scope.number

                }
            }).success(function(data, status) {
                window.location.reload();
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $scope.getId = function(cid) {
        $scope.campaign_id = cid;
    };
    $scope.editCampaign = function() {
        try{
            $http({
                method: 'post',
                url: '/group/campaignEdit',
                data:{
                    campaign_id : $scope.campaign_id,
                    content : $scope.content,
                    start_time : $scope.start_time,
                    end_time : $scope.end_time
                }
            }).success(function(data, status) {
                //发布活动后跳转到显示活动列表页面
                window.location.reload();

            }).error(function(data, status) {
                //TODO:更改对话框
                alert('数据发生错误！');
            });
        }
        catch(e){
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
                    alert('成功加入该活动!');
                    $scope.campaigns[index].join = true;
                    $scope.campaigns[index].member_length++;
                }
                else{
                    alert(data.msg);
                }
            }).error(function(data, status) {
                alert('数据发生错误！');
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
                    alert('您已退出该活动!');
                    $scope.campaigns[index].join = false;
                    $scope.campaigns[index].member_length--;
                }
                else{
                    alert(data.msg);
                }
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $scope.sponsor = function() {
        try{
            $http({
                method: 'post',
                url: '/group/campaignSponsor/'+teamId,
                data:{
                    location: $scope.location,
                    content : $scope.content,
                    start_time : $scope.start_time,
                    end_time : $scope.end_time
                }
            }).success(function(data, status) {
                //发布活动后跳转到显示活动列表页面
                window.location.reload();

            }).error(function(data, status) {
                //TODO:更改对话框
                alert('数据发生错误！');
            });

        }
        catch(e){
            console.log(e);
        }
    };

    $scope.cancel = function (_id) {
        try {
            $http({
                method: 'post',
                url: '/group/campaignCancel',
                data:{
                    campaign_id : _id
                }
            }).success(function(data, status) {
                window.location.reload();
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);

tabViewGroup.controller('MemberListController', ['$http','$scope','$rootScope', function($http,$scope,$rootScope) {
    $rootScope.nowTab = 'group_member';

    $scope.$watch('teamId',function(tid){
        $http.get('/group/getGroupMembers/'+tid+'?' + Math.round(Math.random()*100)).success(function(data, status) {
            if(data.result==1){
                $scope.members = data.data.member;
                $scope.leaders = data.data.leader;
                $scope.company = false;
            }
        });
    });

    $scope.userDetail = function(index) {
        $scope.num = index;
    }
}]);

tabViewGroup.controller('infoController', ['$http', '$scope',function($http, $scope) {
    $scope.unEdit = true;
    $scope.buttonStatus = '编辑';
    $scope.$watch('teamId',function(tid){
        $http.get('/group/info/'+tid).success(function(data, status) {
            $scope.companyname = data.companyGroup.cname;
            $scope.create_time = data.entity.create_date ? data.entity.create_date :'';
            $scope.name = data.companyGroup.name ? data.companyGroup.name : '';
            $scope.brief = data.companyGroup.brief ? data.companyGroup.brief : '';
            $scope.leaders = data.companyGroup.leader.length > 0 ? data.companyGroup.leader : '';
            $scope.main_forces = data.entity.main_force.length > 0 ? data.entity.main_force : '';
            $scope.alternates = data.entity.alternate.length > 0 ? data.entity.alternate : '';
            $scope.home_court_1 = data.entity.home_court[0] ? data.entity.home_court[0] : '';
            $scope.home_court_2 = data.entity.home_court[1] ? data.entity.home_court[1] : '';
            $scope.family = data.entity.family;
            $scope.members = data.companyGroup.member;
        });
    });

    $scope.editToggle = function() {
        $scope.unEdit = !$scope.unEdit;
        if($scope.unEdit) {
            try{
                $http({
                    method : 'post',
                    url : '/group/saveInfo',
                    data : {
                        'name' : $scope.name,
                        'brief' : $scope.brief,
                        'homecourt': [$scope.home_court_1,$scope.home_court_2]
                    }
                }).success(function(data, status) {
                    //TODO:更改对话框
                    if(data.result === 1) {
                        alert('信息修改成功！');
                        window.location.reload();
                    }
                    else
                        alert(data.msg);
                }).error(function(data, status) {
                    //TODO:更改对话框
                    alert('数据发生错误！');
                });
            }
            catch(e) {
                console.log(e);
            }
            $scope.buttonStatus = '编辑';
        }
        else {
            $scope.buttonStatus = '保存';
        }
  };
}]);
