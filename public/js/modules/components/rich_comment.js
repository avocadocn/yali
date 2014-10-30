'use strict';

angular.module('donler.components.richComment', ['angularFileUpload'])

  .controller('RichCommentCtrl', ['$scope', '$http', '$element','$timeout', 'Comment', 'Report', 'FileUploader',
    function ($scope, $http, $element, $timeout, Comment, Report, FileUploader) {
      $scope.pages = [];
      $scope.nowPage = 0;
      $scope.showMoreComment = false;
      var CommentBox = function (args) {

        Object.defineProperty(this, 'photo_album_id', {
          set: function (value) {
            this.uploader.url = '/photoAlbum/' + value + '/photo/single';
          }
        });

        if (args) {
          this.host_type = args.host_type;
          this.host_id = args.host_id;
          this.photo_album_id = args.photo_album_id;
        }

        var uploader = new FileUploader({
          url: this.photo_album_id ? '/photoAlbum/' + this.photo_album_id + '/photo/single' : null
        });

        uploader.filters.push({
          name: 'imageFilter',
          fn: function(item, options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
          }
        });
        uploader.onAfterAddingAll = function(){
          if($scope.afterRender){
            $timeout(function () {
              $scope.afterRender();
            });
          }
        };
        this.uploader = uploader;
      };

      CommentBox.prototype.publish = function (content, callback) {
        if (!content && content === '') return;
        var self = this;
        if (self.uploader.getNotUploadedItems().length > 0) {
          if (!this.uploader.url || this.uploader.url === '') return;
          self.uploader.uploadAll();
          self.uploader.onSuccessItem = function (item, data, status, headers) {
            if($scope.afterRender){
              $timeout(function () {
                $scope.afterRender();
              });
            }
          };
          self.uploader.onCompleteAll = function () {
            Comment.publish({
              host_id: self.host_id,
              host_type: self.host_type,
              content: content
            }, function (err, comment) {
              self.uploader.clearQueue();
              callback(err, comment);
            });
          };
        } else {
          Comment.publish({
            host_id: self.host_id,
            host_type: self.host_type,
            content: content
          }, function (err, comment) {
            self.uploader.clearQueue();
            callback(err, comment);
          });
        }

      };

      var cbox = new CommentBox();
      $scope.uploader = cbox.uploader;


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
            if($scope.afterRender){
              $timeout(function () {
                $scope.afterRender();
              });
            }
          }

        });
      };
      if($scope.componentId){
        $http.get('/components/RichComment/id/' + $scope.componentId)
        .success(function (data) {
          if (data.result === 1) {
            cbox.host_type = data.componentData.hostType;
            cbox.host_id = data.componentData.hostId;
            cbox.photo_album_id = data.componentData.photoAlbumId;
            $scope.photoAlbumId = data.componentData.photoAlbumId;

            Comment.get('campaign', cbox.host_id, function (err, comments, nextStartDate) {
              if (err) {
                alertify.alert('获取评论失败，请刷新页面重试');
              } else {
                $scope.comments = comments;
                if (!$scope.pages[$scope.nowPage]) {
                  var page = {
                    nextStartDate: nextStartDate
                  };
                  if ($scope.comments[0]) {
                    page.thisStartDate = $scope.comments[0].create_date;
                  }
                  $scope.pages.push(page);
                }
                if($scope.afterRender){
                  $timeout(function () {
                    $scope.afterRender();
                  });
                }
              }
            });
          }
        })
        .error(function (data, status) {
          alertify.alert('获取评论失败，请刷新页面重试');
        });
      }


      $scope.new_comment = {
        text: ''
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
          if($scope.afterRender){
            $timeout(function () {
              $scope.afterRender();
            });
          }
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
            comment.reply_count++;
            comment.new_reply = "";
            form.$setPristine();
            if($scope.afterRender){
              $timeout(function () {
                $scope.afterRender();
              });
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
                  if($scope.afterRender){
                    $timeout(function () {
                      $scope.afterRender();
                    });
                  }
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
                if($scope.afterRender){
                  $timeout(function () {
                    $scope.afterRender();
                  });
                }
              }
            });
          }
        });
      };


      $scope.getReport = function(comment) {
        $scope.reportContent = {
          hostType: 'comment',
          hostContent: {
            _id: comment._id,
            content: comment.content,
            poster: comment.poster
          },
          reportType: ''
        }
        $('#reportModal').modal('show');
      }

      $scope.pushReport = function() {
        Report.publish($scope.reportContent, function(err, msg) {
          alertify.alert(msg);
        });
      };


      $scope.nextPage = function () {
        Comment.get('campaign', cbox.host_id, function (err, comments, nextStartDate) {
          if (err) {
            alertify.alert('获取评论失败，请刷新页面重试');
          } else {
            $scope.comments = comments;
            $scope.nowPage++;
            if (!$scope.pages[$scope.nowPage]) {
              var page = {
                thisStartDate: $scope.pages[$scope.nowPage - 1].nextStartDate,
                nextStartDate: nextStartDate
              };
              $scope.pages.push(page);
            }
          }
        }, $scope.pages[$scope.nowPage].nextStartDate);
      };

      $scope.lastPage = function () {
        Comment.get('campaign', cbox.host_id, function (err, comments) {
          if (err) {
            alertify.alert('获取评论失败，请刷新页面重试');
          } else {
            $scope.comments = comments;
            $scope.nowPage--;
          }
        }, $scope.pages[$scope.nowPage - 1].thisStartDate);
      };

      $scope.changePage = function (index) {
        Comment.get('campaign', cbox.host_id, function (err, comments) {
          if (err) {
            alertify.alert('获取评论失败，请刷新页面重试');
          } else {
            $scope.comments = comments;
            $scope.nowPage = index;
          }
        }, $scope.pages[index].thisStartDate);
      }
      $scope.showMore = function () {
        $scope.showMoreComment = true;
        if($scope.afterRender){
          $timeout(function () {
            $scope.afterRender();
          });
        }
      }
    }])

  .directive('simpleComment', function () {
    return {
      restrict: 'E',
      replace: true,
      controller: 'RichCommentCtrl',
      scope: {
        componentId: '@',
        photoAlbumId: '@',
        allowPublish: '@',
        commentNum:'@',
        afterRender:'&'
      },
      templateUrl: '/components/SimpleComment/template'
    }
  })

  .directive('richComment', function () {
    return {
      restrict: 'E',
      replace: true,
      controller: 'RichCommentCtrl',
      scope: {
        componentId: '@',
        photoAlbumId: '@',
        allowPublish: '@'
      },
      templateUrl: '/components/RichComment/template'
    }
  });



