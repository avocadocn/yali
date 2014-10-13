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
    var page_size = 20;
    $scope.private_message_content = {
        'text':""
    };
    $scope.pages = [];
    $scope.now_page = 0;
    $scope.$watch('campaign_id',function(campaign){
        if(campaign==null){
            return;
        }
        Comment.get('campaign', $scope.campaign_id, function (err, comments, has_next) {
            if (err) {
                alertify.alert('获取评论失败，请刷新页面重试');
            } else {
                if(comments.length > 0){
                    $scope.comments = comments;
                    var page = {
                        has_next: has_next
                    };
                    if (has_next === true) {
                        page.next_create_date = comments[comments.length - 1].create_date;
                    }
                    $scope.pages.push(page);
                }
            }
        });

    });

    $scope.nextPage = function () {
        Comment.get('campaign', $scope.campaign_id, function (err, comments, has_next) {
            if (err) {
                alertify.alert('获取评论失败，请刷新页面重试');
            } else {
                $scope.comments = comments;
                $scope.now_page++;
                if (!$scope.pages[$scope.now_page]) {
                    var page = {
                        has_next: has_next
                    };
                    page.this_create_date = $scope.pages[$scope.now_page - 1].next_create_date;
                    if (has_next === true) {
                        page.next_create_date = comments[comments.length - 1].create_date;
                    }
                    $scope.pages.push(page);
                }
            }
        }, $scope.pages[$scope.now_page].next_create_date);
    };

    $scope.lastPage = function () {
        Comment.get('campaign', $scope.campaign_id, function (err, comments) {
            if (err) {
                alertify.alert('获取评论失败，请刷新页面重试');
            } else {
                $scope.comments = comments;
                $scope.now_page--;
            }
        }, $scope.pages[$scope.now_page - 1].this_create_date);
    };

    $scope.changePage = function (index) {
        Comment.get('campaign', $scope.campaign_id, function (err, comments) {
            if (err) {
                alertify.alert('获取评论失败，请刷新页面重试');
            } else {
                $scope.comments = comments;
                $scope.now_page = index;
            }
        }, $scope.pages[index].this_create_date);
    }

    $scope.editContentStatus =false;

    $scope.comments = [];
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

    $scope.deleteComment = function (index) {
        alertify.confirm('确认要删除该评论吗？',function (e) {
            if(e){
                try {
                    Comment.remove($scope.comments[index]._id, function (err) {
                        if (err) {
                            alertify.alert('删除失败，请重试。');
                        } else {
                            $scope.comments.splice(index,1);
                        }
                    });
                }
                catch(e) {
                    console.log(e);
                }
            }
        });
    };

    $scope.removeReply = function (comment, index) {
        alertify.confirm('确认要删除该回复吗？', function (e) {
            if (e) {
                var reply = comment.replies[index];
                Comment.remove(reply._id, function (err) {
                    if (err) {
                        alertify.alert('删除失败，请重试。');
                    } else {
                        comment.replies.splice(index, 1);
                        comment.reply_count--;
                    }
                });
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

    $scope.getReport = function(index){
        $scope.reportContent = {
            hostType: 'comment',
            hostContent:{
                _id:$scope.comments[index]._id,
                content:$scope.comments[index].content,
                poster:$scope.comments[index].poster
            },
            reportType:''
        }
        $('#reportModal').modal('show');
    }
    $scope.pushReport = function(){
        Report.publish($scope.reportContent,function(err,msg){
            alertify.alert(msg);
        });
    }
}]);