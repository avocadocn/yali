'use strict';

angular.module('donler.components.rich_comment', ['angularFileUpload'])

  .controller('RichCommentCtrl', ['$scope', '$http', '$element', 'Comment', 'FileUploader',
    function ($scope, $http, $element, Comment, FileUploader) {

      var CommentBox = function (args) {
        this.host_type = args.host_type;
        this.host_id = args.host_id;
        this.photo_album_id = args.photo_album_id;
        var uploader = new FileUploader({
          url: '/photoAlbum/' + this.photo_album_id + '/photo/single',
          queueLimit: 9
        });

        uploader.filters.push({
          name: 'imageFilter',
          fn: function(item /*{File|FileLikeObject}*/ , options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
          }
        });
        this.uploader = uploader;
      };

      CommentBox.prototype.publish = function (content, callback) {
        if (!content && content === '') return;
        var self = this;
        if (self.uploader.getNotUploadedItems().length > 0) {
          self.upload_photos = [];
          self.uploader.uploadAll();
          self.uploader.onSuccessItem = function (item, data, status, headers) {
            self.upload_photos.push(data.photo);
          };
          self.uploader.onCompleteAll = function () {
            Comment.publish({
              host_id: self.host_id,
              host_type: self.host_type,
              content: content,
              photos: self.upload_photos
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

      var cbox = new CommentBox({
        photo_album_id: $scope.photoAlbumId
      });
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
          }

        });
      };

      $http.get('/components/RichComment/id/' + $scope.componentId)
        .success(function (data, status) {
          if (data.result === 1) {
            $scope.comments = data.componentData.comments;
            $scope.nextStartDate = data.componentData.nextStartDate;
            cbox.host_type = data.componentData.hostType;
            cbox.host_id = data.componentData.hostId;
          }
        })
        .error(function (data, status) {
          // to do: error handle
        });

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
        };
        $('#reportModal').modal('show');
      };
      $scope.pushReport = function(){
        Report.publish($scope.reportContent,function(err,msg){
          alertify.alert(msg);
        });
      }

    }])

  .factory('Comment', ['$http', 'FileUploader', function ($http, FileUploader) {

    var get = function (type, id, callback, create_date) {
      $http.post('/comment/pull/' + type + '/' + id, { create_date: create_date })
        .success(function (data, status) {
          callback(null, data.comments, data.has_next);
        })
        .error(function (data, status) {
          callback('error');
        });
    };

    var publish = function (data, callback) {
      $http.post('/comment/push/'+data.host_type+'/'+data.host_id, data)
        .success(function (data) {
          // ugly api
          if (data.msg === 'SUCCESS') {
            callback(null, data.comment);
          } else {
            callback('error');
          }
        })
        .error(function () {
          callback('error');
        });
    };

    var remove = function (comment_id, callback) {
      $http.delete('/comment/' + comment_id)
        .success(function (data) {
          if (data.result === 1) {
            callback();
          } else {
            callback('error');
          }
        })
        .error(function () {
          callback('error');
        });
    };

    var reply = function (comment_id, to, content, callback) {
      $http.post('/comment/' + comment_id + '/reply', {
        to: to,
        content: content
      }).success(function (data, status) {
        if (data.result === 1) {
          callback(null, data.reply);
        } else {
          callback('error');
        }
      }).error(function (data, status) {
        callback('error');
      });
    };

    var getReplies = function (comment_id, callback) {
      $http.get('/comment/' + comment_id + '/replies')
        .success(function (data, status) {
          if (data.result === 1) {
            callback(null, data.replies);
          } else {
            callback('error');
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    };

    return {
      get: get,
      publish: publish,
      reply: reply,
      remove: remove,
      getReplies: getReplies
    };

  }])

  .directive('richComment', function () {
    return {
      restrict: 'E',
      replace: true,
      controller: 'RichCommentCtrl',
      scope: {
        componentId: '@',
        photoAlbumId: '@',
        role: '@'
      },
      templateUrl: '/components/RichComment/template',
      link: function (scope, element, attrs, ctrl) {
        // to do


      }
    }
  })



