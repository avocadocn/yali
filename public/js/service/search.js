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
     * @param pageNum 页数
     * @param homecourtIndex 主场index
     * @param {Object} callback callback(status,data)
     */
    var searchNearby = function (tid, pageNum, homecourtIndex, callback) {
      try {
        $http.get('/search/nearbyTeam/'+tid+'?page='+pageNum+'&index='+homecourtIndex)
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
    };
    /**
     * 关键字查找
     * @param String tid 小队id
     * @param String keyword 关键词
     * @param pageNum 页数
     * @param {Object} callback callback(status,data)
     */
    var searchTeam = function(tid,keyword,pageNum,callback) {
      $http.get('/search/keywordSearch/'+tid+'?key='+keyword+'&page='+pageNum)
      .success(function(data,status){
        callback(null,data);
      }).error(function(data,status){
        callback('error');
      })
    };
    return {
      searchSameCity: searchSameCity,
      getOpponentInfo: getOpponentInfo,
      searchNearby: searchNearby,
      searchTeam: searchTeam
    };
  }]);