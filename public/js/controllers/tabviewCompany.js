'use strict';

var tabViewCompany = angular.module('mean.main');

tabViewCompany.directive('match', function($parse) {
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
tabViewCompany.config(['$routeProvider', '$locationProvider',
  function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/company_campaign', {
        templateUrl: '/company/campaigns',
        controller: 'CampaignListController',
        controllerAs: 'campaign'
      })
      .when('/company_member', {
        templateUrl: '/company/member',
        controller: 'CompanyMemberController',
        controllerAs: 'members'
       })
      .when('/company_info', {
        templateUrl: '/company/Info',
        controller: 'AccountFormController',
        controllerAs: 'account'
      })
      .when('/team_info', {
        templateUrl: '/company/teamInfo',
        controller: 'TeamInfoController',
        controllerAs: 'teamInfo'
      })
      .when('/timeLine', {
        templateUrl: '/company/timeLine',
        //controller: 'AccountFormController',
        //controllerAs: 'account'
      })
      .when('/changePassword', {
        templateUrl: '/company/change_password',
        controller: 'PasswordFormController',
        controllerAs: 'password'
      })
      .when('/addGroup',{
        templateUrl: '/company/add_group',
        controller: 'CompanyGroupFormController',
        controllerAs:'groupModel'
      }).
      otherwise({
        redirectTo: '/company_campaign'
      });
  }]);

tabViewCompany.run(['$rootScope', function ($rootScope) {
    $rootScope.nowTab = window.location.hash.substr(2);
    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
    };
}]);
tabViewCompany.controller('CampaignListController', ['$http','$scope','$rootScope',
  function($http,$scope,$rootScope) {
    $rootScope.nowTab = 'company_campaign';

    $scope.campaign_type = "所有活动";

    $http.get('/campaign/getCampaigns/company/all/0?' + Math.round(Math.random()*100)).success(function(data, status) {
      $scope.campaigns = data.campaigns;
      if(data.campaigns.length<20){
        $scope.loadMore_flag = false;
      }
      else{
        $scope.loadMore_flag = true;
      }
    });
    $scope.campaignType='all';

    $scope.block = 1;
    $scope.page = 1;
    $scope.pageTime = [0];
    $scope.lastPage_flag = false;
    $scope.nextPage_flag = false;
    $scope.loadMore = function(){
        $http.get('/campaign/getCampaigns/company/'+$scope.campaignType+'/'+new Date($scope.campaigns[$scope.campaigns.length-1].start_time).getTime()+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
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
        $http.get('/campaign/getCampaigns/company/'+$scope.campaignType+'/'+start_time+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            if(data.result===1 && data.campaigns.length>0){
                if(flag ==1){
                    $scope.page++;
                    $scope.pageTime.push(new Date($scope.campaigns[$scope.campaigns.length-1].start_time).getTime());
                }
                else{
                    $scope.page--;
                }
                $scope.campaigns = data.campaigns;
                $scope.nextPage_flag = false;
                $scope.lastPage_flag = false;
                $scope.loadOver_flag = false;
                $scope.block = 1;
                if(data.campaigns.length<20){
                    $scope.loadMore_flag = false;
                }
                else{
                    $scope.loadMore_flag = true;
                }
                window.scroll(0,0);
            }
            else{
                $scope.nextPage_flag = false;
                $scope.loadMore_flag = false;
                $scope.loadOver_flag = true;
            }
        });
    }
    $scope.selectCampaign = function (value) {
        var _url = "";
        var _selected = true;
        switch(value) {
            case 0:
                $scope.campaignType = 'company';
                _url = "/campaign/getCampaigns/company/company/0";
                $scope.campaign_type = "全公司活动";
                break;
            case 1:
                $scope.campaignType = 'selected';
                _url = "/campaign/getCampaigns/company/selected/0";
                $scope.campaign_type = "已加入小队的活动";
                break;
            case 2:
                $scope.campaignType = 'unselected';
                _url = "/campaign/getCampaigns/company/unselected/0";
                $scope.campaign_type = "未加入小队的活动";
                break;
            case 3:
                $scope.campaignType = 'team';
                _url = "/campaign/getCampaigns/company/team/0";
                $scope.campaign_type = "所有小队的活动";
                break;
            case 4:
                $scope.campaignType = 'all';
                _url = "/campaign/getCampaigns/company/all/0";
                $scope.campaign_type = "所有活动";
                break;
            default:break;
        }
        $scope.loadMore_flag = true;
        $scope.block = 1;
        $scope.page = 1;
        $scope.pageTime = [0];
        $scope.lastPage_flag = false;
        $scope.nextPage_flag = false;
        $scope.loadOver_flag = false;
         try{
            $http({
                method: 'get',
                url: _url,
            }).success(function(data, status) {
                $scope.campaigns = data.campaigns;
            }).error(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e){
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
                url: '/company/campaignEdit',
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
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
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
                    //alert('成功加入该活动!');
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN_CAMPAIGN_SUCCESS);
                    $scope.campaigns[index].join_flag = 1;
                    $scope.campaigns[index].member_num++;
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
                    $scope.campaigns[index].join_flag = -1;
                    $scope.campaigns[index].member_num--;
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

    $scope.cancel = function (_id) {
        try {
            $http({
                method: 'post',
                url: '/campaign/cancel',
                data:{
                    campaign_id : _id
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
}]);
tabViewCompany.controller('CompanyMemberController', ['$http', '$scope','$rootScope',
 function ($http, $scope, $rootScope) {
    $http.get('/search/member?' + Math.round(Math.random()*100)).success(function(data, status) {
      $scope.members = data;
      //按照员工昵称的拼音排序
      $scope.members = $scope.members.sort(function (e,f){return e.nickname.localeCompare(f.nickname);});
      $scope.company = true;
    });

    $scope.userDetail = function(index) {
        $scope.num = index;
    }

    $scope.changeUserInfo = function(_operate) {
        try{
            $http({
                method: 'post',
                url: '/company/changeUser',
                data:{
                    operate : _operate,
                    user : $scope.members[$scope.num]
                }
            }).success(function(data, status) {

            }).error(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e){
            console.log(e);
        }
    }
}]);

tabViewCompany.controller('TeamInfoController',['$scope','$http','$rootScope',function ($scope, $http, $rootScope) {
    //获取公司小组，若是此成员在此小组则标记此team的belong值为true
    $http.get('/group/getCompanyTeamsInfo' +'?'+ (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
        $scope.team_lists = data.teams;//公司的所有team
        $scope.cid = data.cid;
        $scope.role = data.role;
    });
    $scope.search = function () {
        $scope.member_backup = $scope.users;
        var find = false;
        $scope.users = [];
        for(var i = 0; i < $scope.member_backup.length; i ++) {
            if($scope.member_backup[i].nickname.indexOf($scope.member_search) > -1){
                $scope.users.push($scope.member_backup[i]);
                find = true;
            }
        }
        if(!find){
            $scope.users = $scope.member_backup;
            $scope.member_backup = [];
            $rootScope.donlerAlert("未找到组员!");
        }else{
            $rootScope.donlerAlert("找到"+$scope.users.length+"名组员!");
        }
    }
    $scope.recover = function(){
        if($scope.member_backup){
            if($scope.member_backup.length > 0){
                $scope.users = $scope.member_backup;
            }
        }
    }
    //根据groupId返回此companyGroup的用户及team的信息（队名、简介）供HR修改
    $scope.setGroupId = function (tid,gid,index) {
        $scope.team_index = index;
        $scope.tid = tid;
        $scope.gid = gid;
        try{
            $http({
                method: 'post',
                url: '/search/user',
                data:{
                    cid: $scope.cid,
                    gid: $scope.gid,
                    tid: $scope.tid
                }
            }).success(function(data, status) {
                $scope.users = data.users;
                $scope.leaders = data.leaders.length > 0 ? data.leaders : [];

                var leader_find = false;
                for(var i = 0; i < $scope.users.length && !leader_find; i ++) {
                    for(var j = 0; j < $scope.leaders.length; j ++) {
                        //标记
                        if($scope.leaders[j]._id.toString() === $scope.users[i]._id.toString()){
                            $scope.users[i].leader = true;
                            leader_find = true;
                            break;//目前一个小队只有一个组长
                        }
                    }
                }
            }).error(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
            $http({
                method:'post',
                url:'/group/oneTeam',
                data:{
                    tid: $scope.tid
                }
            }).success(function(data, status) {
                $scope.team = data;
            }).error(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e){
            console.log(e);
        }
    };
    $scope.appointReady = function(user,index){
        $scope._user = user;
        $scope.leader=$scope.leaders[0];
        $scope._index = index;
        $scope.users[index].leader = true;

        if($scope.leader != []){
            for(var i = 0; i < $scope.users.length; i ++) {
                if($scope.leader._id.toString() === $scope.users[i]._id.toString()){
                    $scope.users[i].leader = false;
                    break;
                }
            }
        }
        $scope.leaders[0] = {
            '_id':user._id,
            'nickname':user.nickname,
            'photo':user.photo
        }
    }
    $scope.dismissLeader = function (leader) {
        try{
            $http({
                method: 'post',
                url: '/company/appointLeader',
                data:{
                    cid: $scope.cid,
                    gid: $scope.gid,
                    tid: $scope.tid,
                    uid: leader._id,
                    operate:false
                }
            }).success(function(data, status) {

            }).error(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e){
            console.log(e);
        }
    }
    //指定队长
    $scope.appointLeader = function () {
      try{
            $http({
                method: 'post',
                url: '/company/appointLeader',
                data:{
                    cid: $scope.cid,
                    gid: $scope.gid,
                    tid: $scope.tid,
                    uid: $scope._user._id,
                    operate:true
                }
            }).success(function(data, status) {

                if($scope.leader!='null'){
                    var _leader = $scope.team_lists[$scope.team_index].leader;
                    for(var i = 0; i < _leader.length; i++){
                        if(_leader[i]._id == $scope.leader._id) {
                            $scope.team_lists[$scope.team_index].leader.splice(i,1);
                        }
                    }
                    for(var i = 0; i < $scope.leaders.length; i ++) {
                        if($scope.leaders[i]._id == $scope.leader._id) {
                            $scope.leaders.splice(i,1);
                        }
                    }
                }
                $scope.team_lists[$scope.team_index].leader.push({
                    '_id':$scope._user._id,
                    'nickname':$scope._user.nickname,
                    'photo':$scope._user.photo
                });

                $scope.leaders.push({
                    '_id':$scope._user._id,
                    'nickname':$scope._user.nickname,
                    'photo':$scope._user.photo
                });

                if($scope.leader!='null'){
                    $scope.dismissLeader($scope.leader);
                }
            }).error(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e){
            console.log(e);
        }
    };

    $scope.saveGroupInfo = function(){
        try{
            $http({
                method:'post',
                url: '/company/saveGroupInfo',
                data:{
                    'tid': $scope.tid,
                    'tname': $scope.team_lists[$scope.team_index].name
                }
            }).success(function(data, status) {
                    //TODO:更改对话框
                    if(data.result === 1) {
                        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.MSG_UPDATE_SUCCESS);
                    }
                    else
                        $rootScope.donlerAlert(data.msg);
            }).error(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e){
            console.log(e);
        }
    };

    //激活、关闭小组
    $scope.activateGroup = function(active, tid, index){
        try{
            $http({
                method:'post',
                url: '/group/activateGroup',
                data:{
                    'tid':tid,
                    'active':active
                }
            }).success(function(data,status){
                if( active===true ){
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.TEAM +
                                                $rootScope.lang_for_msg[$rootScope.lang_key].value.ACTIVE +
                                                    $rootScope.lang_for_msg[$rootScope.lang_key].value.SUCCESS);
                    $scope.team_lists[index].active = active;
                }
                else{
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.TEAM +
                                                $rootScope.lang_for_msg[$rootScope.lang_key].value.CLOSE +
                                                    $rootScope.lang_for_msg[$rootScope.lang_key].value.SUCCESS);
                    $scope.team_lists[index].active = active;
                }
            }).error(function(data, status){
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e){
            console.log(e);
        }
    };
    //加入小队
    $scope.joinGroup = function(tid){
        try{
            $http({
                method:'post',
                url:'/users/joinGroup',
                data:{
                    'tid':tid
                }
            }).success(function(data,status){
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN +
                                                $rootScope.lang_for_msg[$rootScope.lang_key].value.TEAM +
                                                    $rootScope.lang_for_msg[$rootScope.lang_key].value.SUCCESS);
                window.location.reload();
            }).error(function(data,status){
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN +
                                                $rootScope.lang_for_msg[$rootScope.lang_key].value.TEAM +
                                                    $rootScope.lang_for_msg[$rootScope.lang_key].value.FAILURE);
            });
        }
        catch(e){
            console.log(e);
        }
    };
    //退出小队
    $scope.quitGroup = function(tid){
        try{
            $http({
                method:'post',
                url: '/users/quitGroup',
                data:{
                    tid : tid
                }
            }).success(function(data,status){
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT +
                                                $rootScope.lang_for_msg[$rootScope.lang_key].value.TEAM +
                                                    $rootScope.lang_for_msg[$rootScope.lang_key].value.SUCCESS);
                window.location.reload();
            }).error(function(data,status){
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT +
                                                $rootScope.lang_for_msg[$rootScope.lang_key].value.TEAM +
                                                    $rootScope.lang_for_msg[$rootScope.lang_key].value.FAILURE);
            });
        }
        catch(e){
            console.log(e);
        }
    };
}]);
tabViewCompany.controller('AccountFormController',['$scope','$http','$rootScope',function ($scope, $http, $rootScope) {

    $http.get('/company/getAccount?' + Math.round(Math.random()*100)).success(function(data,status){
        $scope.company = data.company;
        $scope.info = data.info;
        $scope.linkage_init_location = {
            province: data.info.city.province,
            city: data.info.city.city,
            district: data.info.city.district
        };

        var seletor = new LinkageSelector(document.getElementById('location'), function(selectValues) {
            $scope.info.city.province = selectValues[0];
            $scope.info.city.city = selectValues[1];
            $scope.info.city.district = selectValues[2];
            $scope.$digest();
        });
    }).error(function(data,status) {
        //TODO:更改对话框
        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.COMPANY + $rootScope.lang_for_msg[$rootScope.lang_key].value.ACCOUNT_FAILURE);
    });
    $scope.infoUnEdit = true;
    $scope.infoButtonStatus = '编辑';
    $scope.inviteUrlStatus= false;
    $scope.select_user = false;
    $scope.select_leader = false;

    var refreshCompanyInfo = function() {
        $http
        .get('/company/getAccount?' + Math.round(Math.random()*100))
        .success(function(data, status) {
            $scope.company = data.company;
        })
        .error(function(data, status) {
            //TODO:更改对话框
            $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.COMPANY + $rootScope.lang_for_msg[$rootScope.lang_key].value.ACCOUNT_FAILURE);
        });
    };


    $scope.preProvoke = function(team) {
        $scope.team_opposite = team;
        $('#sponsorProvokeModel').modal();
    }
    //约战
    $scope.provoke = function() {
        try {
            $http({
                method: 'post',
                url: '/group/provoke/'+$scope.provoke_tid,
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
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $scope.select = function(value) {
        $scope.select_user = value;
        $scope.select_leader = !value;
    }
    $scope.inviteUrlToggle = function(){
        $scope.inviteUrlStatus= !$scope.inviteUrlStatus;
    };
    $scope.infoEditToggle = function() {
        $scope.infoUnEdit = !$scope.infoUnEdit;
        if($scope.infoUnEdit) {
            try{
                $http({
                    method : 'post',
                    url : '/company/saveAccount',
                    data : {
                        info : $scope.info
                    }
                }).success(function(data, status) {
                    //TODO:更改对话框
                    if(data.result === 1)
                        $rootScope.donlerAlert(data.msg);
                    else
                        $rootScope.donlerAlert(data.msg);
                    window.location.reload();
                }).error(function(data, status) {
                    //TODO:更改对话框
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                });
            }
            catch(e) {
                console.log(e);
            }
            $scope.infoButtonStatus = '编辑';
        }
        else {
            $scope.infoButtonStatus = '保存';
        }
    };

    (function getDepartments() {
        $http
        .get('/department/pull')
        .success(function(data, status) {
            $scope.node = {
                _id: data._id,
                name: data.name,
                children: data.department
            };
            if ($scope.node.children.length === 0) {
                $scope.node.children = null;
            }
        });
    })();

    $('.tree').delegate('li.parent_li > span', 'click', function(e) {
        var children = $(this).parent('li.parent_li').find(' > ul > li');
        if (children.is(":visible")) {
            children.hide('fast');
            $(this).attr('title', 'Expand this branch').find(' > i').addClass('glyphicon-plus').removeClass('glyphicon-minus');
        } else {
            children.show('fast');
            $(this).attr('title', 'Collapse this branch').find(' > i').addClass('glyphicon-minus').removeClass('glyphicon-plus');
        }
        e.stopPropagation();
    });


    $scope.hasChild = function(node) {
        if (node && node.children) {
            return 'parent_li';
        } else {
            return '';
        }
    };

    $scope.addNode = function(node) {
        $http
        .post('/department/push', {
            did: node._id,
            name: 'test department'
        })
        .success(function(data, status) {
            $scope.node = {
                _id: data._id,
                name: data.name,
                children: data.department
            };
            if ($scope.node.children.length === 0) {
                $scope.node.children = null;
            }
        });
    };

    $scope.deleteNode = function(node) {
        $http
        .post('/department/delete', {
            did: node._id
        })
        .success(function(data, status) {
            // 不应该这样
            if (data.msg === 'DEPARTMENT_DELETE_SUCCESS') {
                getDepartments();
            }
        });
    };

}]);

tabViewCompany.controller('PasswordFormController', ['$http','$scope','$rootScope', function ($http,$scope, $rootScope) {
    $scope.nowpassword = '';
    $scope.newpassword = '';
    $scope.confirmpassword = '';
    $scope.change_password = function(){
        $http({
            method : 'post',
            url : '/company/changePassword',
            data : {
                'nowpassword' : $scope.nowpassword,
                'newpassword' : $scope.newpassword
            }
        }).success(function(data, status) {
            console.log(data);
            //TODO:更改对话框
            if(data.result === 1){
                $rootScope.donlerAlert(data.msg);
                window.location.href = '#/company_info';
            }
            else
                $rootScope.donlerAlert(data.msg);
        }).error(function(data, status) {
            //TODO:更改对话框
            $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
        });
    };
}]);
// HR增加小组 controller
tabViewCompany.controller('CompanyGroupFormController',['$http','$scope','$rootScope', function($http, $scope, $rootScope){
    var _this = this;
    _this.selected = "";
    _this.tname = "";
    $http.get('/group/getgroups').success(function(data,status){
        _this.groups = data;
    }).error(function(data,status) {
        //TODO:更改对话框
        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.TYPE +
                                                $rootScope.lang_for_msg[$rootScope.lang_key].value.FETCH +
                                                    $rootScope.lang_for_msg[$rootScope.lang_key].value.FAILURE);
    });
    _this.selected_group ={};
    this.save = function() {
        angular.forEach(_this.groups, function(value, key) {
            if(value.type === _this.selected) {
                _this.selected_group = {
                    '_id': value._id,
                    'group_type': value.type,
                    'entity_type': value.entity_type
                };
                console.log(_this.selected_group);
            }
        });
        try{
            $http({
                method : 'post',
                url : '/company/saveGroup',
                data : {
                    'selected_group' : _this.selected_group,
                    'tname': _this.tname
                }
            }).success(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.ADD +
                                                $rootScope.lang_for_msg[$rootScope.lang_key].value.TEAM +
                                                    $rootScope.lang_for_msg[$rootScope.lang_key].value.SUCCESS);
                window.location.href='#/company_info';

            }).error(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.ADD +
                                                $rootScope.lang_for_msg[$rootScope.lang_key].value.TEAM +
                                                    $rootScope.lang_for_msg[$rootScope.lang_key].value.FAILURE);
            });
        }
        catch(e) {
            console.log(e);
        }
    };
    //自动显示默认队名
    this.select = function(){
        try{
            $http.get('/company/getAccount').success(function(data,status){
                _this.tname = data.info.official_name + '-' + _this.selected + '队';
            }).error(function(data,status){
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.COMPANY +
                                                $rootScope.lang_for_msg[$rootScope.lang_key].value.INFO +
                                                    $rootScope.lang_for_msg[$rootScope.lang_key].value.FETCH +
                                                         $rootScope.lang_for_msg[$rootScope.lang_key].value.FAILURE);
            });
        }
        catch(e){
            console.log(e);
        }
    };
}]);
// HR 发布公司活动 controller
tabViewCompany.controller('SponsorController',['$http','$scope','$rootScope', function($http, $scope, $rootScope){
    $("#start_time").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.start_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#end_time').datetimepicker('setStartDate', dateUTC);
    });
    $("#end_time").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.end_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#start_time').datetimepicker('setEndDate', dateUTC);
        $('#deadline').datetimepicker('setEndDate', dateUTC);
    });
    $("#deadline").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
    });
    $scope.showMapFlag=false;
    $scope.location={name:'',coordinates:[]};
    $scope.initialize = function(){
        $scope.locationmap = new BMap.Map("mapDetail");            // 创建Map实例
        $scope.locationmap.centerAndZoom('上海',15);
        $scope.locationmap.enableScrollWheelZoom(true);
        $scope.locationmap.addControl(new BMap.NavigationControl({type: BMAP_NAVIGATION_CONTROL_SMALL}));
        var getCity =function (result){
            var cityName = result.name;
            $scope.locationmap.centerAndZoom(cityName,15);
            var options = {
                onSearchComplete: function(results){
                    // 判断状态是否正确
                    if ($scope.local.getStatus() == BMAP_STATUS_SUCCESS){
                        $scope.locationmap.clearOverlays();
                        var nowPoint = new BMap.Point(results.getPoi(0).point.lng,results.getPoi(0).point.lat);
                        //var myIcon = new BMap.Icon("/img/icons/favicon.ico", new BMap.Size(30,30));
                        var marker = new BMap.Marker(nowPoint);  // 创建标注
                        $scope.locationmap.addOverlay(marker);              // 将标注添加到地图中
                        marker.enableDragging();    //可拖拽
                        $scope.locationmap.centerAndZoom(nowPoint,15);
                        $scope.location.coordinates=[results.getPoi(0).point.lng,results.getPoi(0).point.lat];
                        marker.addEventListener("dragend", function changePoint(){
                            var p = marker.getPosition();
                            $scope.location.coordinates=[p.lng , p.lat];
                        });
                    }
                }
            };
            $scope.local = new BMap.LocalSearch($scope.locationmap,options);
            $scope.local.search($scope.location.name );
        }
        var myCity = new BMap.LocalCity();
        myCity.get(getCity);
        $scope.showMapFlag = true;
    };
    
    $scope.showMap = function(){
        if($scope.location.name==''){
            $rootScope.donlerAlert('请输入地点');
            return false;
        }
        if($scope.showMapFlag ==false){
            window.initialize = $scope.initialize;
            var script = document.createElement("script");  
            script.src = "http://api.map.baidu.com/api?v=2.0&ak=krPnXlL3wNORRa1KYN1RAx3c&callback=initialize";
            document.body.appendChild(script);
        }
        else{
            $scope.local.search($scope.location.name );
        }
    };
    $scope.sponsor = function() {
        try{
            $http({
                method: 'post',
                url: '/company/campaignSponsor',
                data:{
                    theme: $scope.theme,
                    location: $scope.location,
                    content : $scope.content,
                    start_time : $scope.start_time,
                    end_time : $scope.end_time,
                    deadline : $scope.deadline,
                    member_min : $scope.member_min,
                    member_max : $scope.member_max

                }
            }).success(function(data, status) {
                //发布活动后跳转到显示活动列表页面
                window.location.reload();

            }).error(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e){
            console.log(e);
        }
    };
}]);