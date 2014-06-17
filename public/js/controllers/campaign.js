'use strict';

var campaignApp = angular.module('mean.main');

campaignApp.controller('campaignController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
    $rootScope.nowTab = 'campaign';

    $http.get('/group/campaignData').success(function(data, status) {
        $scope.campaign = data.campaign;
        $scope.join = data.join;
        $scope.over = data.over;
        $scope.nickname = data.nickname,
        $scope.photo = data.photo
    });
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
                        if($scope.campaign.member[i].nickname = $scope.nickname) {
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