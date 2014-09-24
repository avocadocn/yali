'use strict';

angular.module('donler')

.controller('PhotoAlbumDetailCtrl', ['$scope', 'PhotoAlbum', 'FileUploader',
  function($scope, PhotoAlbum, FileUploader) {

    $scope.photo_album_id = window.location.pathname.match(/photoAlbum\/([\w]+)\/detailView/)[1];
    var photo_album = new PhotoAlbum($scope.photo_album_id);

    var getPhotos = function () {
      photo_album.getPhotos(function(err, photos) {
        if (!err) {
          $scope.photos = photos;
        }
      });
    };
    getPhotos();

    var getInfo = function () {
      photo_album.getInfo(function (err, photo_album) {
        if (!err) {
          $scope.photo_album_name = photo_album.name;
        }
      });
    };
    getInfo();

    $scope.changeName = photo_album.changeName(function (err, photo_album) {
      if (!err) {
        window.location.reload();
      }
    });

    $scope.deletePhotoAlbum = function() {
      alertify.set({
        buttonFocus: "none",
        labels: {
          ok: '确认删除',
          cancel: '取消'
        }
      });
      alertify.confirm('删除后不可恢复，您确定要删除该相册吗？', function (e) {
        if (e) {
          photo_album.delete(function (err) {
            if (!err) {
              window.location.href = $('#return_uri').val();
            }
          });
        }
      });

    };

    var uploader = $scope.uploader = new FileUploader({
      url: '/photoAlbum/' + $scope.photo_album_id + '/photo/single'
    });

    uploader.denyCount = 0;

    uploader.filters.push({
      name: 'imageFilter',
      fn: function(item /*{File|FileLikeObject}*/ , options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    uploader.onCompleteAll = function() {
      getPhotos();
    };

    uploader.onAfterAddingFile = function(item) {
      if (item.file.size > 5 * 1024 * 1024) {
        item.errorMsg = '文件太大，请上传小于5MB的文件';
        item.isError = true;
        item.denyUpload = true;
        uploader.denyCount += 1;
      }
    };

    uploader.onErrorItem = function(item, response, status, headers) {
      if (status === 413) {
        item.errorMsg = '文件太大，请上传小于5MB的文件';
      }
    };

    $scope.remove = function(item) {
      if (item.denyUpload) {
        uploader.denyCount -= 1;
      }
      item.remove();
    };

    $scope.removeAll = function(uploader) {
      uploader.denyCount = 0;
      uploader.clearQueue();
    };

  }
])

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

}])


.directive('ngThumb', ['$window',
  function($window) {
    var helper = {
      support: !!($window.FileReader && $window.CanvasRenderingContext2D),
      isFile: function(item) {
        return angular.isObject(item) && item instanceof $window.File;
      },
      isImage: function(file) {
        var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    };

    return {
      restrict: 'A',
      template: '<canvas/>',
      link: function(scope, element, attributes) {
        if (!helper.support) return;

        var params = scope.$eval(attributes.ngThumb);

        if (!helper.isFile(params.file)) return;
        if (!helper.isImage(params.file)) return;

        var canvas = element.find('canvas');
        var reader = new FileReader();

        reader.onload = onLoadFile;
        reader.readAsDataURL(params.file);

        function onLoadFile(event) {
          var img = new Image();
          img.onload = onLoadImage;
          img.src = event.target.result;
        }

        function onLoadImage() {
          var width = params.width || this.width / this.height * params.height;
          var height = params.height || this.height / this.width * params.width;
          canvas.attr({
            width: width,
            height: height
          });
          canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
        }
      }
    };
  }
])
