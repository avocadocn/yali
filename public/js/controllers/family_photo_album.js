'use strict';

var donler = angular.module('donler');

donler.controller('FamilyPhotoAlbumCtrl', ['$scope', 'Family', function ($scope, Family) {

  var data = document.getElementById('data').dataset;
  $scope.teamId = data.id;

  var getFamilyPhotos = function () {
    Family.getFamily(data.id, function (err, familyPhotos) {
      if (err) {
        alertify.alert('获取照片失败，请刷新页面重试。');
      } else {
        $scope.familyPhotos = familyPhotos;
      }
    });
  };
  getFamilyPhotos();

  $scope.toggleSelect = function (index) {

    Family.toggleSelectPhoto(data.id, $scope.familyPhotos[index]._id, function (err) {
      if (!err) {
        $scope.familyPhotos[index].select = !$scope.familyPhotos[index].select;
      } else {
        alertify.alert('操作失败，请重试。');
      }
    });
  };

  $scope.deletePhoto = function (index) {
    alertify.confirm('您确实要删除这张照片吗？', function (e) {
      if (e) {
        Family.deletePhoto(data.id, $scope.familyPhotos[index]._id, function (err) {
          if (!err) {
            $scope.familyPhotos.splice(index, 1);
          } else {
            alertify.alert('操作失败，请重试。');
          }
        });
      }
    });

  };

  var cropper = $('#image_cropper').cropit({
    onFileChange: function () {
      $scope.isUploading = true;
      $scope.$digest();
    },
    imageBackground: true
  });

  $scope.isUploading = false;
  var cropitImageInput = $('#cropit_image_input');
  $scope.selectPhoto = function () {
    cropitImageInput.click();
  };

  var dataURItoBlob = function(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(dataURI.split(',')[1]);
    else
      byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {
      type: mimeString
    });
  };

  $scope.uploadPhoto = function () {
    var dataURI = cropper.cropit('export', {
        type: 'image/jpeg',
        quality: 1
    });
    var fd = new FormData();
    var blob = dataURItoBlob(dataURI);
    fd.append('family', blob);
    Family.uploadPhoto(data.id, fd, function (err) {
      if (err) {
        alertify.alert('上传失败，请重试。');
      } else {
        $scope.isUploading = false;
        getFamilyPhotos();
      }
    });

  };

}]);

donler.factory('Family', ['$http', function ($http) {

  return {

    /**
     * 上传全家福照片
     * @param  {String}   id       小队id
     * @param  {Object}   fd       表单数据(FormData对象)
     * @param  {Function} callback callback(err)
     */
    uploadPhoto: function (id, fd, callback) {
      // 用angular上传文件有些困难，暂且使用jquery
      $.ajax({
        url: '/group/' + id + '/family',
        type: 'POST',
        data: fd,
        processData: false,  // 告诉jQuery不要去处理发送的数据
        contentType: false,  // 告诉jQuery不要去设置Content-Type请求头
        success: function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback(data.msg);
          }
        },
        error: function (data, status) {
          callback('error');
        }
      });
    },

    /**
     * 获取一个小队的全家福
     * @param  {String}   id       小队的id
     * @param  {Function} callback callback(err, familyPhotos)
     */
    getFamily: function (id, callback) {
      $http.get('/group/' + id + '/family')
        .success(function (data, status) {
          if (data.result === 1) {
            callback(null, data.familyPhotos);
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    },

    /**
     * 选择或取消选择一张已上传的照片作为全家福
     * @param  {String}   id       小队id
     * @param  {String}   photoId  照片id
     * @param  {Function} callback callback(err)
     */
    toggleSelectPhoto: function (id, photoId, callback) {
      $http.post('/select/group/' + id + '/family/photo/' + photoId)
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback('error');
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    },

    /**
     * 删除某张全家福照片
     * @param  {String}   id       小队id
     * @param  {String}   photoId  照片id
     * @param  {Function} callback callback(err)
     */
    deletePhoto: function (id, photoId, callback) {
      $http.delete('/group/' + id + '/family/photo/' + photoId)
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback('error');
          }
        })
        .error(function (data, status) {
          callback('error');
        })
    }


  }

}])