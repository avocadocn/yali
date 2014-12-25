//组件列表控制器
'use strict';


var groupApp = angular.module('donler');
groupApp.directive('maxHeight', function() {
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
groupApp.directive('donlerMember', ['$rootScope', function($rootScope) {
      return {
          restrict: 'A',
          link: function(scope, el, attrs, controller) {
            var _id = angular.element(el).attr('id');
            var _tid = angular.element(el).attr('data-tid');
            var _x = angular.element(el).attr('data-left');
            var _y = angular.element(el).attr('data-top');
            angular.element(el).css('left',_x+'%');
            angular.element(el).css('top',_y+'%');
            angular.element('#'+_id).attr('draggable',false);
            angular.element(el).attr('src',angular.element('#'+_id.substr(3)).attr('src'));
            if(angular.element(el).attr('x-donler-member')==="true"){
              if(!scope.competition_format[_tid]){
                scope.competition_format[_tid]={};
              }
              _id = scope.getMemberId(_id);
              scope.competition_format[_tid][_id] ={
                'x':_x,
                'y':_y
              };
            }
          }
      }
  }]);
groupApp.directive('donlerDraggable', ['$rootScope', function($rootScope) {
      return {
          restrict: 'A',
          link: function(scope, el, attrs, controller) {
            var id = angular.element(el).attr("id");
            if(angular.element('#on_'+id).length==0){
              angular.element(el).attr("draggable", "true");
            }
            el.bind("dragstart", function(e) {
              angular.element(e.target).addClass('donler_dragover');
              e.originalEvent.dataTransfer.setData("member_id",e.originalEvent.target.id);
              e.originalEvent.dataTransfer.setData("nowx",e.originalEvent.pageX);
              e.originalEvent.dataTransfer.setData("nowy",e.originalEvent.pageY);
              e.originalEvent.dataTransfer.dropEffect ='move';
              e.originalEvent.dataTransfer.setDragImage(e.originalEvent.target,20,20);
            });

            el.bind("dragend", function(e) {
              angular.element(e.target).removeClass('donler_dragover');
              var _id = e.originalEvent.target.id;
              if(_id.indexOf('on_')==0){
                var $field = angular.element('.formatField');
                var _left = $field.offset().left;
                var _top = $field.offset().top;
                var _right = _left + $field.width();
                var _bottom = _top +$field.height();
                var _nowx = e.originalEvent.pageX;
                var _nowy = e.originalEvent.pageY;
                if (_nowx < _left || _nowx > _right || _nowy > _bottom || _nowy < _top) {
                  scope.updateFormatData(_id,angular.element('#'+_id).attr('data-tid'),-1);
                  angular.element(e.originalEvent.target).remove();
                  angular.element('#'+_id.substr(3)).attr('draggable',true);
                };
              }
            });
          }
      }
  }]);

groupApp.directive('donlerDropTarget', ['$rootScope', function($rootScope) {
      return {
          restrict: 'A',
          link: function(scope, el, attrs, controller) {
              var id = angular.element(el).attr("id");

              el.bind("dragover", function(e) {
                if (e.originalEvent.preventDefault) {
                  e.originalEvent.preventDefault(); // Necessary. Allows us to drop.
                }

                e.originalEvent.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
                return false;
              });

              // el.bind("dragenter", function(e) {
              //   // this / e.target is the current hover target
              // });

              // el.bind("dragleave", function(e) {
              //   angular.element(e.target).removeClass('donler_dragover');  // this / e.target is previous target element.
              // });

              el.bind("drop", function(e) {
                if (e.originalEvent.preventDefault) {
                  e.originalEvent.preventDefault(); // Necessary. Allows us to drop.
                }

                if (e.originalEvent.stopPropagation) {
                  e.originalEvent.stopPropagation(); // Necessary. Allows us to drop.
                }
                var data=e.originalEvent.dataTransfer.getData("member_id");
                if(!data){
                  return false;
                }
                var _newEle ={};
                var _x = angular.element(e.originalEvent.target).offset().left;
                var _y = angular.element(e.originalEvent.target).offset().top;
                var _width = angular.element(e.originalEvent.target).width();
                var _height = angular.element(e.originalEvent.target).height();
                var _offsetX = e.originalEvent.pageX - _x;
                var _offsetY = e.originalEvent.pageY - _y;
                if(angular.element('#'+data).attr('data-camp')=='0'&&_offsetX > _width / 2||angular.element('#'+data).attr('data-camp')=='1'&&_offsetX < _width / 2){
                  return false;
                };
                if(data.indexOf('on_')!=0){
                  _newEle = angular.element('#'+data).clone(true);
                  _newEle.attr('id','on_'+data);
                  _newEle.css('top',_offsetY > 0 ? _offsetY-3 : 0);
                  _newEle.css('left',_offsetX > 0 ? _offsetX-3 : 0);
                  angular.element(e.originalEvent.target).append(_newEle);
                  angular.element('#'+data).attr('draggable',false);
                }
                else{
                  _newEle = angular.element('#'+data);
                  var _top= _newEle.position().top;
                  var _left= _newEle.position().left;
                  var datax=e.originalEvent.dataTransfer.getData("nowx");
                  var datay=e.originalEvent.dataTransfer.getData("nowy");
                  _offsetX = _left + e.originalEvent.pageX - datax;
                  _offsetY = _top +e.originalEvent.pageY - datay;
                  _newEle.css('top',_offsetY > 0 ? _offsetY : 0);
                  _newEle.css('left',_offsetX > 0 ? _offsetX : 0);
                };
                var _percentX = 100 * _offsetX / _width;
                var _percentY = 100 * _offsetY / _height;
                scope.updateFormatData(data,angular.element('#'+data).attr('data-tid'),_percentX.toFixed(2),_percentY.toFixed(2));
              });
          }
      }
  }]);
groupApp.controller('competitionController', ['$http', '$scope','$rootScope', 'Comment', function ($http, $scope,$rootScope, Comment) {

    $scope.private_message_content = {
      'text':""
    };
    $scope.pages = [];
    $scope.nowPage = 0;
    $scope.$watch('competition_id',function(competition_id){
        if(competition_id==null){
            return;
        }
        Comment.get('campaign', competition_id, function (err, comments, has_next) {
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
        if($scope.role==='HR'||$scope.role==='LEADER'){
          setInterval($scope.pushFormatData,3000);
        }
    });

    $scope.nextPage = function () {
        Comment.get('campaign', $scope.competition_id, function (err, comments, has_next) {
            if (err) {
                alertify.alert('获取评论失败，请刷新页面重试');
            } else {
                $scope.comments = comments;
                $scope.nowPage++;
                if (!$scope.pages[$scope.nowPage]) {
                    var page = {
                        has_next: has_next
                    };
                    page.this_create_date = $scope.pages[$scope.nowPage - 1].next_create_date;
                    if (has_next === true) {
                        page.next_create_date = comments[comments.length - 1].create_date;
                    }
                    $scope.pages.push(page);
                }
            }
        }, $scope.pages[$scope.nowPage].next_create_date);
    };

    $scope.lastPage = function () {
        Comment.get('campaign', $scope.competition_id, function (err, comments) {
            if (err) {
                alertify.alert('获取评论失败，请刷新页面重试');
            } else {
                $scope.comments = comments;
                $scope.nowPage--;
            }
        }, $scope.pages[$scope.nowPage - 1].last_create_date);
    };

    $scope.changePage = function (index) {
        Comment.get('campaign', $scope.competition_id, function (err, comments) {
            if (err) {
                alertify.alert('获取评论失败，请刷新页面重试');
            } else {
                $scope.comments = comments;
                $scope.nowPage = index;
            }
        }, $scope.pages[index].this_create_date);
    }

    $scope.updateFlag = false;
    $scope.comments = [];
    $scope.competition_format = {};
    $scope.modify_caption = "成绩确认";
    $scope.object_caption = "发出异议";
    $scope.edit = false;
    $scope.editContentStatus =false;

    $scope.modalPerticipator = function(){
        $('#sponsorMessageCampaignModel').modal();
    }
    $scope.sendToParticipator = function(){
        try{
          $http({
              method: 'post',
              url: '/message/push/campaign',
              data:{
                  campaign_id : $scope.competition_id,
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
              url: '/comment/push/campaign/'+$scope.competition_id,
              data:{
                  host_id : $scope.competition_id,
                  content : $scope.new_comment.text,
                  host_type : 'competition'
              }
          }).success(function(data, status) {
              if(data.msg === 'SUCCESS'){
                  $scope.comments.unshift({
                      '_id' : data.comment._id,
                      'host_id' : data.comment.host_id,
                      'content' : data.comment.content,
                      'create_date' : data.comment.create_date,
                      'poster' : data.comment.poster,
                      'host_type' : data.comment.host_type,
                      'index' : $scope.fixed_sum+1,
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
    $scope.tip = function(){
      var content = "";
      if($scope.confirm_mode == '3'){
        content="您可以编辑比分框里的分数,然后点击'比赛确认'按钮向对方发送待确认比分!";
      }else{
        content="您可以接受对方发来的分数,如果您对次比分有疑问,可以修改比分框里的分数,然后点击'发出异议'按钮即可!";
      }
      $("#score_tip").tooltip({
        "trigger":"hover",
        "title":content,
        "placement" : "right"
      });
    }
    // $scope.msg_show = $('#competition_data').attr('data-msg-show');
    // $scope.rst_content = $('#competition_data').attr('data-rst-content');
    // $scope.score_a = $('#competition_data').attr('data-score-a');
    // $scope.score_b = $('#competition_data').attr('data-score-b');

    //alert($scope.msg_show);
    var competition_id = $('#competition_content').attr('data-id');

    $scope.numValidate = function(){
      if(isNaN(Number($scope.score_a)) || isNaN(Number($scope.score_b))){
        alertify.alert("请输入数字!");
        $scope.score_a = 0;
        $scope.score_b = 0;
      }
      else if($scope.score_a.length>3||$scope.score_b.length>3){
        alertify.alert("分数最大长度为3!");
      }
    }

    $scope.scoreModify = function(){
      if(!$scope.edit){
        $scope.edit = true;
        $scope.modify_caption = "发送";
        $scope.object_caption = "发送";
      }else{
        $scope.modify_caption = "成绩确认";
        $scope.object_caption = "发出异议";
        $scope.confirmScore(false);
      }
    }
    $scope.confirmScore = function (confirm) {
      try {
        $http({
          method: 'post',
          url: '/competition/resultConfirm/'+competition_id,
          data:{
            score_a : $scope.score_a,
            score_b : $scope.score_b,
            rst_accept : confirm
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
    //应战
    $scope.responseProvoke = function(tid,provoke_message_id,status) {
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
                //$rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };
    //取消挑战
    $scope.cancelProvoke = function(tid,competition_id) {
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
    };
    $scope.editContent = function(){
        
        if(!$scope.editContentStatus){
            $scope.competitionContent = angular.element('#competitionContent').html();
            $scope.editContentStatus = !$scope.editContentStatus;
            var options = {
                editor: document.getElementById('competitionDetail'), // {DOM Element} [required]
                class: 'dl_markdown', // {String} class of the editor,
                textarea: '<textarea name="content" ng-model="$parent.content"></textarea>', // fallback for old browsers
                list: ['h5', 'p', 'insertorderedlist','insertunorderedlist', 'indent', 'outdent', 'bold', 'italic', 'underline'], // editor menu list
                stay: false,
                toolBarId: 'provokeDetailToolBar'
              }
            var editor = new Pen(options);
        }
        else{
            try {
                $http({
                    method: 'post',
                    url: '/campaign/edit/'+$scope.competition_id,
                    data:{
                        campaign_id : $scope.competition_id,
                        content : $scope.competitionContent
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
    $scope.joinCampaign = function (competition_id,tid) {
        //$rootScope.donlerAlert($scope.campaign_id);
        try {
            $http({
                method: 'post',
                url: '/campaign/joinCampaign/'+competition_id,
                data:{
                    campaign_id : competition_id,
                    tid:tid
                }
            }).success(function(data, status) {
                if(data.result===1){
                  window.location.reload();
                }
                else{
                    //$rootScope.donlerAlert(data.msg);
                }
            }).error(function(data, status) {
                //$rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $scope.quitCampaign = function (competition_id) {
        try {
            $http({
                method: 'post',
                url: '/campaign/quitCampaign/'+competition_id,
                data:{
                    campaign_id : competition_id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    window.location.reload();
                }
                else{
                    //$rootScope.donlerAlert(data.msg);
                }
            }).error(function(data, status) {
                //$rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };
    $scope.vote = function(competition_id, vote_status,tid) {
      try {
          $http({
              method: 'post',
              url: '/campaign/vote/'+competition_id,
              data:{
                  competition_id : competition_id,
                  aOr : vote_status,
                  tid : tid
              }
          }).success(function(data, status) {
              if(data.result===1) {
                  window.location.reload();
              }
          });
      }
      catch(e) {
          console.log(e);
      }
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
    };
    $scope.getMemberId = function(id){
      return id.substr(id.indexOf('__')+2);
    };
    $scope.updateFormatData = function(id,tid,percentX,percentY){
      id = $scope.getMemberId(id);

      if(percentX===-1){
        delete $scope.competition_format[tid][id];
        $scope.pushFormatData(tid);
      }
      else{
        if(!$scope.competition_format[tid]){
          $scope.competition_format[tid]={};
        }
        if($scope.competition_format[tid][id]){
          var nowx = $scope.competition_format[tid][id].x;
          var nowy = $scope.competition_format[tid][id].y;
        }
        $scope.competition_format[tid][id] ={
          'x':percentX,
          'y':percentY
        };
        if(!nowx || nowx&& Math.abs(nowx-percentX)>=5||nowy&& Math.abs(nowy-percentY)>=5){
          $scope.pushFormatData(tid);
        }
        else{
          $scope.updateFlag = true;
        }
      }
    };
    $scope.pushFormatData = function(_tid){
      if(_tid){
        $.post('/group/updateFormation/'+_tid+'/'+$scope.competition_id,{'formation':$scope.competition_format[_tid]},function(data,status){
          if(data.result===0){
            alertify.alert(data.msg);
          }
        });
      }
      else if($scope.updateFlag){
        for (var tid in $scope.competition_format){
          $.post('/group/updateFormation/'+tid+'/'+$scope.competition_id,{'formation':$scope.competition_format[tid]},function(data,status){
            if(data.result===0){
              alertify.alert(data.msg);
            }
          });
        }
        $scope.updateFlag=false;
      }
    }


  $scope.photos = null;

  var competition_data = $('#competition_data');
  var cbox = new Comment.CommentBox({
    host_type: 'competition',
    host_id: competition_data.data('hostId'),
    photo_album_id: competition_data.data('photoAlbumId')
  });
  $scope.uploader = cbox.uploader;

  $scope.new_comment = {
    text: ''
  };
  $scope.publish = function(content) {
    cbox.publish(content, function(err, comment) {
      if (err) {
        console.log(err);
      } else {
        $scope.comments.unshift({
          '_id': comment._id,
          'host_id': comment.host_id,
          'content': comment.content,
          'create_date': comment.create_date,
          'poster': comment.poster,
          'photos': comment.photos,
          'host_type': comment.host_type,
          'delete_permission': true
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
  $scope.toggleComment = function(comment) {
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

  $scope.setReplyTo = function(comment, to, nickname) {
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
  $scope.reply = function(comment, form) {
    if (!comment.new_reply || comment.new_reply === '') return;
    Comment.reply(comment._id, $scope.now_reply_to._id, comment.new_reply, function(err, reply) {
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