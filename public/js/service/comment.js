'use strict';

angular.module('donler')

.factory('Comment', ['$http', 'FileUploader', function ($http, FileUploader) {

  var get = function (type, id, callback) {
    $http.post('/comment/pull/' + type + '/' + id)
    .success(function (data, status) {
      callback(null, data.comments);
    })
    .error(function (data, status) {
      callback('error');
    });
  };

  var publish = function (data, callback) {
    $http.post('/comment/push', data)
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
    CommentBox: CommentBox
  };

}]);