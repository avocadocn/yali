'use strict';

var campaignApp = angular.module('mean.main');

campaignApp.controller('campaignController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
    $scope.$watch('campaign',function(campaign){
        if(campaign==null){
            return;
        }
        $scope.getComment(); //获取留言
    });
    $scope.initialize = function(){
        var locationmap = new BMap.Map("mapContainer");            // 创建Map实例
        var nowPoint = new BMap.Point($scope.campaign.location.coordinates[0],$scope.campaign.location.coordinates[1]);
        locationmap.centerAndZoom(nowPoint,15);
        locationmap.enableScrollWheelZoom(true);
        locationmap.addControl(new BMap.NavigationControl({type: BMAP_NAVIGATION_CONTROL_SMALL}));
        var marker = new BMap.Marker(nowPoint);  // 创建标注
        locationmap.addOverlay(marker);              // 将标注添加到地图中
        var label = new BMap.Label($scope.campaign.location.name,{offset:new BMap.Size(20,-10)});
        marker.setLabel(label);
    };
    window.initialize = $scope.initialize;
    $scope.comments = [];

    $scope.new_comment = {
        text:''
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
    $scope.getComment = function(){
        try {
            $http({
                method: 'post',
                url: '/comment/pull',
                data:{
                    host_id : $scope.campaign._id
                }
            }).success(function(data, status) {
                if(data.length > 0){
                    $scope.comments = data;
                    $scope.fixed_sum = data.length;
                    for(var i = 0; i < $scope.comments.length; i ++) {
                        if($scope.comments[i].status == 'delete'){
                            $scope.comments.splice(i,1);
                            i--;
                        }else{
                            $scope.comments[i].delete_permission = $scope.role === 'LEADER' || $scope.role === 'HR' || $scope.comments[i].poster._id === $scope.user._id;
                            $scope.comments[i].index = data.length - i;
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

    $scope.deleteComment = function(index){
        try {
            $http({
                method: 'post',
                url: '/comment/delete',
                data:{
                    comment_id : $scope.comments[index]._id,
                    host_type:'campaign_detail',
                    host_id:$scope.campaign._id
                }
            }).success(function(data, status) {
                if(data === 'SUCCESS'){
                    $scope.comments.splice(index,1);
                    $scope.campaign.comment_sum --;
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

    $scope.comment = function(){
        for(var i = 0; i < $scope.comments.length; i ++){
            if($scope.new_comment.text === $scope.comments[i].content){
                alertify.alert('勿要重复留言!');
                return;
            }
        }
        try {
            $http({
                method: 'post',
                url: '/comment/push',
                data:{
                    host_id : $scope.campaign._id,
                    content : $scope.new_comment.text,
                    host_type : 'campaign_detail'
                }
            }).success(function(data, status) {
                if(data === 'SUCCESS'){
                    var poster={
                        'nickname' : $scope.user.nickname,
                        'photo' : $scope.user.photo
                    };
                    $scope.comments.unshift({
                        'host_id' : $scope.campaign._id,
                        'content' : $scope.new_comment.text,
                        'create_date' : new Date(),
                        'poster' : poster,
                        'host_type' : 'campaign_detail',
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
    $scope.joinCampaign = function () {
        //$rootScope.donlerAlert($scope.campaign_id);
        try {
            $http({
                method: 'post',
                url: '/users/joinCampaign',
                data:{
                    campaign_id : $scope.campaign._id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    //alert('成功加入该活动!');
                    //$rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN_CAMPAIGN_SUCCESS);
                    $scope.join = 1;
                    if($scope.role==='HR'|| $scope.role ==='LEADER'){
                        for(var i = 0;i < $scope.campaign.member_quit.length; i ++) {
                            if($scope.campaign.member_quit[i].nickname === $scope.user.nickname) {
                                $scope.campaign.member_quit.splice(i,1);
                                break;
                            }
                        }
                    }

                    $scope.campaign.member.push({
                        'nickname' : $scope.user.nickname,
                        'photo' : $scope.user.photo
                    });
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

    $scope.quitCampaign = function () {
        try {
            $http({
                method: 'post',
                url: '/users/quitCampaign',
                data:{
                    campaign_id : $scope.campaign._id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    //$rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT_CAMPAIGN_SUCCESS);
                    //alert('您已退出该活动!');
                    $scope.join = -1;

                        for(var i = 0;i < $scope.campaign.member.length; i ++) {
                            if($scope.campaign.member[i].nickname === $scope.user.nickname) {
                                $scope.campaign.member.splice(i,1);
                                break;
                            }
                        }

                    if($scope.role==='HR'|| $scope.role ==='LEADER'){
                        $scope.campaign.member_quit.push({
                            'nickname' : $scope.user.nickname,
                            'photo' : $scope.user.photo
                        });
                    }
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