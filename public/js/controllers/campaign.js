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
    $scope.editContentStatus =false;
    $scope.init = true;

    $scope.comments = [];

    $scope.new_comment = {
        text:''
    };
    $scope.$watch('campaign_team+campaign_id+member+user_team+role',function(){
        if($scope.init){
            if($scope.campaign_team==null){
                return;
            }
            if($scope.campaign_type == '3'){
                for(var i =0; i < $scope.campaign_team.length; i ++){
                    $scope.campaign_team[i].join_member = [];
                    for(var j = 0; j < $scope.member.length; j ++){
                        if($scope.member[j].team){
                            if($scope.campaign_team[i]._id.toString() == $scope.member[j].team._id.toString()){
                                $scope.campaign_team[i].join_member.push({
                                    '_id' : $scope.member[j].uid,
                                    'nickname' : $scope.member[j].nickname,
                                    'photo' : $scope.member[j].photo,
                                    'team' : $scope.member[j].team
                                });
                            }
                        }
                    }
                    for(var k = 0; k < $scope.user_team.length; k ++){
                        if($scope.user_team[k]._id.toString() == $scope.campaign_team[i]._id.toString()){
                            $scope.campaign_team[i].leader = $scope.user_team[k].leader;
                            break;
                        }
                    }
                }
            }
        }
    });
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
                }
                $scope.user = data.user;
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
                    comment_id : $scope.comments[index]._id
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
                        '_id':data.comment._id,
                        'host_id' : data.comment.host_id,
                        'content' : data.comment.content,
                        'create_date' : data.comment.create_date,
                        'poster' : data.comment.poster,
                        'host_type' : data.comment.host_type,
                        'delete_permission':true
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
    $scope.select_index = -1;
    $scope.selcetJoinTeam = function(index){
        $scope.join_team = {
            _id : $scope.join_teams[index]._id,
            name : $scope.join_teams[index].name,
            logo : $scope.join_teams[index].logo
        };
        $scope.join_teams[index].selected = true;
        for(var i = 0 ; i < $scope.join_teams.length; i ++){
            if(i !== index){
                $scope.join_teams[i].selected = false;
            }
        }
        $scope.select_index = index;
    }
    $scope.joinReady = function(){
        $scope.join_teams = [];
        for(var i = 0; i < $scope.user_team.length; i ++){
            for(var j = 0; j < $scope.campaign_team.length; j ++){
                if($scope.campaign_team[j]._id.toString() === $scope.user_team[i]._id.toString()){
                    $scope.join_teams.push({
                        _id:$scope.user_team[i]._id,
                        name:$scope.user_team[i].name,
                        logo:$scope.user_team[i].logo
                    });
                    break;
                }
            }
        }
        if($scope.join_teams.length > 1 && $scope.campaign_type === '3'){
            $scope.join_teams[0].selected = true;
            $scope.join_team = {
                _id : $scope.join_teams[0]._id,
                name : $scope.join_teams[0].name,
                logo : $scope.join_teams[0].logo
            };
            $('#joinTeamSelectmodal').modal();
        }else{
            if($scope.campaign_type != '1'){
                $scope.join_team = {
                    _id : $scope.join_teams[0]._id,
                    name : $scope.join_teams[0].name,
                    logo : $scope.join_teams[0].logo
                };
            }else{
                $scope.join_team = null;
            }
            $scope.joinCampaign();
        }
    }
    $scope.joinCampaign = function () {
        //$rootScope.donlerAlert($scope.campaign_id);
        try {
            $http({
                method: 'post',
                url: '/campaign/joinCampaign/'+$scope.campaign_id,
                data:{
                    campaign_id : $scope.campaign_id,
                    join_team : $scope.join_team
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
                        '_id' : data.member._id,
                        'nickname' : data.member.nickname,
                        'photo' : data.member.photo,
                        'team' : data.member.team
                    });

                    if($scope.campaign_type == '3'){
                        for(var i =0; i < $scope.campaign_team.length; i ++){
                            if($scope.campaign_team[i]._id.toString() == data.member.team._id.toString()){
                                $scope.campaign_team[i].join_member.push({
                                    'tt' :data.member.uid,
                                    '_id' : data.member.uid,
                                    'nickname' : data.member.nickname,
                                    'photo' : data.member.photo,
                                    'team' : data.member.team
                                });
                                // console.log($scope.campaign_team[i].join_member);
                                break;
                            }
                        }
                    }
                    // console.log($scope.campaign_team);
                }
                else{
                    alertify.alert('DATA ERROR');
                }
                $scope.init = false;
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

                    if($scope.campaign_type == '3'){
                        for(var i = 0;i < $scope.campaign_team.length; i ++){
                            console.log($scope.campaign_team[i].join_member,data.member.uid.toString());
                            for(var j = 0; j < $scope.campaign_team[i].join_member.length; j++){
                                if($scope.campaign_team[i].join_member[j]._id.toString() == data.member.uid.toString()){
                                    $scope.campaign_team[i].join_member.splice(j,1);
                                    break;
                                }
                            }
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


    $scope.modalPerticipator = function(index){
        $scope.team_index = index;
        $('#sponsorMessageCampaignModel').modal();
    }
    $scope.sendToParticipator = function(){
        try{
          $http({
              method: 'post',
              url: '/message/push/campaign',
              data:{
                    team : $scope.campaign_team[$scope.team_index],
                    campaign_id : $scope.campaign_id,
                    content : $scope.private_message_content.text
              }
          }).success(function(data, status) {
              if(data.msg === 'SUCCESS'){
                $scope.private_message_content.text = "";


                if($scope.campaign_type == '3'){
                    for(var k = 0; k < $scope.user_team.length; k ++){
                        if($scope.user_team[k]._id.toString() == $scope.campaign_team[$scope.team_index]._id.toString()){
                            $scope.campaign_team[$scope.team_index].leader = $scope.user_team[k].leader;
                            $rootScope.team_length++;
                            $rootScope.o ++;
                            break;
                        }
                    }
                }else{
                    $rootScope.team_length++;
                    $rootScope.o ++;
                }
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
}]);