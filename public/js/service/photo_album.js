'use strict';

angular.module('donler')

.factory('PhotoAlbum', ['$http', function ($http) {

  var PhotoAlbum = function (id) {
    this.id = id;
  };

  PhotoAlbum.prototype.getInfo = function (callback) {
    $http.get('/photoAlbum/' + this.id)
    .success(function (data, status) {
      if (data.result === 1) {
        callback(null, data.data);
      } else {
        callback(data.msg);
      }
    })
    .error(function (data, status) {
      callback('error');
    });
  };

  PhotoAlbum.prototype.getPhotos = function (callback) {
    $http.get('/photoAlbum/' + this.id + '/photolist')
    .success(function (data, status) {
      if (data.result === 1) {
        callback(null, data.data);
      } else {
        callback(data.msg, []);
      }
    })
    .error(function (data, status) {
      callback('error', []);
    });
  };

  PhotoAlbum.prototype.changeName = function (callback) {
    var self = this;
    return function (name) {
      $http.put('/photoAlbum/' + self.id, {name: name})
      .success(function (data, status) {
        if (data.result === 1) {
          callback(null, data.data);
        } else {
          callback(data.msg);
        }
      })
      .error(function (data, status) {
        callback('error');
      });
    };
  };

  PhotoAlbum.prototype.delete = function (callback) {
    $http.delete('/photoAlbum/' + this.id)
    .success(function (data, status) {
      if (data.result === 1) {
        callback();
      } else {
        callback(data.msg);
      }
    })
    .error(function (data, status) {
      callback('error');
    });
  };

  return PhotoAlbum;

}]);