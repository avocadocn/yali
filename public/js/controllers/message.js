'use strict';

var messageApp = angular.module('mean.main');

messageApp.controller('messageController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {

    $http.get('/message/init').success(function(data, status) {
        $scope.campaign = data.campaign;
        $scope.join = data.join;
        $scope.over = data.over;
        $scope.nickname = data.nickname;
        $scope.photo = data.photo;
        $scope.campaignLogo = data.campaignLogo;
        $scope.comments = [];
        $(function(){
            var locationmap = new BMap.Map("mapContainer");            // 创建Map实例
            var nowPoint = new BMap.Point(data.campaign.location.coordinates[0],data.campaign.location.coordinates[1]);
            locationmap.centerAndZoom(nowPoint,15);
            locationmap.enableScrollWheelZoom(true);
            locationmap.addControl(new BMap.NavigationControl({type: BMAP_NAVIGATION_CONTROL_SMALL}));
            var marker = new BMap.Marker(nowPoint);  // 创建标注
            locationmap.addOverlay(marker);              // 将标注添加到地图中
            var label = new BMap.Label(data.campaign.location.name,{offset:new BMap.Size(20,-10)});
            marker.setLabel(label);
        });
        $scope.getComment(); //获取留言
        $scope.new_comment = {
            text:''
        };
    });

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
                    for(var i = 0; i < $scope.comments.length; i ++) {
                        $scope.comments[i].index = i+1;
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

    $scope.comment = function(){
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
                        'nickname' : $scope.nickname,
                        'photo' : $scope.photo
                    };
                    $scope.comments.push({
                        'host_id' : $scope.campaign._id,
                        'content' : $scope.new_comment.text,
                        'create_date' : new Date(),
                        'poster' : poster,
                        'host_type' : 'campaign_detail',
                        'index' : $scope.comments.length + 1
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
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN_CAMPAIGN_SUCCESS);
                    $scope.join = true;
                    $scope.campaign.member.push({
                        'nickname' : $scope.nickname,
                        'photo' : $scope.photo
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
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT_CAMPAIGN_SUCCESS);
                    //alert('您已退出该活动!');
                    $scope.join = false;
                    for(var i = 0;i < $scope.campaign.member.length; i ++) {
                        if($scope.campaign.member[i].nickname === $scope.nickname) {
                            $scope.campaign.member.splice(i,1);
                            break;
                        }
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