'use strict';

var campaignApp = angular.module('mean.main');

campaignApp.controller('campaignController', ['$scope', '$http', function($scope, $http) {

    $scope.campaign_id = "";
    $scope.$watch('campaignId',function(campaign_id){
        $scope.campaign_id = campaign_id;
    });

    $scope.joinCampaign = function () {
        try {
            $http({
                method: 'post',
                url: '/users/joinCampaign',
                data:{
                    campaign_id : $scope.campaign_id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    alert('成功加入该活动!');
                    $scope.join = true;
                    window.location.reload();
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

    $scope.quitCampaign = function () {
        try {
            $http({
                method: 'post',
                url: '/users/quitCampaign',
                data:{
                    campaign_id : $scope.campaign_id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    alert('您已退出该活动!');
                    $scope.join = false;
                    window.location.reload();
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
}]);