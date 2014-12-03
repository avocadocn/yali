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
              role: data.role,
              is_one_button:data.is_one_button
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
     * 获取小队成员列表
     * @param  {String}   id       小队id
     * @param  {Function} callback callback(err, members)
     */
    getTeamMembers: function (id, callback) {
      $http.get('/group/' + id + '/members')
        .success(function (data, status) {
          if (data.result === 1) {
            callback(null, data.members);
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
    },

    /**
     * 激活或关闭小队
     * @param  {String} id     小队
     * @param  {Boolean} active 激活或关闭小队
     */
    active: function (id, active, callback) {
      $http.post('/group/activateGroup/' + id, { active: active })
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