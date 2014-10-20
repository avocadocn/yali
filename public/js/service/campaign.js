'use strict';

angular.module('donler')

  .factory('Campaign', ['$http', function ($http) {
    //发起活动、挑战
    var sponsor = function (_url, _data, callback) {
      try {
        $http({
          method: 'post',
          url: _url,
          data: _data
        }).success(function (data, status) {
          callback(null);
        }).error(function (data, status) {
          callback('error');
        });
      }
      catch (e) {
        console.log(e);
      }
    };

    //获取Tags
    var getTags = function (hostType, hostId, callback) {
      $http.get('/' + hostType + '/getTags/' + hostId).success(function (data, status) {
        callback(null, data);
      }).error(function (data, status) {
        callback('error');
      });
    };

    // var provoke = function(teamId,_data,callback){
    //   $http({
    //     method: 'post',
    //     url: '/group/provoke/'+teamId,
    //     data:_data
    //   }).success(function(data, status) {
    //     callback(null);
    //   }).error(function(data, status) {
    //     callback('error');
    //   });
    // };

    /**
     * 参加活动
     * @param {Object} data
     *  data: {
     *    campaignId: String,
     *    cid: String,
     *    tid: String (是公司活动时不需要提供此属性)
     *  }
     * @param {Object} callback callback(err)
     */
    var join = function (data, callback) {
      $http.post('/campaign/joinCampaign/' + data.campaignId, {
        cid: data.cid,
        tid: data.tid
      })
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('参加失败，请重试。');
        });
    };

    /**
     * 退出活动
     * @param {String} campaignId 活动id
     * @param callback callback(err)
     */
    var quit = function (campaignId, callback) {
      $http.post('/campaign/quitCampaign/' + campaignId)
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('退出失败，请重试。');
        });
    };

    return {
      sponsor: sponsor,
      getTags: getTags,
      join: join,
      quit: quit
      // provoke:provoke
    };
  }]);