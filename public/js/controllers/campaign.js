'use strict';

var campaignApp = angular.module('donler');
campaignApp.directive('maxHeight', function() {
    return {
        restrict: 'A',
        link: function(scope, elem, attr, ctrl) {
            if(elem.height()>attr.maxHeight){
                scope.showFold =true;
            }
            else{
                scope.showFold =false;
            }
        }
    };
});
campaignApp.controller('campaignController', ['$scope', '$http','$rootScope', 'Comment', 'Report', function ($scope, $http, $rootScope, Comment, Report) {

    $scope.private_message_content = {
        'text':""
    };

    $scope.editContentStatus =false;


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

    

    $scope.select_index = 0;
    $scope.selcetJoinTeam = function(index,team){
        $scope.join_team = {
            _id : team._id,
            name : team.name,
            logo : team.logo
        };
        $scope.select_index = index;
    }
    $scope.joinReady = function(){
        $scope.select_index = 0;
        $('#joinTeamSelectmodal').modal();
    }
    $scope.joinCampaign = function (join_team) {
        if(!join_team){
            join_team = $scope.join_team;
        }
        try {
            $http({
                method: 'post',
                url: '/campaign/joinCampaign/'+$scope.campaign_id,
                data:{
                    campaign_id : $scope.campaign_id,
                    join_team : join_team
                }
            }).success(function(data, status) {
                if(data.result===1){
                    alertify.alert('参加活动成功');
                    window.location.reload();
                }
                else{
                    alertify.alert(data.msg);
                }
            }).error(function(data, status) {
                alertify.alert(data.msg);
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $scope.quitCampaign = function () {
        alertify.confirm('确认要退出活动吗？',function(e){
            if(e){
                try {
                    $http({
                        method: 'post',
                        url: '/campaign/quitCampaign/'+$scope.campaign_id,
                        data:{
                            campaign_id : $scope.campaign_id
                        }
                    }).success(function(data, status) {
                        if(data.result===1){
                            alertify.alert('退出活动成功');
                            window.location.reload();
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


    $scope.modalPerticipator = function(team){
        $scope.select_team = team;
        $('#sponsorMessageCampaignModel').modal();
    }
    $scope.sendToParticipator = function(){
        try{
          $http({
              method: 'post',
              url: '/message/push/campaign',
              data:{
                    team : $scope.select_team,
                    campaign_id : $scope.campaign_id,
                    content : $scope.private_message_content.text
              }
          }).success(function(data, status) {
              if(data.msg === 'SUCCESS'){
                window.location.reload();
              }
          }).error(function(data, status) {
              //TODO:更改对话框
              alertify.alert('DATA ERROR');
          });
        }
        catch(e){
            console.log(e);
        }
    }
    $scope.editContent = function(){

        if(!$scope.editContentStatus){
            $scope.campaignContent = angular.element('#campaignContent').html();
            $scope.editContentStatus = !$scope.editContentStatus;
            var options = {
                editor: document.getElementById('campaignDetail'), // {DOM Element} [required]
                class: 'dl_markdown', // {String} class of the editor,
                textarea: '<textarea name="content" ng-model="$parent.content"></textarea>', // fallback for old browsers
                list: ['h5', 'p', 'insertorderedlist','insertunorderedlist', 'indent', 'outdent', 'bold', 'italic', 'underline'], // editor menu list
                stay: false,
                toolBarId: 'campaignDetailToolBar'
              }
            var editor = new Pen(options);
        }
        else{
            try {
                $http({
                    method: 'post',
                    url: '/campaign/edit/'+$scope.campaign_id,
                    data:{
                        campaign_id : $scope.campaign_id,
                        content : $scope.campaignContent
                    }
                }).success(function(data, status) {
                    if(data.result===1){
                        window.location.reload();
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
    }
    $scope.photos = null;

    $scope.pushReport = function(){
        Report.publish($scope.reportContent,function(err,msg){
            alertify.alert(msg);
        });
    }
}]);