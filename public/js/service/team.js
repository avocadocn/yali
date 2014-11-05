'use strict';

var donler = angular.module('donler');

donler.factory('Team', ['$http', function($http) {


  return {
    /**
     * 获取小队信息
     * @param  {String}   id       小队id
     * @param  {Function} callback callback(err, data)
     */
    getTeamInfo: function (id, callback) {
      $http.get('/group/' + id + '/info')
        .success(function (data, status) {
          if (data.result === 1) {
            callback(null, {
              team: data.team,
              allow: data.allow,
              isShowHomeCourts: data.isShowHomeCourts,
              role: data.role
            });
          } else {
            callback('error');
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    },

    /**
     * 加入小队
     * @param  {String}   id       小队id
     * @param  {Function} callback callback(err)
     */
    join: function (id, callback) {
      $http.post('/users/joinGroup', { tid: id })
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
     * 退出小队
     * @param  {String}   id       小队id
     * @param  {Function} callback callback(err)
     */
    quit: function (id, callback) {
      $http.post('/users/quitGroup', { tid: id })
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
    }


  };


}])