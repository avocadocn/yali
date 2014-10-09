'use strict';

angular.module('donler')

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
    .success(function (data, status) {
      // ugly api
      if (data.msg === 'SUCCESS') {
        callback(null, data.comment);
      } else {
        callback('error');
      }
    })
    .error(function (data, status) {
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
        publish({
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
      publish({
        host_id: self.host_id,
        host_type: self.host_type,
        content: content
      }, function (err, comment) {
        self.uploader.clearQueue();
        callback(err, comment);
      });
    }

  };

  return {
    get: get,
    reply: reply,
    getReplies: getReplies,
    CommentBox: CommentBox
  };

}]);