'use strict';

var donler = angular.module('donler');

donler.controller('FamilyPhotoAlbumCtrl', ['$scope', function ($scope) {



}]);

donler.factory('Family', ['$http', function ($http) {

  return {

    /**
     * 获取一个小队的全家福
     * @param  {String}   id       小队的id
     * @param  {Function} callback callback(err, familyPhotos)
     */
    getFamily: function (id, callback) {
      // todo
    },

    /**
     * 选择或取消选择一张已上传的照片作为全家福
     * @param  {String}   id       小队id
     * @param  {String}   photoId  照片id
     * @param  {Function} callback callback(err)
     */
    toggleSelectFamilyPhoto: function (id, photoId, callback) {
      // todo
    },

    /**
     * 删除某张全家福照片
     * @param  {String}   id       小队id
     * @param  {String}   photoId  照片id
     * @param  {Function} callback callback(err)
     */
    deleteFamilyPhoto: function (id, photoId, callback) {
      // todo
    }


  }

}])