'use strict';

var tabViewGroup = angular.module('mean.main');


function tirm(arraies,str) {
    var rst = [];
    for(var i = 0; i < arraies.length; i++) {
        if(arraies[i].name.indexOf(str) > -1) {
            console.log(arraies[i].name,str);
            rst.push(arraies[i])
        } else {
            console.log('no',arraies[i].name,str);
        }
    }
    return rst;
}
tabViewGroup.config(['$routeProvider', '$locationProvider',
  function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/group_message', {
        templateUrl: '/group/group_message_list',
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

tabViewGroup.run(['$http','$rootScope', function ($http, $rootScope) {
    $rootScope.nowTab = window.location.hash.substr(2);
    $rootScope.companies = -1;
    $rootScope.teams_for_company = -1;
    $rootScope.teams_for_team = -1;

    $rootScope.company_first = false;
    $rootScope.team_first = false;

    $rootScope.s_company = "";
    $rootScope.s_team = "";


    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
    };

    $rootScope.showProvoke = function() {
        $("#sponsorProvokeModel").modal();
    }

    //约战
    $rootScope.provoke = function() {
         try {
            $http({
                method: 'post',
                url: '/group/provoke/'+$rootScope.teamId,
                data:{
                    provoke_model : 'against',
                    team_opposite : $rootScope.team_opposite,
                    content : $rootScope.content,
                    location: $rootScope.location,
                    remark: $rootScope.remark,
                    competition_date: $rootScope.competition_date,
                    deadline: $rootScope.deadline,
                    competition_format: $rootScope.competition_format,
                    number: $rootScope.number

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


    //应战
    $rootScope.responseProvoke = function(provoke_message_id) {
         try {
            $http({
                method: 'post',
                url: '/group/responseProvoke/'+$rootScope.teamId,
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

    $rootScope.getCompany =function(_tirm) {

        try {
            $http({
                method: 'post',
                url: '/search/company',
                data:{
                    regx : _tirm
                }
            }).success(function(data, status) {
                $rootScope.companies = data;
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
        /*
        if(!$rootScope.company_first) {
            //第一次获取所有公司信息
            $http.get('/search/company').success(function(data, status) {
                $rootScope.companies_orign = data;
                var temp = tirm($rootScope.companies_orign,_tirm);
                if(temp.length > 0) {
                    $rootScope.companies = temp;
                }
            });
            $rootScope.company_first = true;
        } else {
            //过滤
            var temp = tirm($rootScope.companies_orign,_tirm);
            if(temp.length > 0) {
                $rootScope.companies = temp;
            } else {
                $rootScope.companies = [];
            }
        }
        */
    }
    $rootScope.getSelectTeam = function(cid) {
        try {
            $http({
                method: 'post',
                url: '/search/team',
                data:{
                    cid : cid,
                    gid : $rootScope.groupId,
                    operate:'part'
                }
            }).success(function(data, status) {
                $rootScope.teams_for_company = data;
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
    }

    $rootScope.getTeam = function (_tirm) {
        try {
            $http({
                method: 'post',
                url: '/search/team',
                data:{
                    regx : _tirm,
                    gid : $rootScope.groupId,
                    operate:'all'
                }
            }).success(function(data, status) {
                $rootScope.teams_for_team = data;
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $rootScope.provoke_select = function (team) {
        $rootScope.team_opposite = team;
    };

    //加入小队
    $rootScope.joinGroup = function(){
        try{
            $http({
                method:'post',
                url: '/users/joinGroup',
                data:{
                    tid : $rootScope.teamId
                }
            }).success(function(data,status){
                window.location.reload();
            }).error(function(data,status){
                alert('加入小队失败.');
            });
        }
        catch(e){
            console.log(e);
        }
    };

}]);

tabViewGroup.controller('GroupMessageController', ['$http','$scope','$rootScope',
  function ($http, $scope,$rootScope) {


    var teamId;
    $scope.$watch('teamId',function(tid){
        teamId = tid;
        $rootScope.teamId = tid;
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

}]);


tabViewGroup.controller('CampaignListController', ['$http', '$scope','$rootScope',
  function ($http, $scope, $rootScope) {


    var groupId,teamId;
    $scope.$watch('teamId',function(tid){
        //消除ajax缓存
        teamId = tid;
        $rootScope.teamId = tid;
        $http.get('/group/getCampaigns/'+tid+'?' + Math.round(Math.random()*100)).success(function(data, status) {
            $scope.campaigns = data.data;
            $scope.role = data.role;    //只有改组的组长才可以操作活动(关闭、编辑等)
        });

    });

    $scope.$watch('groupId',function(gid){
        groupId = gid;
        $rootScope.groupId = gid;
    });


    $scope.company = false;


    $scope.getId = function(cid) {
        $scope.campaign_id = cid;
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
                    theme: $scope.theme,
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

tabViewGroup.controller('MemberListController', ['$http','$scope','$rootScope', function($http,$scope) {

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
    };


    //退出小队
    $scope.quitGroup = function(){
        try{
            $http({
                method:'post',
                url: '/users/quitGroup',
                data:{
                    tid : $scope.teamId
                }
            }).success(function(data,status){
                window.location.reload();
            }).error(function(data,status){
                alert('退出失败.');
            });
        }
        catch(e){
            console.log(e);
        }
    };
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
