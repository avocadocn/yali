'use strict';

var tabViewGroup = angular.module('donler');


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
tabViewGroup.config(['$routeProvider',
  function ($routeProvider) {
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
        controllerAs: 'account'
      })
      .when('/timeLine/:tid', {
        templateUrl: function(params){
            return '/group/timeline/'+params.tid;
        },
        controller: 'TimeLineController'
      })
      .otherwise({
        redirectTo: '/group_message'
      });
}]);

tabViewGroup.run(['$http','$rootScope','$location', 'Report', function ($http, $rootScope, $location, Report) {
    if($location.hash()!=='')
        $rootScope.nowTab = window.location.hash.substr(2);
    else if($location.path()!=='')
        $rootScope.nowTab = $location.path().substr(1);

    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
        $rootScope.message_corner = false;
    };
    $rootScope.number;
    $rootScope.isMember;
    $rootScope.message_for_group = true;
    $rootScope.$watch("role",function(role){
        if (role && $location.hash()=='' && $location.path()==''){
            if(role === 'GUEST' || role === 'GUESTHR' || role === 'GUESTLEADER'){
                $location.path('/group_info');
                $rootScope.nowTab = 'group_info';
            }
            else{
                $location.path('/group_message');
                $rootScope.nowTab = 'group_message';
            }
        }
    });

    $rootScope.$on("$routeChangeStart",function(){
        $rootScope.loading = true;
    });
    $rootScope.$on("$routeChangeSuccess",function(){
        $rootScope.loading = false;
    });


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
                if(data.result===1){
                    window.location.reload();
                }
            }).error(function(data,status){
                alertify.alert('DATA ERROR');
            });
        }
        catch(e){
            console.log(e);
        }
    };

    //退出小队
    $rootScope.quitGroup = function(){
        alertify.confirm('确认要退出该小队吗？',function(e){
            if(e){
                try{
                    $http({
                        method:'post',
                        url: '/users/quitGroup',
                        data:{
                            tid : $rootScope.teamId
                        }
                    }).success(function(data,status){
                        if(data.result===1){
                            window.location.reload();
                        }
                    }).error(function(data,status){
                        alertify.alert('err');
                    });
                }
                catch(e){
                    console.log(e);
                }
            }
        });
    };
    $rootScope.sponsorIndex =function(index) {
        $rootScope.modal_index=index;
        if(index===1){//活动
            $('#sponsorCampaignModel').modal('show');
        }
        else{
            $('#sponsorProvokeModel').modal('show');
        }
    };
    $rootScope.pushReport = function(){
        Report.publish($rootScope.reportContent,function(err,msg){
            alertify.alert(msg);
        });
    }
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
tabViewGroup.controller('TimeLineController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {
         $rootScope.nowTab = window.location.hash.substr(2);
    }
]);
tabViewGroup.controller('GroupMessageController', ['$http','$scope','$rootScope', 'Report', 'Comment',
  function ($http, $scope, $rootScope, Report, Comment) {
    $rootScope.nowTab = 'group_message';
    $scope.toggle = [];
    $scope.new_comment = [];
    $rootScope.$watch('teamId',function(tid){
        $http.get('/groupMessage/team/'+tid+'/0?'+ (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            $scope.group_messages = data.group_messages;
            $scope.user = data.user;
            $scope.role = data.role;

            $rootScope.message_corner = true;
            if(data.message_length<20){
                $scope.loadMore_flag = false;
            }
            else{
                $scope.loadMore_flag = true;
            }
            $scope.group_messages = messageConcat(data.group_messages,$rootScope,$scope),true;
        });
    });

    //var teamId = $('#team_content').attr('team-id');
    $scope.block = 1;
    $scope.page = 1;
    $scope.pageTime = [0];
    $scope.lastPage_flag = false;
    $scope.nextPage_flag = false;

    $scope.loadMore = function(){
        $http.get('/groupMessage/team/'+$rootScope.teamId+'/'+new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime()+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
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
        $http.get('/groupMessage/team/'+$rootScope.teamId+'/'+start_time+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            if(data.result===1 && data.group_messages.length>0){
                if(flag ==1){
                    $scope.page++;
                    $scope.pageTime.push(new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime());
                }
                else{
                    $scope.page--;
                }
                $scope.group_messages = messageConcat(data.group_messages,$rootScope,$scope,true);
                if(data.message_length<20){
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
        if($scope.toggle[index]){
            try {
                $http({
                    method: 'post',
                    url: '/comment/pull/campaign/'+$scope.group_messages[index].campaign._id,
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
        alertify.confirm('确认要删除该评论吗？',function(e){
            if(e){
                try {
                    Comment.remove($scope.group_messages[$scope.message_index].comments[index]._id, function (err) {
                        if (err) {
                            alertify.alert('删除失败，请重试。');
                        } else {
                            $scope.group_messages[$scope.message_index].comments.splice(index,1);
                            $scope.group_messages[$scope.message_index].campaign.comment_sum --;
                        }
                    });
                }
                catch(e) {
                    console.log(e);
                }
            }
        });
    };

    $scope.comment = function(index,form){
        if($scope.group_messages[index].comments.length > 0){
            var tmp_comment = $scope.group_messages[index].comments[0];
            if(tmp_comment.poster._id === $scope.user._id){
                if($scope.new_comment[index].text === tmp_comment.content){
                    alertify.alert('勿要重复留言!');
                    return;
                }
            }
        }
        var message_type = $scope.group_messages[index].message_type;
        var host_type = message_type>3 && message_type<7? 'competition' : 'campaign';
        try {
            $http({
                method: 'post',
                url: '/comment/push/'+host_type+'/'+$scope.group_messages[index].campaign._id,
                data:{
                    host_id : $scope.group_messages[index].campaign._id,
                    content : $scope.new_comment[index].text,
                    host_type : host_type
                }
            }).success(function(data, status) {
                if(data.msg === 'SUCCESS'){
                    $scope.group_messages[index].campaign.comment_sum ++;
                    $scope.group_messages[index].comments.unshift({
                        'show':true,
                        '_id':data.comment._id,
                        'host_id' : data.comment.host_id,
                        'content' : data.comment.content,
                        'create_date' : data.comment.create_date,
                        'poster' : data.comment.poster,
                        'host_type' : data.comment.host_type,
                        'index' : $scope.fixed_sum+1,
                        'delete_permission': true
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
    //消除ajax缓存
    // $scope.vote = function(competition_id, vote_status, index) {
    //     Campaign.vote(competition_id,vote_status,function(status,data){
    //         if(!status){
    //             
    //         }
    //         esle{
    //             alertify.alert(status);
    //         }
    //     })
    //      try {
    //         $http({
    //             method: 'post',
    //             url: '/campaign/vote/'+competition_id,
    //             data:{
    //                 competition_id : competition_id,
    //                 aOr : vote_status,
    //                 tid : $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].id
    //             }
    //         }).success(function(data, status) {
    //             if(data.result===0) {
    //                 alertify.alert(data.msg);
    //             } else {
    //                 $scope.group_messages[index].vote_flag = vote_status ? data.data.quit : -data.data.quit;
    //                 $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].vote.positive = data.data.positive;
    //                 $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].vote.negative = data.data.negative;
    //             }
    //         }).error(function(data, status) {
    //             alertify.alert('DATA ERROR');
    //         });
    //     }
    //     catch(e) {
    //         console.log(e);
    //     }
    // };
    var joinCommit = function(campaign_id,index,tid){
        try {
            $http({
                method: 'post',
                url: '/campaign/joinCampaign/'+campaign_id,
                data:{
                    campaign_id : campaign_id,
                    tid : tid,
                    join_team : $scope.join_teams[$scope.select_index]
                }
            }).success(function(data, status) {
                if(data.result===1){
                    //alert('成功加入该活动!');

                    alertify.alert('参加活动成功');
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
        $scope.join_teams=$scope.group_messages[index].myteam;
        $scope.join_campaign_id = campaign_id;
        $scope.join_index = index;
        $scope.select_index = 0;
        if($scope.group_messages[index].myteam.length>1){
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

    $scope.quit = function(campaign_id,index) {
        alertify.confirm('确认要退出活动吗？',function(e){
            if(e){
                try {
                    $http({
                        method: 'post',
                        url: '/campaign/quitCampaign/'+campaign_id,
                        data:{
                            campaign_id : campaign_id,
                            tid : $rootScope.teamId
                        }
                    }).success(function(data, status) {
                        if(data.result===1){
                            alertify.alert('成功退出活动!');
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
            }
        });
    };
    //应战
    $scope.responseProvoke = function(tid,competition_id,status) {
        alertify.confirm('确认要接受该挑战吗？',function(e){
            if(e){
                try {
                    $http({
                        method: 'post',
                        url: '/group/responseProvoke/'+tid,
                        data:{
                            competition_id : competition_id,
                            responseStatus : status
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
            }
        });
    };
    //取消挑战
    $scope.cancelProvoke = function(tid,competition_id) {
        alertify.confirm('确认要取消挑战吗？',function(e){
            if(e){
                try {
                    $http({
                        method: 'post',
                        url: '/group/cancelProvoke/'+tid,
                        data:{
                            competition_id : competition_id
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
            }
        });
    };
    $scope.getReport = function(groupMessageIndx,CommentIndex){
        $rootScope.reportContent = {
            hostType: 'comment',
            hostContent:{
                _id:$scope.group_messages[groupMessageIndx].comments[CommentIndex]._id,
                content:$scope.group_messages[groupMessageIndx].comments[CommentIndex].content,
                poster:$scope.group_messages[groupMessageIndx].comments[CommentIndex].poster
            },
            reportType:''

        }
        $('#reportModal').modal('show');
    }
}]);


tabViewGroup.controller('CampaignListController', ['$http', '$scope','$rootScope',
  function ($http, $scope, $rootScope) {
    $rootScope.$watch('teamId',function(teamId){
        $http.get('/campaign/getCampaigns/team/'+teamId+'/all/0/0?' + (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            $scope.campaigns = data.campaigns;
            $rootScope.sum = $scope.campaigns.length;
            if(data.campaignLength<20){
                $scope.loadMore_flag = false;
            }
            else{
                $scope.loadMore_flag = true;
            }
        });
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
    }
    $scope.loadMore = function(){
        $http.get('/campaign/getCampaigns/team/'+$rootScope.teamId+'/all/'+$scope.page+'/'+$scope.block+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
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
    }
    $scope.changePage = function(flag){
        $http.get('/campaign/getCampaigns/team/'+$rootScope.teamId+'/all/'+($scope.page+flag)+'/0?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
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
    }
    $scope.getId = function(cid) {
        $scope.campaign_id = cid;
    };
    $scope.cancel = function (_id) {
        alertify.confirm('确认要关闭该活动吗？',function(e){
            if(e){
                try {
                    $http({
                        method: 'post',
                        url: '/campaign/cancel/'+_id,
                        data:{
                            campaign_id : _id
                        }
                    }).success(function(data, status) {
                        if(data.result===1){
                            window.location.reload();
                        }
                        else{
                            alertify(data.msg);
                        }
                    }).error(function(data, status) {
                        alertify.alert('DATA ERROR');
                    });
                }
                catch(e) {
                    console.log(e);
                }
            }
        });
    };
}]);


tabViewGroup.controller('infoController', ['$http', '$scope','$rootScope',function($http, $scope, $rootScope) {
    $scope.unEdit = true;
    $scope.buttonStatus = '编辑';
    $scope.city='';
    $scope.MSearch1 = '';
    $scope.MSearch2 = '';
    $rootScope.$watch('teamId',function(tid){
        if($rootScope.teamId){
            $http.get('/group/info/'+tid).success(function(data, status) {
                $scope.members = [];
                $scope.team = data.companyGroup;
                $scope.name = $scope.team.name;
                $scope.entity = data.entity;
                $scope.role = data.role;
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
                $scope.team.home_court[0] = $scope.team.home_court[0] ? $scope.team.home_court[0] : {'name':'','loc':{'coordinates':[]}} ;
                $scope.team.home_court[1] = $scope.team.home_court[1] ? $scope.team.home_court[1] : {'name':'','loc':{'coordinates':[]}} ;
                $scope.showMap1 = $scope.team.home_court[0].name !=='' ? true : false;//以是否有主场判断是否需要显示地图
                $scope.showMap2 = $scope.team.home_court[1].name !=='' ? true : false;
            });
        }
    });
    var placeSearchCallBack = function(bindMap, index){
        return function(data){
            bindMap.clearMap();
            var lngX = data.poiList.pois[0].location.getLng();
            var latY = data.poiList.pois[0].location.getLat();
            $scope.team.home_court[index].loc.coordinates=[lngX, latY];
            var nowPoint = new AMap.LngLat(lngX,latY);
            var markerOption = {
                map: bindMap,
                position: nowPoint,
                draggable: true
            };
            var mar = new AMap.Marker(markerOption);
            bindMap.setFitView();
            var changePoint = function (e) {
                var p = e.lnglat;
                $scope.team.home_court[index].loc.coordinates=[p.getLng(), p.getLat()];
            };
            AMap.event.addListener(mar,"dragend", changePoint);
        }
    }
    var bindPlaceSearch = function(bindMap,index){
        bindMap.plugin(["AMap.PlaceSearch"], function() {
        if(index==0){
            $scope.MSearch1 = new AMap.PlaceSearch({ //构造地点查询类
                pageSize:1,
                pageIndex:1,
                city: $scope.city

            });
            AMap.event.addListener($scope.MSearch1, "complete", placeSearchCallBack(bindMap,index));//返回地点查询结果
        }
        else{
            $scope.MSearch2 = new AMap.PlaceSearch({ //构造地点查询类
                pageSize:1,
                pageIndex:1,
                city: $scope.city

            });
            AMap.event.addListener($scope.MSearch2, "complete", placeSearchCallBack(bindMap,index));//返回地点查询结果
        }
        });
    }
    //---主场地图
    //初始化 如果有坐标则显示标注点，没有则不显示
    $scope.initialize = function(){
        $scope.locationmap1 = new AMap.Map("courtMap1");
        $scope.locationmap2 = new AMap.Map("courtMap2");
        if($scope.team.home_court[0].name!==''){
            var piont1 = new AMap.LngLat($scope.team.home_court[0].loc.coordinates[0],$scope.team.home_court[0].loc.coordinates[1]);
            $scope.locationmap1.setZoomAndCenter(15,piont1);
            var markerOption = {
                map: $scope.locationmap1,
                position: piont1,
                draggable: true
            };
            var mar = new AMap.Marker(markerOption);
            var changePoint = function (e) {
                var p = e.lnglat;
                $scope.team.home_court[0].loc.coordinates=[p.getLng(), p.getLat()];
            };
            AMap.event.addListener(mar,"dragend", changePoint);
        };

        if($scope.team.home_court[1].name!==''){
            var piont2 = new AMap.LngLat($scope.team.home_court[1].loc.coordinates[0],$scope.team.home_court[1].loc.coordinates[1]);
            $scope.locationmap2.setZoomAndCenter(15,piont2);
            var markerOption = {
                map: $scope.locationmap2,
                position: piont2,
                draggable: true
            };
            var marker2 = new AMap.Marker(markerOption);
            var changePoint = function (e) {
                var p = e.lnglat;
                $scope.team.home_court[1].loc.coordinates=[p.getLng(), p.getLat()];
            };
            AMap.event.addListener(marker2,"dragend", changePoint);
        }
        if($scope.city!=''){
            bindPlaceSearch($scope.locationmap1,0);
            bindPlaceSearch($scope.locationmap2,1);
        }
        else {
            $scope.locationmap1.plugin(["AMap.CitySearch"], function() {
                var citysearch = new AMap.CitySearch();
                citysearch.getLocalCity();
                AMap.event.addListener(citysearch, "complete", function(result){
                    if(result && result.city && result.bounds) {
                        var citybounds = result.bounds;
                        $scope.city = result.city;
                        bindPlaceSearch($scope.locationmap1,0);
                        bindPlaceSearch($scope.locationmap2,1);
                    }
                });
                AMap.event.addListener(citysearch, "error", function(result){alert(result.info);});
            });
        }
        window.map_ready =true;
    };

    //修改主场地址后改变地图点
    $scope.changeLocation1 = function(){
        $scope.showMap1 = true;
        if ($scope.MSearch1!='') {
            $scope.MSearch1.search($scope.team.home_court[0].name); 
        }
        else{
            setTimeout(function(){
                $scope.MSearch1.search($scope.team.home_court[0].name);
            },0);
        }
    };

    $scope.changeLocation2 = function(){
        $scope.showMap2 = true;
        if ($scope.MSearch2!='') {
            $scope.MSearch2.search($scope.team.home_court[1].name); 
        }
        else{
            setTimeout(function(){
                $scope.MSearch2.search($scope.team.home_court[1].name);
            },0);
        }
        
    };
    $scope.editToggle = function() {

        $scope.unEdit = !$scope.unEdit;
        if($scope.unEdit) {
            if($scope.team.home_court[1].name =='')
                $scope.team.home_court.length --;
            if($scope.team.home_court[0].name =='')
                $scope.team.home_court.length --;
            try{
                $http({
                    method : 'post',
                    url : '/group/saveInfo/'+$rootScope.teamId,
                    data : {
                        'name' : $scope.name,
                        'brief' : $scope.team.brief,
                        'homecourt': $scope.team.home_court
                    }
                }).success(function(data, status) {
                    //TODO:更改对话框
                    if(data.result === 1) {
                        alertify.alert(data.msg);
                        window.location.reload();
                    }
                    else
                        alertify.alert(data.msg);
                }).error(function(data, status) {
                    //TODO:更改对话框
                    alertify.alert('DATA ERROR');
                });
            }
            catch(e) {
                console.log(e);
            }
            $scope.buttonStatus = '编辑';
        }
        else {
            if(!window.map_ready){//如果没有加载过地图script则加载
                window.court_map_initialize = function(){
                    $scope.initialize();
                };
                var script = document.createElement("script");  
                script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=court_map_initialize";
                document.body.appendChild(script);
            }
            $scope.team.home_court[0] = $scope.team.home_court[0] ? $scope.team.home_court[0] : {'name':'','loc':{'coordinates':[]}} ;
            $scope.team.home_court[1] = $scope.team.home_court[1] ? $scope.team.home_court[1] : {'name':'','loc':{'coordinates':[]}} ;
            $scope.buttonStatus = '保存';
        }
    };



    //---全家福
    var jcrop_api;
    // ng-show 会有BUG,不得已使用jquery show,hide
    var family_preview_container = $('#family_preview_container');
    var family_jcrop_container = $('#family_jcrop_container');
    family_preview_container.show();
    family_jcrop_container.hide();

    $scope.family_photos;
    var getFamily = function() {
        $http
        .get('/group/'+$rootScope.teamId+'/family')
        .success(function(data, status) {
            $scope.family_photos = data;
        })
        .error(function(data, status) {
            // TO DO
        });
    };

    getFamily();

    // for ng-class
    $scope.active = function(index) {
        if (index === 0 || index === '0') {
            return 'active';
        } else {
            return '';
        }
    };

    $scope.selected = function(photo) {
        if (photo.select === true) {
            return 'selected_img';
        } else {
            return '';
        }
    };

    $scope.next = function() {
        family_preview_container.hide();
        family_jcrop_container.show();
    };

    $scope.back = function() {
        if (jcrop_api) {
            jcrop_api.destroy();
            jcrop_img_container.html('');
            upload_input.val('');
            upload_button[0].disabled = true;
        }
        family_preview_container.show();
        family_jcrop_container.hide();
    };

    $scope.deletePhoto = function(id) {
        $http
        .delete('/group/' + $rootScope.teamId + '/family/photo/' + id)
        .success(function(data, status) {
            getFamily();
        })
        .error(function(data, status) {
            // TO DO
        });
    };

    $scope.toggleSelect = function(id) {
        $http
        .post('/select/group/' + $rootScope.teamId + '/family/photo/' + id)
        .success(function(data, status) {
            getFamily();
        })
        .error(function(data, status) {
            // TO DO
        });
    };

    $('#upload_family_form').ajaxForm(function(data, status) {
        getFamily();
        jcrop_api.destroy();
        jcrop_img_container.html('');
        upload_input.val('');
        upload_button[0].disabled = true;
        family_preview_container.show();
        family_jcrop_container.hide();
    });

    var getFilePath = function(input, callback) {
      var file = input.files[0];
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function(e) {
        callback(this.result);
      };
    };

    var upload_input = $('#upload_input');
    var upload_button = $('#upload_button');
    var jcrop_img_container = $('#jcrop_img_container');
    var clone_img = jcrop_img_container.find('img').clone();

    upload_input.change(function() {
        if (upload_input.val() == null || upload_input.val() === '') {
            upload_button[0].disabled = true;
        } else {
            if (upload_input[0].files[0].size > 1024 * 1024 * 5) {
                upload_button[0].disabled = true;
                $scope.remind = '上传的文件大小不可以超过5M';
            } else {
                upload_button[0].disabled = false;
                $scope.step = 'upload';
                family_preview_container.hide();
                family_jcrop_container.show();
            }
        }

        getFilePath(upload_input[0], function(path) {
            jcrop_img_container.html(clone_img.clone());
            var jcrop_img = jcrop_img_container.find('img');
            jcrop_img.attr('src', path);

            var select = function(coords) {
                var operator_img = $('.jcrop-holder img');
                var imgx = operator_img.width();
                var imgy = operator_img.height();
                // 裁剪参数，单位为百分比
                $('#w').val(coords.w / imgx);
                $('#h').val(coords.h / imgy);
                $('#x').val(coords.x / imgx);
                $('#y').val(coords.y / imgy);
            };

            jcrop_img.Jcrop({
                setSelect: [0, 0, 320, 180],
                aspectRatio: 16 / 9,
                onSelect: select,
                onChange: select
            }, function() {
                jcrop_api = this;
            });

            $('.jcrop-holder img').attr('src', path);
        });
    });
}]);

tabViewGroup.controller('SponsorController', ['$http', '$scope','$rootScope','Campaign',function($http, $scope, $rootScope, Campaign) {
    $scope.showMapFlag=false;
    $scope.location={name:'',coordinates:[]};

    $scope.$watch('member_max + member_min',function(newValue,oldValue){
        if($scope.member_max<$scope.member_min){
            $scope.campaign_form.$setValidity('ngMin', false);
            $scope.campaign_form.$setValidity('ngMax', false);
        }
        else{
            $scope.campaign_form.$setValidity('ngMin', true);
            $scope.campaign_form.$setValidity('ngMax', true);
        };
    });

    $('#sponsorCampaignModel').on('show.bs.modal', function (e) {
        if(!$scope.moldsgot){
            Campaign.getMolds('team',$rootScope.teamId,function(status,data){
                if(!status){
                    $scope.molds = data.molds;
                    $scope.moldsgot = true;
                    $scope.mold = $scope.molds[0].name;
                }
            });
        }
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
            $('#end_time').datetimepicker('setEndDate', dateUTC);
        });
        //加载地图
        if(!window.map_ready){
            window.campaign_map_initialize = $scope.initialize;
            var script = document.createElement("script");  
            script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=campaign_map_initialize";
            document.body.appendChild(script);
        }
        else{
            $scope.initialize();
        }
    });
    var placeSearchCallBack = function(data){
        $scope.locationmap.clearMap();
        var lngX = data.poiList.pois[0].location.getLng();
        var latY = data.poiList.pois[0].location.getLat();
        $scope.location.coordinates=[lngX, latY];
        var nowPoint = new AMap.LngLat(lngX,latY);
        var markerOption = {
            map: $scope.locationmap,
            position: nowPoint,
            draggable: true
        };
        var mar = new AMap.Marker(markerOption);
        var changePoint = function (e) {
            var p = mar.getPosition();
            $scope.location.coordinates=[p.getLng(), p.getLat()];
        };
        $scope.locationmap.setFitView();
        AMap.event.addListener(mar,"dragend", changePoint);

    };

    $scope.selectMold=function(name){
        $scope.mold = name;
    };

    $scope.initialize = function(){
        $scope.locationmap = new AMap.Map("mapDetail");            // 创建Map实例
        $scope.locationmap.plugin(["AMap.CitySearch"], function() {
            //实例化城市查询类
            var citysearch = new AMap.CitySearch();
            //自动获取用户IP，返回当前城市
            citysearch.getLocalCity();
            //citysearch.getCityByIp("123.125.114.*");
            AMap.event.addListener(citysearch, "complete", function(result){
                if(result && result.city && result.bounds) {
                    var citybounds = result.bounds;
                    //地图显示当前城市
                    $scope.locationmap.setBounds(citybounds);
                    $scope.locationmap.plugin(["AMap.PlaceSearch"], function() {      
                        $scope.MSearch = new AMap.PlaceSearch({ //构造地点查询类
                            pageSize:1,
                            pageIndex:1,
                            city: result.city

                        });
                        AMap.event.addListener($scope.MSearch, "complete", placeSearchCallBack);//返回地点查询结果
                    });
                }
            });
            AMap.event.addListener(citysearch, "error", function(result){alert(result.info);});
        });
        window.map_ready =true;
    };

    $scope.showMap = function(){
        if($scope.location.name==''){
            alertify.alert('请输入地点');
            return false;
        }
        else if($scope.showMapFlag ==false){
            $scope.showMapFlag =true;
            $scope.MSearch.search($scope.location.name); //关键字查询
        }
        else{
           $scope.MSearch.search($scope.location.name); //关键字查询
        }
    };

    $scope.sponsor = function() {
        if($scope.member_max < $scope.member_min){
            alertify.alert('最少人数须小于最大人数');
        }
        else{
            var _data = {
                theme: $scope.theme,
                location: $scope.location,
                start_time : $scope.start_time,
                end_time : $scope.end_time,
                campaign_mold:$scope.mold
            };
            var _url = '/group/campaignSponsor/'+$rootScope.teamId;
            Campaign.sponsor(_url,_data,function(status,data){
                if(!status){
                    window.location = '/campaign/detail/'+data.campaign_id+'?stat=editing';
                }else{
                    alertify.alert('活动发布出错');
                }
            });
        }
    };
}]);
tabViewGroup.controller('ProvokeController', ['$http', '$scope','$rootScope','Campaign',function($http, $scope, $rootScope, Campaign) {
    $scope.search_type="team";
    $scope.companies = [];
    $scope.teams = [];
    $scope.showMapFlag=false;
    $scope.location={name:'',coordinates:[]};
    $scope.modal=0;
    $scope.result=0;//是否已搜索
    $scope.selected_index=-1; 

    //决定要打开哪个挑战的modal
    $rootScope.$watch('modal_index',function(value){
        if(value===3){//动一下
            $scope.modal = 2;
            Campaign.getLedTeams($rootScope.teamId,function(status,teamdata){
                if(!status){
                    $scope.similarTeams = teamdata.teams;
                    if(teams.length===1){
                        $scope.modal=3;
                        $scope.team_opposite = $scope.similarTeams[0];
                        Campaign.getMolds('team',$rootScope.teamId,function(status,data){
                            if(!status){
                                $scope.mold = data.molds[0].name;
                                $scope.molds = data.molds;
                                $scope.cid = data.cid;
                            }
                        });
                    }
                }
            });
        }
        else if(value===2){
            $scope.recommandTeam();
        }
        if(value===2||value===3){
            //加载地图
            if(!window.map_ready){
                window.campaign_map_initialize = $scope.initialize;
                var script = document.createElement("script");  
                script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=campaign_map_initialize";
                document.body.appendChild(script);
            }
            else{
                $scope.initialize();
            }
        }
    });

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
        $('#competition_end_time').datetimepicker('setEndDate', dateUTC);
    });
    
    $scope.recommandTeam = function(){
        $scope.homecourt = true;
        try{
            $http({
                method:'post',
                url:'/search/recommandteam',
                data:{
                    gid : $rootScope.groupId,
                    tid : $rootScope.teamId
                }
            }).success(function(data,status){
                if(data.result===1){
                    $scope.teams=data.teams;
                }
                else if(data.result===2)//没填主场
                    $scope.homecourt=false;
            }).error(function(data,status){
               console.log('推荐失败'); 
            });
        }
        catch(e){
            console.log(e);
        }
    };

    $scope.search = function() {
        //按公司搜索
        if($scope.search_type==='company'){
            $scope.getCompany();
        //按队名搜索
        } else {
            $scope.getTeam();
        }
        $scope.result=1;//已搜索，显示搜索结果
        $scope.selected_index = -1;
    };
    var placeSearchCallBack = function(data){
        $scope.locationmap.clearMap();
        var lngX = data.poiList.pois[0].location.getLng();
        var latY = data.poiList.pois[0].location.getLat();
        $scope.location.coordinates=[lngX, latY];
        var nowPoint = new AMap.LngLat(lngX,latY);
        var markerOption = {
            map: $scope.locationmap,
            position: nowPoint,
            draggable: true
        };
        var mar = new AMap.Marker(markerOption);
        var changePoint = function (e) {
            var p = mar.getPosition();
            $scope.location.coordinates=[p.getLng(), p.getLat()];
        };
        $scope.locationmap.setFitView();
        AMap.event.addListener(mar,"dragend", changePoint);
    }
    $scope.initialize = function(){
        $scope.locationmap = new AMap.Map("competitionMapDetail");            // 创建Map实例
        $scope.locationmap.plugin(["AMap.CitySearch"], function() {
            //实例化城市查询类
            var citysearch = new AMap.CitySearch();
            //自动获取用户IP，返回当前城市
            citysearch.getLocalCity();
            //citysearch.getCityByIp("123.125.114.*");
            AMap.event.addListener(citysearch, "complete", function(result){
                if(result && result.city && result.bounds) {
                    var citybounds = result.bounds;
                    //地图显示当前城市
                    $scope.locationmap.setBounds(citybounds);
                    $scope.locationmap.plugin(["AMap.PlaceSearch"], function() {      
                        $scope.MSearch = new AMap.PlaceSearch({ //构造地点查询类
                            pageSize:1,
                            pageIndex:1,
                            city: result.city

                        });
                        AMap.event.addListener($scope.MSearch, "complete", placeSearchCallBack);//返回地点查询结果
                    });
                }
            });
            AMap.event.addListener(citysearch, "error", function(result){alert(result.info);});
        });
        window.map_ready =true;
    };
    
    $scope.showMap = function(){
        if($scope.location.name==''){
            alertify.alert('请输入地点');
            return false;
        }
        else if($scope.showMapFlag ==false){
            $scope.showMapFlag =true;
            $scope.MSearch.search($scope.location.name); //关键字查询
        }
        else{
            $scope.MSearch.search($scope.location.name); //关键字查询
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
                    alertify.alert("没有找到符合条件的公司!");
                }else{
                    for(var i = 0; i < $scope.companies.length; i ++) {
                        $scope.show_team.push(false);
                    }
                }
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    }

    var show_team_index = -1;
    $scope.toggleTeam = function(cid,index){
        if(show_team_index !== -1)
            $scope.show_team[show_team_index]=false;
        $scope.show_team[index] = true;
        if($scope.show_team[index] && show_team_index!==index){
            $scope.getSelectTeam(cid);
            $scope.selected_index = -1;
        }
        show_team_index = index;
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
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    }
    //选择小队
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
                    alertify.alert("没有找到符合条件的小队!");
                }
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    //选择对战小队
    $scope.provoke_select = function (index) {
        if(!index){//在自己队发挑战
            $scope.team_opposite = $scope.teams[$scope.selected_index]; 
            Campaign.getMolds('team',$rootScope.teamId,function(status,data){
                if(!status){
                    $scope.mold = data.molds[0].name;
                    $scope.user_cid = data.cid;
                }
            });
        }
        else{//到对方队动
            $scope.team_opposite = $scope.similarTeams[$scope.selected_index];
            Campaign.getMolds('team',$scope.team_opposite._id,function(status,data){
                if(!status){
                    $scope.mold = data.molds[0].name;
                    $scope.molds = data.molds;
                    $scope.user_cid = data.cid;
                }
            });
        }
        $scope.modal++;
        $rootScope.loadMapIndex=2;
    };
    $scope.addTag = function(index) {
        $scope.recommand_tags[index].disabled = true;
        $('#comptagsinput').tagsinput('add', $scope.recommand_tags[index]._id);
    };
    //约战
    $scope.provoke = function() {
        if($scope.member_max < $scope.member_min){
            alertify.alert('最少人数须小于最大人数');
        }
        else{
            var _data = {
                theme : $scope.theme,
                location: $scope.location,
                start_time: $scope.start_time,
                end_time: $scope.end_time,
                campaign_mold:$scope.mold
            };
            var callback = function(status,data){
                if(!status){
                    window.location = '/campaign/detail/'+data.campaign_id+'?stat=editing';
                }
                else{
                    alertify.alert('挑战发起失败');
                }                
            }
            if($scope.modal===1){//在自己的小队约战
                _data.team_opposite_id =$scope.team_opposite._id
                Campaign.sponsor('/group/provoke/'+$rootScope.teamId,_data,callback);
            }
            else{//在其它小队约战
                _data.team_opposite_id = $rootScope.teamId;
                Campaign.sponsor('/group/provoke/'+$scope.team_opposite._id,_data,callback);
            }
        }
    };
    $scope.selectMold=function(name){
        $scope.mold = name;
    };
    $scope.preStep = function(){
        $scope.modal--;
    };
    $scope.selcet_team = function(index){
        $scope.selected_index = index;
    };
}]);
