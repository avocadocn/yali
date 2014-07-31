'use strict';

var campaignApp = angular.module('donler');

campaignApp.controller('campaignController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
    $scope.private_message_content = {
        'text':""
    };
    $scope.$watch('campaign_id',function(campaign){
        if(campaign==null){
            return;
        }
        $scope.getComment(); //获取留言
    });
    $scope.comments = [];

    $scope.new_comment = {
        text:''
    };
    $scope.cancel = function (_id) {
        try {
            $http({
                method: 'post',
                url: '/campaign/cancel/'+_id,
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
    $scope.getComment = function(){
        try {
            $http({
                method: 'post',
                url: '/comment/pull/campaign/'+$scope.campaign_id,
                data:{
                    host_id : $scope.campaign_id
                }
            }).success(function(data, status) {
                if(data.comments.length > 0){
                    $scope.comments = data.comments;
                    $scope.fixed_sum = data.comments.length;
                    $scope.user = data.user;
                }
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
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
                    host_id:$scope.campaign_id
                }
            }).success(function(data, status) {
                if(data === 'SUCCESS'){
                    $scope.comments.splice(index,1);
                    $scope.campaign.comment_sum --;
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

    $scope.comment = function(){

         if($scope.comments.length > 0){
            var tmp_comment = $scope.comments[0];
            if(tmp_comment.poster._id === $scope.user._id){
                if($scope.new_comment.text === tmp_comment.content){
                    alertify.alert('勿要重复留言!');
                    return;
                }
            }
        }
        try {
            $http({
                method: 'post',
                url: '/comment/push',
                data:{
                    host_id : $scope.campaign_id,
                    content : $scope.new_comment.text,
                    host_type : 'campaign_detail'
                }
            }).success(function(data, status) {
                if(data.msg === 'SUCCESS'){
                    $scope.comments.unshift({
                        'host_id' : data.comment.host_id,
                        'content' : data.comment.content,
                        'create_date' : data.comment.create_date,
                        'poster' : data.comment.poster,
                        'host_type' : data.comment.host_type
                    });
                    $scope.new_comment.text='';
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
    $scope.joinCampaign = function () {
        //$rootScope.donlerAlert($scope.campaign_id);
        try {
            $http({
                method: 'post',
                url: '/campaign/joinCampaign/'+$scope.campaign_id,
                data:{
                    campaign_id : $scope.campaign_id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    //alert('成功加入该活动!');
                    //$rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN_CAMPAIGN_SUCCESS);
                    $scope.join = 1;
                    if($scope.role==='HR'|| $scope.role ==='LEADER'){
                        for(var i = 0;i < $scope.member_quit.length; i ++) {
                            if($scope.member_quit[i].nickname === data.member.nickname) {
                                $scope.member_quit.splice(i,1);
                                break;
                            }
                        }
                    }

                    $scope.member.push({
                        'nickname' : data.member.nickname,
                        'photo' : data.member.photo
                    });
                }
                else{
                    alertify.alert('DATA ERROR');
                }
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
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
                url: '/campaign/quitCampaign/'+$scope.campaign_id,
                data:{
                    campaign_id : $scope.campaign_id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    //$rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT_CAMPAIGN_SUCCESS);
                    //alert('您已退出该活动!');
                    $scope.join = -1;

                        for(var i = 0;i < $scope.member.length; i ++) {
                            if($scope.member[i].nickname === data.member.nickname) {
                                $scope.member.splice(i,1);
                                break;
                            }
                        }

                    if($scope.role==='HR'|| $scope.role ==='LEADER'){
                        $scope.member_quit.push({
                            'nickname' : data.member.nickname,
                            'photo' : data.member.photo
                        });
                    }
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
    };


    $scope.modalPerticipator = function(){
        $('#sponsorMessageCampaignModel').modal();
    }
    $scope.sendToParticipator = function(){
        try{
          $http({
              method: 'post',
              url: '/message/push/campaign',
              data:{
                  campaign_id : $scope.campaign_id,
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
              alertify.alert('DATA ERROR');
          });
        }
        catch(e){
            console.log(e);
        }
    }
}]);