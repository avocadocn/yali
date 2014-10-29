'use strict';

angular.module('donler')

  .factory('Campaign', ['$http', function ($http) {
    /**
     * 发起活动
     * @param String _url 请求的url
     * @param {Object} _data
     *  _data:{
     *    theme:String,
     *    content:String,(暂时只有挑战有)
     *    location:{
     *      name:String,
     *      coordinate:[]
     *    },
     *    start_time:Date,
     *    deadline:Date,
     *    member_min:Number,(选填)
     *    member_max:Number,(选填)
     *    deadline:Date,(选填)
     *    tags:[String](暂时只有挑战有,选填)
     *    campaign_mold: String,
     *  }
     * @param {Object} callback callback(err)
     */
    var sponsor = function (_url, _data, callback) {
      try {
        $http({
          method: 'post',
          url: _url,
          data: _data
        }).success(function (data, status) {
          callback(null,data);
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

    /**
     * 获取活动类型
     * @param String hostType 请求方 'company' or 'team'
     * @param String hostId 请求方ID (hostType为company时为0)
     * @param {Object} callback callback(err)
     */

     var getMolds = function(hostType,hostId,callback) {
      $http.get('/campaign/getMolds/'+hostType+'/'+hostId).success(function(data,status){
        if(data.result===0){
          callback(data.msg);
        }
        else{
          callback(null,data);
        }
      }).error(function(data,status){
        callback('error');
      })
     }

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

    /**
     * 编辑活动
     * @param campaignId 活动id
     * @param campaignData 活动数据
     * @param callback callback(err)
     */
    var edit = function (campaignId, campaignData, callback) {
      $http.post('/campaign/edit/' + campaignId, campaignData)
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('编辑失败，请重试。');
        });
    };

    var cancel = function (campaignId, callback) {
      $http.post('/campaign/cancel/' + campaignId)
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('关闭活动失败，请重试。');
        });
    };
    // var vote = function(campaignId, vote_status, tid, callback) {
    //      try {
    //         $http({
    //             method: 'post',
    //             url: '/campaign/vote/'+campaignId,
    //             data:{
    //                 campaignId : campaignId,
    //                 aOr : vote_status,
    //                 tid : tid
    //             }
    //         }).success(function(data, status) {
    //             if(data.result===1) {
    //               callback();
    //             } else {
    //               callback(data.msg);
    //             }
    //         }).error(function(data, status) {
    //             callback('DATA ERROR');
    //         });
    //     }
    //     catch(e) {
    //         console.log(e);
    //     }
    // };
    //应战、拒绝、取消
    var dealProvoke = function(campaignId,tid,status,callback) {
      $http({
        method: 'post',
        url: '/campaign/dealProvoke/'+campaignId,
        data:{
          tid : tid,
          responseStatus : status
        }
      }).success(function(data, status) {
        if(data.result===1) {
          callback();
        } else {
          callback(data.msg);
        }
      }).error(function(data, status) {
        callback('DATA ERROR');
      });
    };


    return {
      sponsor: sponsor,
      getTags: getTags,
      join: join,
      quit: quit,
      edit: edit,
      cancel: cancel,
      getMolds: getMolds,
      // vote: vote,
      dealProvoke: dealProvoke,
    };
  }]);