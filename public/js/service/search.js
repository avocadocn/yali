'use strict';

angular.module('donler')

  .factory('Search', ['$http', function ($http) {
    /**
     * 查找同城小队
     * @param String tid 小队id
     * @param pageNum 页数
     * @param {Object} callback callback(status,data)
     */
    var searchSameCity = function (tid, pageNum, callback) {
      try {
        $http.get('/search/sameCityTeam/'+tid+'?page='+pageNum)
        .success(function (data, status) {
          callback(null,data);
        }).error(function (data, status) {
          callback('error');
        });
      }
      catch (e) {
        console.log(e);
        callback('error');
      }
    };
    /**
     * 查找附近小队
     * @param String tid 小队id
     * @param {Object} callback callback(status,data)
     */
    var getOpponentInfo = function(tid, callback) {
      $http.get('/group/opponentInfo/'+tid)
      .success(function(data,status){
        callback(null,data);
      }).error(function(data,status){
        callback('error');
      })
    }
    return {
      searchSameCity: searchSameCity,
      getOpponentInfo: getOpponentInfo
    };
  }]);