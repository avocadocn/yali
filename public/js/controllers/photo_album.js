'use strict';

angular.module('donler')

.controller('PhotoAlbumDetailCtrl', ['$scope', 'PhotoAlbum', 'Comment', 'FileUploader',
  function($scope, PhotoAlbum, Comment, FileUploader) {

    var data = document.getElementById('data').dataset;
    $scope.photo_album_id = data.albumId;
    var ownerModel = {
      type: data.ownerModelType,
      id: data.ownerModelId
    };

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

    var uploadedPhotos = [];
    var uploader = $scope.uploader = new FileUploader({
      url: '/photoAlbum/' + $scope.photo_album_id + '/photo/single'
    });

    uploader.denyCount = 0;

    uploader.filters.push({
      name: 'imageFilter',
      fn: function(item, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    uploader.onSuccessItem = function (item, data, status, headers) {
      uploadedPhotos.push(data.photo);
    };

    uploader.onCompleteAll = function() {
      getPhotos();
      // 上传完照片后，再发送一个文本内容为空的评论。
      Comment.publish({
        host_id: ownerModel.id,
        host_type: ownerModel.type,
        photos: uploadedPhotos,
        content: ''
      }, function (err) {
        // 不需要向用户提示失败（用户只是在上传照片，而该操作已成功，发评论失败与此无关），在控制台输出错误信息即可。
        if (err) {
          console.log(err);
        }
      });
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
]);





