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
    //console.log($rootScope.nowTab);
    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
    };
}]);
tabViewCompany.controller('CampaignListController', ['$http','$scope','$rootScope',
  function($http,$scope,$rootScope) {
    $scope.select = true;
    $rootScope.nowTab = 'company_campaign';
    $http.get('/campaign/all?' + Math.round(Math.random()*100)).success(function(data, status) {
      $scope.campaigns = data.data;
      $scope.role = data.role;
    });


    $scope.selectCampaign = function (value) {
        var _url = "";
        var _selected = true;
        switch(value) {
            case 0:
                _url = "/campaign/company/getCampaigns";
                break;
            case 1:
                _url = "/campaign/user/getCampaigns";
                _selected = true;
                break;
            case 2:
                _url = "/campaign/user/getCampaigns";
                _selected = false;
                break;
            default:break;
        }
         try{
            $http({
                method: 'post',
                url: _url,
                data:{
                    team_selected : _selected
                }
            }).success(function(data, status) {
                $scope.campaigns = data.data;
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
                    $scope.campaigns[index].join = true;
                    $scope.campaigns[index].member_length++;
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
                    $scope.campaigns[index].join = false;
                    $scope.campaigns[index].member_length--;
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
      //按照员工真实姓名的拼音排序
      $scope.members = $scope.members.sort(function (e,f){return e.realname.localeCompare(f.realname);});
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


         //获取公司小组，若是此成员在此小组则标记此team的belong值为true
        $http.get('/group/getCompanyGroups' +'?'+ (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            $scope.team_lists = data.teams;//公司的所有team
            $scope.cid = data.cid;
            $scope.tname= data.name;
            $scope.role = data.role;
            $scope.group = data.group;//用户的group
            $scope.provoke_gid = data.provoke_gid;  //挑战时的小组类型
            $scope.provoke_tid = data.provoke_tid;
            for(var i = 0; i < $scope.team_lists.length; i ++) {
                $scope.team_lists[i].provoke = ($scope.team_lists[i].gid == $scope.provoke_gid && $scope.team_lists[i]._id != $scope.provoke_tid);//是否可以对此组发起挑战
                if($scope.role === 'EMPLOYEE'){
                    $scope.team_lists[i].belong = false;
                    for(var j=0; j< $scope.group.length; j++){
                        //如果已找到则跳出此循环标记下一个team
                        if($scope.team_lists[i].belong === true)
                            break;
                        //如果此team的gid与此group的_id不同 则找下一个group
                        if($scope.team_lists[i].gid !== $scope.group[j]._id)
                            continue;
                        else{
                            for (var k = 0; k < $scope.group[j].team.length; k++) {
                                if($scope.team_lists[i]._id === $scope.group[j].team[k].id.toString()){
                                    $scope.team_lists[i].belong = true;
                                    break;
                                }
                            };
                        }
                    }
                }
            }
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
    // $scope.groupInfoUnEdit = true;
    // $scope.groupInfoButtonStatus = '编辑队名'


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
                $scope.leaders = data.leaders.length > 0 ? data.leaders : ['null'];
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


    $scope.tip = function() {
        alert($scope.team_lists[$scope.team_index].member.length);
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
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.SUCCESS);
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
    $scope.appointLeader = function (user,leader) {
      try{
            $http({
                method: 'post',
                url: '/company/appointLeader',
                data:{
                    cid: $scope.cid,
                    gid: $scope.gid,
                    tid: $scope.tid,
                    uid: user._id,
                    operate:true
                }
            }).success(function(data, status) {

                var _member = $scope.team_lists[$scope.team_index].member;
                for(var i = 0; i < _member.length; i++){
                    if(_member[i]._id == user._id) {
                        $scope.team_lists[$scope.team_index].member.splice(i,1);
                    }
                }

                if(leader!='null'){
                    var _leader = $scope.team_lists[$scope.team_index].leader;
                    for(var i = 0; i < _leader.length; i++){
                        if(_leader[i]._id == leader._id) {
                            $scope.team_lists[$scope.team_index].leader.splice(i,1);
                        }
                    }
                    $scope.team_lists[$scope.team_index].member.push({
                        '_id':leader._id,
                        'nickname':leader.nickname,
                        'photo':leader.photo
                    });
                }
                $scope.team_lists[$scope.team_index].leader.push({
                    '_id':user._id,
                    'nickname':user.nickname,
                    'photo':user.photo
                });



                if(leader!='null'){
                    for(var i = 0; i < $scope.leaders.length; i ++) {
                        if($scope.leaders[i]._id == leader._id) {
                            $scope.leaders.splice(i,1);
                        }
                    }
                    $scope.users.push({
                        '_id':leader._id,
                        'nickname':leader.nickname,
                        'photo':leader.photo
                    });
                }
                for(var i = 0; i < $scope.users.length; i ++) {
                    if($scope.users[i]._id == user._id) {
                        $scope.users.splice(i,1);
                    }
                }
                $scope.leaders.push({
                    '_id':user._id,
                    'nickname':user.nickname,
                    'photo':user.photo
                });
                if(leader!='null'){
                    $scope.dismissLeader(leader);
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
    $scope.activateGroup = function(active,tid){
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
                    window.location.reload();
                }
                else{
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.TEAM +
                                                $rootScope.lang_for_msg[$rootScope.lang_key].value.CLOSE +
                                                    $rootScope.lang_for_msg[$rootScope.lang_key].value.SUCCESS);
                    window.location.reload();
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
// HR增加小组 controller
tabViewCompany.controller('SponsorController',['$http','$scope','$rootScope', function($http, $scope, $rootScope){
    $("#start_time").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.start_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#end_time').datetimepicker('setStartDate', dateUTC);
        $('#deadline').datetimepicker('setEndDate', dateUTC);
    });
    $("#end_time").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.end_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#start_time').datetimepicker('setEndDate', dateUTC);
    });
    $scope.showMapFlag=false;
    $scope.location={name:'',coordinates:[]};
    var locationmap = new BMap.Map("mapDetail");            // 创建Map实例
    locationmap.centerAndZoom('上海',15);
    locationmap.enableScrollWheelZoom(true);
    locationmap.addControl(new BMap.NavigationControl({type: BMAP_NAVIGATION_CONTROL_SMALL}));
    var options = {
        onSearchComplete: function(results){
            // 判断状态是否正确
            if (local.getStatus() == BMAP_STATUS_SUCCESS){
                locationmap.clearOverlays();
                var nowPoint = new BMap.Point(results.getPoi(0).point.lng,results.getPoi(0).point.lat);
                //var myIcon = new BMap.Icon("/img/icons/favicon.ico", new BMap.Size(30,30));
                var marker = new BMap.Marker(nowPoint);  // 创建标注
                locationmap.addOverlay(marker);              // 将标注添加到地图中
                marker.enableDragging();    //可拖拽
                locationmap.centerAndZoom(nowPoint,15);
                $scope.location.coordinates=[results.getPoi(0).point.lng,results.getPoi(0).point.lat];
                marker.addEventListener("dragend", function changePoint(){
                    var p = marker.getPosition();
                    $scope.location.coordinates=[p.lng , p.lat];
                });
            }
        }
    };
    var local = new BMap.LocalSearch(locationmap,options);
    var getCity =function (result){
        var cityName = result.name;
        locationmap.centerAndZoom(cityName,15);
    }
    var myCity = new BMap.LocalCity();
    myCity.get(getCity);
    $scope.showMap = function(){
        if($scope.location.name==''){
            $rootScope.donlerAlert('请输入地点');
            return false;
        }
        local.search($scope.location.name );
        $scope.showMapFlag = true;
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
