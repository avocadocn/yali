'use strict';



angular.module('starter.services', [])


.factory('Global', function() {
  var base_url = window.location.origin;
  var _user = {};


  return {
    base_url: base_url,
    user: _user
  };
})

.factory('Authorize', function($state, $http, Global) {

  var _authorize = false;


  var authorize = function() {
    if (!Global.user._id && localStorage.user_id) {
      _authorize = true;
      Global.user = {
        _id: localStorage.user_id,
        nickname: localStorage.user_nickname
      };
    }
    if (_authorize === false) {
      $state.go('login');
      return false;
    } else {
      return true;
    }
  };

  var login = function($scope) {
    return function(username, password) {
      $http.post(Global.base_url + '/users/login', { username: username, password: password })
      .success(function(data, status, headers, config) {
        if (data.result === 1) {
          _authorize = true;
          var user = data.data;
          if (user) {
            Global.user = user;
            localStorage.user_id = user._id;
            localStorage.user_nickname = user.nickname;
          }
          $state.go('app.campaignList');
        }
      })
      .error(function(data, status, headers, config) {
        if (status === 401) {
          $scope.loginMsg = '用户名或密码错误';
        }
      });
    };
  };

  var logout = function() {
    $http.get(Global.base_url + '/users/logout')
    .success(function(data, status, headers, config) {
      if (data.result === 1) {
        _authorize = false;
        Global.user = {};
        delete localStorage.user_id;
        delete localStorage.user_nickname;
        $state.go('login');
      }
    });
  };

  return {
    authorize: authorize,
    login: login,
    logout: logout
  };

})


.factory('Campaign', function($http, Global) {

  var campaign_list = [];

  var getCampaignList = function() {
    return campaign_list;
  };

  // callback(campaign)
  var getCampaign = function(id, callback) {
    $http.get(Global.base_url + '/campaign/getCampaigns/' + id)
    .success(function(data, status) {
      var campaign = data.campaign;
      console.log(campaign)
      for (var i = 0; i < campaign_list.length; i++) {
        if (campaign_list[i]._id === id) {
          campaign_list[i] = campaign;
          break;
        }
      }
      if (callback) {
        callback(campaign);
      }
    });
  };

  // callback(campaign_list)
  var getUserCampaigns = function(callback) {
    $http.get(Global.base_url + '/campaign/user/all/app/'+ Global.user._id)
    .success(function(data, status, headers, config) {
      campaign_list = data.campaigns;
      callback(campaign_list);
    });
  };

  // callback(campaign_list)
  var getGroupCampaigns = function(group_id, callback) {
    $http.get(Global.base_url + '/group/' + group_id + '/campaigns')
    .success(function(data, status, headers, config) {
      campaign_list = data.data;
      callback(campaign_list);
    });
  };

  // callback(id)
  var join = function(callback) {
    return function(id) {
      $http.post(Global.base_url + '/campaign/joinCampaign/'+id, { campaign_id: id })
      .success(function(data, status, headers, config) {
        callback(id);
      });
    };
  };

  // callback(id)
  var quit = function(callback) {
    return function(id) {
      $http.post(Global.base_url + '/campaign/quitCampaign/'+id, { campaign_id: id })
      .success(function(data, status, headers, config) {
        callback(id);
      });
    };
  };

  return {
    getCampaign: getCampaign,
    getCampaignList: getCampaignList,
    getUserCampaigns: getUserCampaigns,
    getGroupCampaigns: getGroupCampaigns,
    join: join,
    quit: quit
  };

})


.factory('Schedule', function($http, Global) {

  // callback(schedule_list)
  var getSchedules = function(callback) {
    $http.get(Global.base_url + '/users/schedules/' + Global.user._id)
    .success(function(data, status, headers, config) {
      callback(data.data);
    });
  };

  var quit = function(callback) {
    return function(id) {
      $http.post(Global.base_url + '/campaign/quitCampaign/'+id, { campaign_id: id })
      .success(function(data, status, headers, config) {
        callback();
      });
    };
  };

  return {
    getSchedules: getSchedules,
    quit: quit
  };

})


.factory('Dynamic', function($http, Global) {

  var getDynamics = function(callback) {
    $http.get(Global.base_url + '/groupMessage/user/' +  Global.user._id + '/0')
    .success(function(data, status, headers, config) {
      callback(data.group_messages);
    });
  };

  var getGroupDynamics = function(group_id, callback) {
    $http.get(Global.base_url + '/groupMessage/team/' + group_id + '/0')
    .success(function(data, status, headers, config) {
      if (callback) {
        callback(data.group_messages);
      }
    });
  };

  // callback(positiveCount, negativeCount)
  var vote = function(dynamic_list, callback) {
    return function(provoke_dynamic_id, status, index) {
      $http.post(Global.base_url + '/users/vote', {
          provoke_message_id: provoke_dynamic_id,
          aOr: status,
          tid: dynamic_list[index].my_team_id
        }
      ).success(function(data, status) {
        callback(data.positive, data.negative);
      });
    };
  };

  return {
    getDynamics: getDynamics,
    getGroupDynamics: getGroupDynamics,
    vote: vote
  };

})


.factory('Group', function($http, Global) {

  var joined_group_list = null,
    unjoin_group_list = null,
    group_list = [];

  var getGroups = function(callback) {
    $http.get(Global.base_url + '/users/groups/' + Global.user._id)
    .success(function(data, status, headers, config) {
      joined_group_list = data.joined_groups;
      unjoin_group_list = data.unjoin_groups;
      group_list = joined_group_list.concat(unjoin_group_list);
      callback(data.joined_groups, data.unjoin_groups);
    });
  };

  var getGroup = function(id) {
    for (var i = 0; i < group_list.length; i++) {
      if (id === group_list[i]._id) {
        return group_list[i];
      }
    }
  };

  var getJoinedGroups = function() {
    return joined_group_list;
  };

  var getUnjoinGroups = function() {
    return unjoin_group_list;
  };

  return {
    getGroups: getGroups,
    getGroup: getGroup,
    getJoinedGroups: getJoinedGroups,
    getUnjoinGroups: getUnjoinGroups
  };


})


.factory('PhotoAlbum', function($http, Global) {

  // callback(photos)
  var getPhotoList = function(photo_album_id, callback) {
    $http.get(Global.base_url + '/photoAlbum/' + photo_album_id + '/photolist')
    .success(function(data, status) {
      callback(data.data);
    });
  };


  var deletePhoto = function(photo_album_id, callback) {
    return function(photo_id) {
      $http.delete(Global.base_url + '/photoAlbum/' + photo_album_id + '/photo/' + photo_id)
      .success(function(data, status) {
        callback();
      });
    };
  };

  var commentPhoto = function(photo_album_id, callback) {
    return function(photo_id, comment) {
      $http.put(Global.base_url + '/photoAlbum/' + photo_album_id + '/photo/' + photo_id, {
        comment: comment
      })
      .success(function(data, status) {
        callback();
      });
    };
  };


  return {
    getPhotoList: getPhotoList,
    deletePhoto: deletePhoto,
    commentPhoto: commentPhoto
  };

})


.factory('Comment', function($http, Global){

  /**
   * 获取活动的评论
   * @param  {String}   id       活动id
   * @param  {Function} callback callback(comments)
   */
  var getCampaignComments = function(id, callback) {
    // why post?
    $http.post('/comment/pull/campaign/' + id, { host_id: id })
    .success(function(data, status) {
      callback(data.comments);
    });
  };

  /**
   * 发表活动的评论
   * @param  {String}   id       活动id
   * @param  {String}   comment  评论文本
   * @param  {Function} callback callback(err), 成功则err为null
   */
  var publishCampaignComment = function(id, comment, callback) {
    var post_data = {
      host_type: 'campaign',
      host_id: id,
      content: comment
    };
    $http.post('/comment/push', post_data)
    .success(function(data, status) {
      if (data.msg === 'SUCCESS') {
        callback(null);
      } else {
        callback(data.msg);
      }
    });
  };

  return {
    getCampaignComments: getCampaignComments,
    publishCampaignComment: publishCampaignComment
  };

})


.factory('User', function($http, Global) {

  // callback(user)
  var getInfo = function(user_id, callback) {
    $http.post(Global.base_url + '/users/info/'+user_id, { _id: user_id })
    .success(function(data, status, headers, config) {
      if (data.result === 1) {
        callback(data.user);
      }
    });
  };

  return {
    getInfo: getInfo
  };

})


.factory('Map', function() {

  var init = function(element_id, location) {
    var map = new BMap.Map(element_id);            // 创建Map实例
    var _address = location || '';
    var _title = location;
    var _longitude = 116.404;
    var _latitude = 39.915;
    var point = new BMap.Point(_longitude, _latitude);    // 创建点坐标
    map.centerAndZoom(point, 15);                     // 初始化地图,设置中心点坐标和地图级别。
    map.enableScrollWheelZoom();
    map.addControl(new BMap.NavigationControl({ anchor: BMAP_ANCHOR_BOTTOM_RIGHT, type: BMAP_NAVIGATION_CONTROL_ZOOM }));
    var marker = new BMap.Marker(point);  // 创建标注
    map.addOverlay(marker);              // 将标注添加到地图中
    function showInfo(e){
      var opts = {
        width : 200,     // 信息窗口宽度
        height: 60,     // 信息窗口高度
        title : _title, // 信息窗口标题
      };
      var infoWindow = new BMap.InfoWindow(_address, opts);  // 创建信息窗口对象
      map.openInfoWindow(infoWindow,point); //开启信息窗口
    }
    map.addEventListener("click", showInfo);


  };

  return {
    init: init
  };


})


.factory('Timeline', function($http, Global) {

  // callback(time_lines)
  var getUserTimeline = function(callback) {
    $http.get(Global.base_url + '/users/getTimelineForApp/'+ Global.user._id)
    .success(function(data, status) {
      callback(data.time_lines);
    });
  };


  return {
    getUserTimeline: getUserTimeline
  };



})









