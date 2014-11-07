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
    },

    /**
     * 保存小队信息
     * @param  {String}   id       小队id
     * @param  {Object}   data     {name: String, brief: String}
     * @param  {Function} callback callback(err)
     */
    saveInfo: function (id, data, callback) {
      var homecourt;
      if (data.homecourt) {
        homecourt = data.homecourt;
        for (var i = 0; i < homecourt.length; i++) {
          if (!homecourt[i].name) {
            homecourt.splice(i, 1);
          }
        }
      }
      $http.post('/group/saveInfo/' + id, {
        name: data.name,
        brief: data.brief,
        homecourt: homecourt
      })
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
    }


  };


}])