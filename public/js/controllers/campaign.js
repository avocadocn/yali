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
campaignApp.controller('campaignController', ['$scope', '$http','$rootScope', 'Comment', function ($scope, $http, $rootScope, Comment) {
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

    $scope.deleteComment = function(index){
        try {
            $http({
                method: 'post',
                url: '/comment/delete/delete/'+$scope.comments[index]._id,
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

    var campaign_data = $('#campaign_data');
    var cbox = new Comment.CommentBox({
        host_type: 'campaign',
        host_id: campaign_data.data('hostId'),
        photo_album_id: campaign_data.data('photoAlbumId')
    });
    $scope.uploader = cbox.uploader;

    $scope.new_comment = {
        text: ''
    };
    $scope.publish = function (content) {
        cbox.publish(content, function (err, comment) {
            if (err) {
                console.log(err);
            } else {
                $scope.comments.unshift({
                    '_id':comment._id,
                    'host_id' : comment.host_id,
                    'content' : comment.content,
                    'create_date' : comment.create_date,
                    'poster' : comment.poster,
                    'photos': comment.photos,
                    'host_type' : comment.host_type,
                    'delete_permission':true
                });
                $scope.new_comment.text = '';
            }

        });
    };

    var getReplies = function (comment) {
        Comment.getReplies(comment._id, function (err, replies) {
            comment.replies = replies;
            comment.reply_count = replies.length;
        });
    };

    $scope.last_reply_comment;
    $scope.toggleComment = function (comment) {
        if ($scope.last_reply_comment && $scope.last_reply_comment != comment) {
            $scope.last_reply_comment.replying = false;
        }
        comment.replying = !comment.replying;
        $scope.last_reply_comment = comment;
        if (comment.replying) {
            getReplies(comment);
            $scope.now_reply_to = {
                _id: comment.poster._id,
                nickname: comment.poster.nickname
            };
        }
    };

    $scope.setReplyTo = function (comment, to, nickname) {
        if ($scope.last_reply_comment != comment) {
            $scope.last_reply_comment.replying = false;
            $scope.last_reply_comment = comment;
        }
        if (!comment.replying) {
            comment.replying = true;
        }
        $scope.now_reply_to = {
            _id: to,
            nickname: nickname
        };
    };
    $scope.reply = function (comment, form) {
        if (!comment.new_reply || comment.new_reply === '') return;
        Comment.reply(comment._id, $scope.now_reply_to._id, comment.new_reply, function (err, reply) {
            if (err) {
                // TO DO
            } else {
                if (!comment.replies) {
                    comment.replies = [];
                }
                comment.replies.push(reply);
                comment.new_reply = "";
                comment.reply_count++;
                form.$setPristine();
            }
        });
    };

    

}]);