'use strict';

var donler = angular.module('donler');

donler.controller('FamilyPhotoAlbumCtrl', ['$scope', 'Family', function ($scope, Family) {

  var data = document.getElementById('data').dataset;
  $scope.teamId = data.id;

  Family.getFamily(data.id, function (err, familyPhotos) {
    if (err) {
      alertify.alert('获取照片失败，请刷新页面重试。');
    } else {
      $scope.familyPhotos = familyPhotos;
    }
  });

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

  }

}]);

donler.factory('Family', ['$http', function ($http) {

  return {

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