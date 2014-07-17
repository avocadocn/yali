'use strict';

var tabViewCompany = angular.module('donler');




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
}).directive('masonry', function ($parse, $timeout) {
    return {
        link: function (scope, elem, attrs) {   
            $timeout(function() {
                $(".masonry").masonry({
                    itemSelector : ".masonry-item"
                });
                // console.log($(".masonry-item"));
            }, 0);

        }
    };        
}).directive('masonryItem', function ($parse, $timeout) {
    return {
        restrict: 'AC',
        link: function (scope, elem, attrs) {

            $timeout(function(){
                elem.parents('.masonry').masonry('bindResize');
            }, 2000); 

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
      .when('/company_member/:cid', {
        templateUrl: function(params){ 
            return '/company/member/'+params.cid;
        },
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
      .when('/timeLine/:cid', {
        templateUrl: function(params){
            return '/company/timeline/'+params.cid;
        }
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

    $rootScope.$on("$routeChangeStart",function(){
        $rootScope.loading = true;
    });
    $rootScope.$on("$routeChangeSuccess",function(){
        $rootScope.loading = false;
    });
}]);
tabViewCompany.controller('CampaignListController', ['$http','$scope','$rootScope',
  function($http,$scope,$rootScope) {
    $rootScope.nowTab = 'company_campaign';

    $scope.campaign_type = "所有活动";
    $rootScope.$watch('cid',function(cid){
        $http.get('/campaign/getCampaigns/company/'+cid+'/all/0?' + Math.round(Math.random()*100)).success(function(data, status) {
          $scope.campaigns = data.campaigns;
          $scope.role = data.role;
          if(data.campaigns.length<20){
            $scope.loadMore_flag = false;
          }
          else{
            $scope.loadMore_flag = true;
          }
        });
    })

    $scope.campaignType='all';

    $scope.block = 1;
    $scope.page = 1;
    $scope.pageTime = [0];
    $scope.lastPage_flag = false;
    $scope.nextPage_flag = false;
    $scope.loadMore = function(){
        $http.get('/campaign/getCampaigns/company/'+$scope.campaignType+'/'+$rootScope.cid+'/'+new Date($scope.campaigns[$scope.campaigns.length-1].start_time).getTime()+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
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
        $http.get('/campaign/getCampaigns/company/'+$scope.campaignType+'/'+$rootScope.cid+'/'+start_time+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
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
                _url = "/campaign/getCampaigns/company/"+$rootScope.cid+"/company/0";
                $scope.campaign_type = "全公司活动";
                break;
            case 1:
                $scope.campaignType = 'selected';
                _url = "/campaign/getCampaigns/company/"+$rootScope.cid+"/selected/0";
                $scope.campaign_type = "已加入小队的活动";
                break;
            case 2:
                $scope.campaignType = 'unselected';
                _url = "/campaign/getCampaigns/company/"+$rootScope.cid+"/unselected/0";
                $scope.campaign_type = "未加入小队的活动";
                break;
            case 3:
                $scope.campaignType = 'team';
                _url = "/campaign/getCampaigns/company/"+$rootScope.cid+"/team/0";
                $scope.campaign_type = "所有小队的活动";
                break;
            case 4:
                $scope.campaignType = 'all';
                _url = "/campaign/getCampaigns/company/"+$rootScope.cid+"/all/0";
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
                alertify.alert('DATA ERROR');
            });
        }
        catch(e){
            console.log(e);
        }
    };
    $scope.getId = function(cid) {
        $scope.campaign_id = cid;
    };
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
    //                 //alert('成功加入该活动!');
    //                 $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN_CAMPAIGN_SUCCESS);
    //                 $scope.campaigns[index].join_flag = 1;
    //                 $scope.campaigns[index].member_num++;
    //             }
    //             else{
    //                 $rootScope.donlerAlert(data.msg);
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
    //              if(data.result===1){
    //                 $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT_CAMPAIGN_SUCCESS);
    //                 //alert('您已退出该活动!');
    //                 $scope.campaigns[index].join_flag = -1;
    //                 $scope.campaigns[index].member_num--;
    //             }
    //             else{
    //                 $rootScope.donlerAlert(data.msg);
    //             }
    //         }).error(function(data, status) {
    //             $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
    //         });
    //     }
    //     catch(e) {
    //         console.log(e);
    //     }
    // };

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
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);
tabViewCompany.controller('CompanyMemberController', ['$http', '$scope','$rootScope',
 function ($http, $scope, $rootScope) {
    $http.get('/search/'+$rootScope.cid+'/member?' + Math.round(Math.random()*100)).success(function(data, status) {
      $scope.members = data;
      //按照员工昵称的拼音排序
      $scope.members = $scope.members.sort(function (e,f){return e.nickname.localeCompare(f.nickname);});
      $scope.company = true;
    });

    $scope.userDetail = function(index) {
        $scope.num = index;
    }

    $scope.unEdit = true;
    $scope.buttonStatus = '编辑';
    $scope.changeUserInfo = function() {
        $scope.unEdit = !$scope.unEdit;
        if(!$scope.unEdit){
            $scope.buttonStatus = '保存';
        }
        else{
            try{
                $http({
                    method: 'post',
                    url: '/company/changeUser/'+$rootScope.cid,
                    data:{
                        operate : 'change',
                        user : $scope.members[$scope.num]
                    }
                }).success(function(data, status) {
                    $scope.buttonStatus = '编辑';
                    alertify.alert('保存成功');
                }).error(function(data, status) {
                    //TODO:更改对话框
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                });
            }
            catch(e){
                console.log(e);
            }
        }
    }
}]);











tabViewCompany.directive('masonry', function ($timeout) {
    return {
        restrict: 'AC',
        link: function (scope, elem, attrs) {
            scope.$watch(function () {
                return elem[0].children.length
            },

            function (newVal) {
                $timeout(function () {
                    elem.masonry('reloadItems');
                    elem.masonry();
                })
            })

            elem.masonry({
                itemSelector: '.masonry-item'
            });
            scope.masonry = elem.data('masonry');
        }
    };

}).controller('TeamInfoController',['$scope','$http','$rootScope',function ($scope, $http, $rootScope) {
    //获取公司小组，若是此成员在此小组则标记此team的belong值为true
    $rootScope.$watch('cid',function(cid){
        $http.get('/company/getCompanyTeamsInfo/'+cid+'?'+ (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            $scope.team_lists = data.teams;//公司的所有team
            $scope.cid = data.cid;
            $scope.role = data.role;
        });
    })

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
            alertify.alert("未找到组员!");
        }else{
            alertify.alert("找到"+$scope.users.length+"名组员!");
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
                alertify.alert('DATA ERROR');
            });
            $http({
                method:'post',
                url:'/group/oneTeam/'+tid,
                data:{
                    tid: $scope.tid
                }
            }).success(function(data, status) {
                $scope.team = data;
            }).error(function(data, status) {
                //TODO:更改对话框
                alertify.alert('DATA ERROR');
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

        if($scope.leader != undefined){
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
                url: '/company/appointLeader/'+$scope.cid,
                data:{
                    tid: $scope.tid,
                    uid: leader._id,
                    operate:false
                }
            }).success(function(data, status) {

            }).error(function(data, status) {
                //TODO:更改对话框
                alertify.alert('DATA ERROR');
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
                url: '/company/appointLeader/'+$scope.cid,
                data:{
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
                alertify.alert('DATA ERROR');
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

            }).error(function(data, status) {
                //TODO:更改对话框
                alertify.alert('DATA ERROR');
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
                url: '/group/activateGroup/'+tid,
                data:{
                    'tid':tid,
                    'active':active
                }
            }).success(function(data,status){
                if( active===true ){
                   alertify.alert('成功打开小组!');
                }
                else{
                    alertify.alert('成功关闭小组!');
                }
            }).error(function(data, status){
                alertify.alert('DATA ERROR');
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
                alertify.alert('成功加入小队!');
                window.location.reload();
            }).error(function(data,status){
                alertify.alert('DATA ERROR');
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
                alertify.alert('成功退出小队!');
                window.location.reload();
            }).error(function(data,status){
               alertify.alert('DATA ERROR');
            });
        }
        catch(e){
            console.log(e);
        }
    };


}]);
tabViewCompany.controller('AccountFormController',['$scope','$http','$rootScope',function ($scope, $http, $rootScope) {

    $http.get('/company/getAccount/'+$rootScope.cid+'?' + Math.round(Math.random()*100)).success(function(data,status){
        $scope.company = data.company;
        $scope.info = data.info;
        $scope.role = data.role;
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
        alertify.alert('DATA ERROR');
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
            alertify.alert('DATA ERROR');
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
                alertify.alert('DATA ERROR');
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
                    url : '/company/saveAccount/'+$rootScope.cid,
                    data : {
                        info : $scope.info
                    }
                }).success(function(data, status) {
                    //TODO:更改对话框
                    if(data.result === 1)
                        alertify.alert(data.msg);
                    else
                        alertify.alert(data.msg);
                }).error(function(data, status) {
                    //TODO:更改对话框
                    alertify.aler('保存错误!');
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

    (function getDepartments() {
        $http
        .get('/departmentTree/' + $rootScope.cid)
        .success(function(data, status) {
            formatData(data);
        });
    })();

    $scope.toggleTree = function(node) {
        if (!node.toggle || node.toggle === 'glyphicon-minus') {
            node.toggle = 'glyphicon-plus';
            node.hideChild = true;
        } else {
            node.toggle = 'glyphicon-minus';
            node.hideChild = false;
        }
    };

    $scope.getNode = function(node){
        $scope.did = node._id;
        $http({
            method : 'post',
            url : '/department/detail/'+node._id,
            data : {
                'did' : node._id
            }
        }).success(function(data, status) {
            $scope.getCompanyUser(data.department.team._id,function(){$('#managerAppointModel').modal();});
        }).error(function(data, status) {
            //TODO:更改对话框
            alertify.alert(data);
        });
    };


    $scope.hasChild = function(node) {
        if (node && node.department) {
            return 'parent_li';
        } else {
            return '';
        }
    };

    $scope.confirmCreate = function(node) {
        if (node.edit_name !== '' && node.edit_name != null) {
            $http
            .post('/department', {
                did: node.parent_id,
                name: node.edit_name,
                cid: $scope.node._id
            })
            .success(function(data, status) {
                formatData(data);
            });
        }
    };

    $scope.cancelCreate = function(node) {
        for (var i = 0; i < node.parent.department.length; i++) {
            if (node.parent.department[i].is_creating) {
                node.parent.department.splice(i, 1);
            }
        }
    };

    $scope.confirmEdit = function(node) {
        if (node.temp_name !== '' && node.temp_name != null) {
            $http
            .put('/department/' + node._id, {
                did: node._id,
                name: node.temp_name
            })
            .success(function(data, status) {
                formatData(data);
            });
        }
    };

    $scope.cancelEdit = function(node) {
        node.is_editing = false;
    };

    $scope.addNode = function(node) {
        node.toggle = 'glyphicon-minus';
        node.hideChild = false;
        if (!node.department) {
            node.department = [];
        }
        node.department.push({
            edit_name: '',
            parent_id: node._id,
            parent: node,
            is_creating: true
        });
    };

    $scope.editNode = function(node) {
        node.temp_name = node.name;
        node.is_editing = true;
    };

    $scope.deleteNode = function(node) {
        alertify.set({
            buttonFocus: "none",
            labels: {
                ok: '确认删除',
                cancel: '取消'
            }
        });
        alertify.confirm('删除后不可恢复，您确定要删除“' + node.name + '”部门吗？', function(e) {
            if (e) {
                $http
                .delete('/department/' + node._id)
                .success(function(data, status) {
                    if (data.msg === 'DEPARTMENT_DELETE_SUCCESS') {
                        formatData(data);
                    }
                });
            }
        });
    };

    //获取该公司所有员工
    $scope.getCompanyUser = function(tid,callback){
         $http({
              method: 'post',
              url: '/search/user',
              data:{
                  tid:tid
              }
          }).success(function(data, status) {
                $scope.managers = data.leaders;
                $scope.department_users = data.users;
                $scope.manager = 'null';
              var manager_find = false;
                for(var i = 0; i < $scope.department_users.length && !manager_find; i ++) {
                    for(var j = 0; j < $scope.managers.length; j ++) {
                        //标记
                        if($scope.managers[j]._id.toString() === $scope.department_users[i]._id.toString()){
                            $scope.department_users[i].leader = true;
                            manager_find = true;
                            break;//目前一个小队只有一个组长
                        }
                    }
                }
              callback();
        }).error(function(data, status) {
              //TODO:更改对话框
            alertify.alert(data);
        });
    }
    //从员工中进一步搜索
    $scope.search = function () {
        $scope.member_backup_department = $scope.department_users;
        var find = false;
        $scope.department_users = [];
        for(var i = 0; i < $scope.member_backup_department.length; i ++) {
            if($scope.member_backup_department[i].nickname.indexOf($scope.member_search_department) > -1){
                $scope.department_users.push($scope.member_backup_department[i]);
                find = true;
            }
        }
        if(!find){
            $scope.department_users = $scope.member_backup_department;
            $scope.member_backup_department = [];
            alertify.alert("未找到该员工!");
        }else{
            alertify.alert("找到"+$scope.department_users.length+"名员工!");
        }
    }




    $scope.recover = function(){
        if($scope.member_backup_department){
            if($scope.member_backup_department.length > 0){
                $scope.department_users = $scope.member_backup_department;
            }
        }
    }
    $scope.appointReady = function(user,index){
        $scope.department_user = user;
        $scope.manager=$scope.managers[0];
        $scope.department_index = index;
        $scope.department_users[index].leader = true;

        if($scope.manager){
            for(var i = 0; i < $scope.department_users.length; i ++) {
                if($scope.manager._id.toString() === $scope.department_users[i]._id.toString()){
                    $scope.department_users[i].leader = false;
                    break;
                }
            }
        }
        $scope.managers[0] = {
            '_id':user._id,
            'nickname':user.nickname,
            'photo':user.photo
        }
    }
    $scope.dismissManager = function (manager) {
        try{
            $http({
                method: 'post',
                url: '/department/managerOperate/'+$scope.did,
                data:{
                    member:{
                        '_id':manager._id,
                    },
                    did:$scope.did,
                    operate:'dismiss'
                }
            }).success(function(data, status) {

            }).error(function(data, status) {
                //TODO:更改对话框
                alertify.alert(data);
            });
        }
        catch(e){
            console.log(e);
        }
    }
    //指定管理员
    $scope.appointManager = function () {
      try{
            $http({
                method: 'post',
                url: '/department/managerOperate/'+$scope.did,
                data:{
                    member:{
                        '_id':$scope.department_user._id,
                        'nickname':$scope.department_user.nickname,
                        'photo':$scope.department_user.photo
                    },
                    did:$scope.did,
                    operate:'appoint'
                }
            }).success(function(data, status) {
                console.log($scope.manager);
                if($scope.manager!='null' && $scope.manager != undefined){
                    for(var i = 0; i < $scope.managers.length; i ++) {
                        if($scope.managers[i]._id == $scope.manager._id) {
                            $scope.managers.splice(i,1);
                        }
                    }
                }

                $scope.managers.push({
                    '_id':$scope.department_user._id,
                    'nickname':$scope.department_user.nickname,
                    'photo':$scope.department_user.photo
                });

                if($scope.manager!='null' && $scope.manager != undefined){
                    $scope.dismissManager($scope.manager);
                }
            }).error(function(data, status) {
                //TODO:更改对话框
                alertify.alert('DATA ERROR');
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
                window.location.href = '#/company_info';
            }
            else
                alertify.alert(data.msg);
        }).error(function(data, status) {
            //TODO:更改对话框
            alertify.alert('DATA ERROR');
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
        alertify.alert('DATA ERROR');
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
                window.location.href='#/company_info';

            }).error(function(data, status) {
                //TODO:更改对话框
                alertify.alert('DATA ERROR');
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
                alertify.alert('DATA ERROR');
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
            alertify.alert('请输入地点');
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
                url: '/company/campaignSponsor/'+$rootScope.cid,
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
                alertify.alert('DATA ERROR');
            });
        }
        catch(e){
            console.log(e);
        }
    };
}]);