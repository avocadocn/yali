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
    $rootScope.teams = -1;

    $rootScope.company_first = false;
    $rootScope.team_first = false;

    $rootScope.team_find = false;
    $rootScope.company_find = false;

    $rootScope.s_value = "";
    $rootScope.search_type=true;

    $rootScope.showMapFlag=false;
    $rootScope.location={name:'',coordinates:[]};
    $rootScope.$watch('location.name',function(name){
        $rootScope.showMap(0);
    });

    $("#competition_start_time").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $rootScope.competition_date = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#competition_end_time').datetimepicker('setStartDate', dateUTC);
    });
    $("#competition_end_time").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $rootScope.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#competition_start_time').datetimepicker('setEndDate', dateUTC);
    });
    $("#competition_deadline").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $rootScope.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
    });
    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
    };

    $rootScope.check = function(value){
        $rootScope.search_type = value;
    }
    $rootScope.search = function() {
        //按公司搜索
        if(!$rootScope.search_type){
            $rootScope.company_first = true;
            $rootScope.team_first = false;
            $rootScope.getCompany();
        //按队名搜索
        } else {
            $rootScope.team_first = true;
            $rootScope.company_first = false;
            $rootScope.getTeam();
        }
    }
    $rootScope.showProvoke = function() {
        $("#sponsorProvokeModel").modal();
    }
    $rootScope.showMap = function(type){
        if(type===1&&($rootScope.location==undefined || $scope.location.name==undefined)){
            $rootScope.donlerAlert('请输入地点');
            return false;
        }
        if(type===1){
            $rootScope.showMapFlag = true;
        }

        var locationmap = new BMap.Map("mapDetail");            // 创建Map实例
        locationmap.centerAndZoom('上海',12);
        locationmap.enableScrollWheelZoom(true);
        locationmap.addControl(new BMap.NavigationControl({type: BMAP_NAVIGATION_CONTROL_SMALL}));
        var options = {
            renderOptions:{map: locationmap},
            onSearchComplete: function(results){
                // 判断状态是否正确
                if (local.getStatus() == BMAP_STATUS_SUCCESS){
                    var myIcon = new BMap.Icon("/img/icons/favicon.ico", new BMap.Size(30,30));
                    var marker = new BMap.Marker(locationmap.getCenter());  // 创建标注
                    locationmap.addOverlay(marker);              // 将标注添加到地图中
                    locationmap.enableDragging();    //可拖拽
                    $rootScope.location.coordinates=[results.getPoi(0).point.lng,results.getPoi(0).point.lat];
                    marker.addEventListener("dragend", function changePoint(){
                        var p = marker.getPosition();
                        $rootScope.location.coordinates=[p.lng , p.lat];
                    });
                }
            }
        };
        var local = new BMap.LocalSearch(locationmap,options);
        local.search($rootScope.location.name );
    };
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
                    start_time: $rootScope.start_time,
                    end_time: $rootScope.end_time,
                    deadline: $rootScope.deadline,
                    competition_format: $rootScope.competition_format,
                    number: $rootScope.number

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
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $rootScope.getCompany =function() {

        try {
            $http({
                method: 'post',
                url: '/search/company',
                data:{
                    regx : $rootScope.s_value
                }
            }).success(function(data, status) {
                $rootScope.companies = data;
                var len = $rootScope.companies.length;
                if(len > 0) {
                    $rootScope.company_first = true;
                    $rootScope.team_first = false;

                    $rootScope.team_find = false;
                    $rootScope.company_find = true;
                } else {
                    $rootScope.donlerAlert("没有找到符合条件的公司!");
                }
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
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
                    tid : $rootScope.teamId,
                    operate:'part'
                }
            }).success(function(data, status) {
                $rootScope.teams = data;
                var len = $rootScope.teams.length;
                if(len > 0 ) {
                    $rootScope.team_find = true;
                } else {
                    $rootScope.team_find = false;
                }
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    }

    $rootScope.getTeam = function () {
        try {
            $http({
                method: 'post',
                url: '/search/team',
                data:{
                    regx : $rootScope.s_value,
                    gid : $rootScope.groupId,
                    tid : $rootScope.teamId,
                    operate:'all'
                }
            }).success(function(data, status) {
                $rootScope.teams = data;
                var len = $rootScope.teams.length;
                if(len > 0) {
                    $rootScope.team_find = true;
                    $rootScope.company_find = false;
                } else {
                    $rootScope.team_find = false;
                    $rootScope.donlerAlert("没有找到符合条件的小组!");
                }
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $rootScope.provoke_select = function (team) {
        $rootScope.team_opposite = team;
        $("#sponsorSearchModel").modal('hide');
        $("#sponsorProvokeModel").modal('show');
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
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN_TEAM_FAILURE);
            });
        }
        catch(e){
            console.log(e);
        }
    };

    //退出小队
    $rootScope.quitGroup = function(){
        try{
            $http({
                method:'post',
                url: '/users/quitGroup',
                data:{
                    tid : $rootScope.teamId
                }
            }).success(function(data,status){
                window.location.reload();
            }).error(function(data,status){
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT_TEAM_FAILURE);
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
        $http.get('/group/getGroupMessages/'+tid +'?'+ (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
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
                    $rootScope.donlerAlert(data.msg);
                } else {
                    $scope.group_messages[index].positive = data.positive;
                    $scope.group_messages[index].negative = data.negative;
                }
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };

}]);


tabViewGroup.controller('CampaignListController', ['$http', '$scope','$rootScope',
  function ($http, $scope, $rootScope) {

    $scope.company = false;
    var groupId,teamId;
    $scope.company = false;
    $scope.showMapFlag=false;
    $scope.location={name:'',coordinates:[]};
    $scope.$watch('teamId',function(tid){
        //消除ajax缓存
        teamId = tid;
        $rootScope.teamId = tid;
        $http.get('/group/getCampaigns/'+tid+'?' + (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            $scope.campaigns = data.data;
            $scope.role = data.role;    //只有改组的组长才可以操作活动(关闭、编辑等)
            if(data.role==="HR"||data.role==="LEADER"){
                $scope.$watch('location.name',function(name){
                    $scope.showMap(0);
                });


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
                $scope.showMap = function(type){
                    if(type===1&&($scope.location==undefined || $scope.location.name==undefined)){
                        $rootScope.donlerAlert('请输入地点');
                        return false;
                    }
                    if(type===1){
                        $scope.showMapFlag = true;
                    }

                    var locationmap = new BMap.Map("mapDetail");            // 创建Map实例
                    locationmap.centerAndZoom('上海',12);
                    locationmap.enableScrollWheelZoom(true);
                    locationmap.addControl(new BMap.NavigationControl({type: BMAP_NAVIGATION_CONTROL_SMALL}));
                    var options = {
                        renderOptions:{map: locationmap},
                        onSearchComplete: function(results){
                            // 判断状态是否正确
                            if (local.getStatus() == BMAP_STATUS_SUCCESS){
                                var myIcon = new BMap.Icon("/img/icons/favicon.ico", new BMap.Size(30,30));
                                var marker = new BMap.Marker(locationmap.getCenter());  // 创建标注
                                locationmap.addOverlay(marker);              // 将标注添加到地图中
                                locationmap.enableDragging();    //可拖拽
                                $scope.location.coordinates=[results.getPoi(0).point.lng,results.getPoi(0).point.lat];
                                marker.addEventListener("dragend", function changePoint(){
                                    var p = marker.getPosition();
                                    $scope.location.coordinates=[p.lng , p.lat];
                                });
                            }
                        }
                    };
                    var local = new BMap.LocalSearch(locationmap,options);
                    local.search($scope.location.name );
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
                                end_time : $scope.end_time,
                                min_number: $scope.min_number,
                                max_number: $scope.max_number,
                                deadline: $scope.deadline
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
            }
        });

    });

    $scope.$watch('groupId',function(gid){
        groupId = gid;
        $rootScope.groupId = gid;
    });
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
}]);

tabViewGroup.controller('infoController', ['$http', '$scope','$rootScope',function($http, $scope, $rootScope) {
    $scope.unEdit = true;
    $scope.buttonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.EDIT;
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
                        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.MSG_UPDATE_SUCCESS);
                        window.location.reload();
                    }
                    else
                        $rootScope.donlerAlert(data.msg);
                }).error(function(data, status) {
                    //TODO:更改对话框
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                });
            }
            catch(e) {
                console.log(e);
            }
            $scope.buttonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.EDIT;;
        }
        else {
            $scope.buttonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.SAVE;;
        }
  };
}]);
