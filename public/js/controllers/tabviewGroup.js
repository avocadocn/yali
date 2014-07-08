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
        templateUrl: '/message_list',
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
    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
        $rootScope.message_corner = false;
    };
    $rootScope.number;
    $rootScope.isMember;
    $rootScope.message_for_group = true;

    $rootScope.messageTypeChange = function(value){
        $rootScope.message_for_group = value;
    }
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
                $rootScope.number += 1;
                $rootScope.isMember = true;
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
                $rootScope.number -= 1;
                $rootScope.isMember = false;
            }).error(function(data,status){
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT_TEAM_FAILURE);
            });
        }
        catch(e){
            console.log(e);
        }
    };

}]);


var messageConcat = function(messages,rootScope,scope,reset){
    if(reset){
        rootScope.sum = 0;
    }
    rootScope.sum += messages.length;
    var new_messages = messages;
    for(var i = 0; i < new_messages.length; i ++){
        new_messages[i].comments = [];
        new_messages[i].comment_permission = true;
        scope.toggle.push(false);
        scope.new_comment.push({
            text: ''
        });
    }
    return new_messages;
}

tabViewGroup.controller('GroupMessageController', ['$http','$scope','$rootScope',
  function ($http, $scope,$rootScope) {
    $scope.private_message_content = {
        'text':""
    };
    $scope.toggle = [];
    $scope.new_comment = [];
    $rootScope.$watch('teamId',function(tid){
        $http.get('/groupMessage/team/0?'+ (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            $scope.group_messages = data.group_messages;
            $scope.user = data.user;
            $scope.role = data.role;

            $rootScope.message_corner = true;

            $scope.group_messages = messageConcat(data.group_messages,$rootScope,$scope),true;
        });
        $rootScope.$watch('teamName',function(tname){
            ;
        });
    });

    //var teamId = $('#team_content').attr('team-id');
    $rootScope.nowTab ='group_message';

    $scope.loadMore_flag = true;
    $scope.block = 1;
    $scope.page = 1;
    $scope.pageTime = [0];
    $scope.lastPage_flag = false;
    $scope.nextPage_flag = false;


    $scope.index_for_participator = 0;
    $scope.modalPerticipator = function(index){
        $rootScope.index_for_participator = index;
        $('#sponsorMessageCampaignModel').modal();
    }
    $scope.sendToParticipator = function(){
        try{
          $http({
              method: 'post',
              url: '/message/push/campaign',
              data:{
                  campaign_id : $scope.group_messages[$rootScope.index_for_participator].campaign._id,
                  content : $scope.private_message_content.text
              }
          }).success(function(data, status) {
              if(data.msg === 'SUCCESS'){
                $scope.private_message_content.text = "";
                $rootScope.team_length++;
                $rootScope.o ++;
              }
          }).error(function(data, status) {
              //TODO:更改对话框
              $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
          });
        }
        catch(e){
            console.log(e);
        }
    }

    $scope.loadMore = function(){
        $http.get('/groupMessage/team/'+new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime()+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            if(data.result===1 && data.group_messages.length>0){



                $scope.group_messages = $scope.group_messages.concat(messageConcat(data.group_messages,$rootScope,$scope,false));
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
        $http.get('/groupMessage/team/'+start_time+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            if(data.result===1 && data.group_messages.length>0){
                if(flag ==1){
                    $scope.page++;
                    $scope.pageTime.push(new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime());
                }
                else{
                    $scope.page--;
                }
                $scope.group_messages = messageConcat(data.group_messages,$rootScope,$scope,true);

                $scope.loadMore_flag = true;
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
                                $scope.group_messages[index].comments[i].delete_permission = $scope.role === 'LEADER' || $scope.role === 'HR' || $scope.group_messages[index].comments[i].poster._id === $scope.user._id;
                                $scope.group_messages[index].comments[i].index = data.length - i;
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
                if(data === 'SUCCESS'){
                    var poster={
                        'nickname' : '我自己',
                        'photo' : $scope.user.photo
                    };
                    $scope.group_messages[index].campaign.comment_sum ++;
                    $scope.group_messages[index].comments.unshift({
                        'show':true,
                        'host_id' : $scope.group_messages[index].campaign._id,
                        'content' : $scope.new_comment[index].text,
                        'create_date' : new Date(),
                        'poster' : poster,
                        'host_type' : 'campaign',
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
    //消除ajax缓存
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
                }
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
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
    $scope.responseProvoke = function(tid,competition_id) {
         try {
            $http({
                method: 'post',
                url: '/group/responseProvoke/'+$rootScope.teamId,
                data:{
                    competition_id : competition_id
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


tabViewGroup.controller('CampaignListController', ['$http', '$scope','$rootScope',
  function ($http, $scope, $rootScope) {
    $http.get('/campaign/getCampaigns/team/all/0?' + (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
        $scope.campaigns = data.campaigns;
        $rootScope.sum = $scope.campaigns.length;
    });
    $scope.loadMore_flag = true;
    $scope.block = 1;
    $scope.page = 1;
    $scope.pageTime = [0];
    $scope.lastPage_flag = false;
    $scope.nextPage_flag = false;

    $scope.loadMore = function(){
        $http.get('/campaign/getCampaigns/team/all/'+new Date($scope.campaigns[$scope.campaigns.length-1].start_time).getTime()+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            if(data.result===1 && data.campaigns.length>0){
                $scope.campaigns = $scope.campaigns.concat(data.campaigns);
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
        $http.get('/campaign/getCampaigns/team/all/'+start_time+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            if(data.result===1 && data.campaigns.length>0){
                if(flag ==1){
                    $scope.page++;
                    $scope.pageTime.push(new Date($scope.campaigns[$scope.campaigns.length-1].start_time).getTime());
                }
                else{
                    $scope.page--;
                }
                $scope.campaigns = data.campaigns;
                $scope.loadMore_flag = true;
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
    //应战
    $scope.responseProvoke = function(competition_id) {
         try {
            $http({
                method: 'post',
                url: '/group/responseProvoke',
                data:{
                    competition_id : competition_id
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


tabViewGroup.controller('infoController', ['$http', '$scope','$rootScope',function($http, $scope, $rootScope) {
    $scope.unEdit = true;
    $scope.buttonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.EDIT;
    $rootScope.$watch('teamId',function(tid){
        $http.get('/group/info/'+tid).success(function(data, status) {
            $scope.members = [];
            $scope.team = data.companyGroup;
            $scope.name = $scope.team.name;
            $scope.entity = data.entity;
            var judge = true;
            for(var i = 0; i < data.companyGroup.member.length; i ++) {
                for(var j = 0; j < data.companyGroup.leader.length; j ++) {
                    if(data.companyGroup.leader[j]._id === data.companyGroup.member[i]._id){
                        judge = false;
                        break;
                    }
                }
                if(judge){
                    $scope.members.push(data.companyGroup.member[i]);
                }
                judge = true;
            }
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
                        'brief' : $scope.team.brief,
                        'homecourt': [$scope.entity.home_court[0],$scope.entity.home_court[1]]
                    }
                }).success(function(data, status) {
                    //TODO:更改对话框
                    if(data.result === 1) {
                        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.MSG_UPDATE_SUCCESS);
                        //window.location.reload();
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

    $scope.family_photos;
    var getFamily = function() {
        $http
        .get('/group/family')
        .success(function(data, status) {
            $scope.family_photos = data;
        })
        .error(function(data, status) {
            // TO DO
        });
    };

    getFamily();

    $scope.active = function(index) {
        if (index === 0 || index === '0') {
            return 'active';
        } else {
            return '';
        }
    };

    $scope.deletePhoto = function(id) {
        $http
        .delete('/group/family/photo/' + id)
        .success(function(data, status) {
            getFamily();
        })
        .error(function(data, status) {
            // TO DO
        });
    };

    $('#upload_family_form').ajaxForm(function(data, status) {
        getFamily();
    });


}]);
tabViewGroup.controller('SponsorController', ['$http', '$scope','$rootScope',function($http, $scope, $rootScope) {
    $scope.showMapFlag=false;
    $scope.location={name:'',coordinates:[]};
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
    $("#deadline").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
    });
    $scope.initialize = function(){
        if($scope.showMapFlag ==false){
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
            window.map_ready =true;
            $scope.showMapFlag = true;
        }
        else{
            $scope.local.search($scope.location.name );
        }

    };
    window.campaign_map_initialize = $scope.initialize;
    $scope.showMap = function(type){
        if($scope.location.name==''){
            $rootScope.donlerAlert('请输入地点');
            return false;
        }
        if(!window.map_ready && $scope.showMapFlag ==false){
            var script = document.createElement("script");  
            script.src = "http://api.map.baidu.com/api?v=2.0&ak=krPnXlL3wNORRa1KYN1RAx3c&callback=campaign_map_initialize";
            document.body.appendChild(script);
        }
        else{
            $scope.initialize();
        }
    };

    $scope.sponsor = function() {
        try{
            $http({
                method: 'post',
                url: '/group/campaignSponsor/'+ $rootScope.teamId,
                data:{
                    theme: $scope.theme,
                    location: $scope.location,
                    content : $scope.content,
                    start_time : $scope.start_time,
                    end_time : $scope.end_time,
                    member_min: $scope.member_min,
                    member_max: $scope.member_max,
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
}]);
tabViewGroup.controller('ProvokeController', ['$http', '$scope','$rootScope',function($http, $scope, $rootScope) {
    $scope.search_type="team";
    $scope.companies = [];
    $scope.teams = [];
    $scope.showMapFlag=false;
    $scope.location={name:'',coordinates:[]};
    $scope.modal=false;
    $("#competition_start_time").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.competition_date = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#competition_end_time').datetimepicker('setStartDate', dateUTC);
    });
    $("#competition_end_time").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#competition_start_time').datetimepicker('setEndDate', dateUTC);
        $('#competition_deadline').datetimepicker('setEndDate', dateUTC);
    });
    $("#competition_deadline").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
    });
    $scope.search = function() {
        //按公司搜索
        if($scope.search_type==='company'){
            $scope.getCompany();
        //按队名搜索
        } else {
            $scope.getTeam();
        }
    }
    $scope.initialize = function(){
        if($scope.showMapFlag ==false){
            $scope.locationmap = new BMap.Map("competitionMapDetail");            // 创建Map实例
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
            window.map_ready =true;
            $scope.showMapFlag = true;
        }
        else{
            $scope.local.search($scope.location.name );
        }

    };
    window.provokeMapInitialize = $scope.initialize;
    $scope.showMap = function(){
        if($scope.location.name==''){
            $rootScope.donlerAlert('请输入地点');
            return false;
        }
        if(!window.map_ready && $scope.showMapFlag ==false){
            var script = document.createElement("script");
            script.src = "http://api.map.baidu.com/api?v=2.0&ak=krPnXlL3wNORRa1KYN1RAx3c&callback=provokeMapInitialize";
            document.body.appendChild(script);
        }
        else{
            $scope.initialize();
        }
    };
    $scope.getCompany =function() {
        try {
            $scope.show_team = [];
            $http({
                method: 'post',
                url: '/search/company',
                data:{
                    regx : $scope.s_value
                }
            }).success(function(data, status) {
                $scope.companies = data;
                var tmp = 0;
                for(var i = 0; i < $scope.companies.length; i ++) {
                    var team_tmp = $scope.companies[i].team;
                    $scope.companies[i].team = [];
                    for(var j = 0; j < team_tmp.length; j ++) {
                        if(team_tmp[j].gid === $rootScope.groupId){
                            if(team_tmp[j].id.toString() !== $rootScope.teamId){
                                $scope.companies[i].team.push(team_tmp[j]);
                            }
                        }
                    }
                }
                $scope.teams=[];
                if($scope.companies.length <= 0) {
                    $scope.donlerAlert("没有找到符合条件的公司!");
                }else{
                    for(var i = 0; i < $scope.companies.length; i ++) {
                        $scope.show_team.push(false);
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


    $scope.toggleTeam = function(cid,index){
        for(var i = 0; i < $scope.companies.length; i ++){
            if(i !== index){
                $scope.show_team[i] = false;
            }
        }
        $scope.show_team[index] = !$scope.show_team[index];
        if($scope.show_team[index]){
            $scope.getSelectTeam(cid);
        }
    }

    $scope.getSelectTeam = function(cid) {
        try {
            $scope.teams=[];
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
                $scope.teams = data;
                var len = $scope.teams.length;
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    }

    $scope.getTeam = function () {
        try {
            $http({
                method: 'post',
                url: '/search/team',
                data:{
                    regx : $scope.s_value,
                    gid : $rootScope.groupId,
                    tid : $rootScope.teamId,
                    operate:'all'
                }
            }).success(function(data, status) {
                $scope.teams = data;
                $scope.companies=[];
                if($scope.teams.length <= 0) {
                    $rootScope.donlerAlert("没有找到符合条件的小队!");
                }
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $scope.provoke_select = function (team) {
        $scope.team_opposite = team;
        $scope.modal=true;
    };
        //约战
    $scope.provoke = function() {
         try {
            $http({
                method: 'post',
                url: '/group/provoke/'+$rootScope.teamId,
                data:{
                    theme : $scope.theme,
                    team_opposite : $scope.team_opposite,
                    content : $scope.content,
                    location: $scope.location,
                    start_time: $scope.start_time,
                    end_time: $scope.end_time,
                    deadline: $scope.deadline,
                    member_min : $scope.member_min,
                    member_max : $scope.member_max
                }
            }).success(function(data, status) {
                window.location.reload();
            }).error(function(data, status) {
                $rootSope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);
