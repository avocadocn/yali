'use strict';



var base_url = 'http://www.donler.cn:3000';




angular.module('starter.services', [])






.factory('Authorize', function($state, $http) {


  /**
   * 是否经过授权
   * @property authorize
   * @type Boolean
   * @default false
   */
  var _authorize = false;


  var authorize = function() {
    if (_authorize === false) {
      $state.go('login');
      return false;
    } else {
      return true;
    }
  };

  var login = function($scope, $rootScope) {
    return function(username, password) {
      $http.post(base_url + '/users/login', { username: username, password: password })
      .success(function(data, status, headers, config) {
        if (data.result === 1) {
          _authorize = true;
          var user_info = data.data;
          if (user_info) {
            $rootScope._id = user_info._id;
            $rootScope.nickname = user_info.nickname;
            $rootScope.role = user_info.role;
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
    $http.get(base_url + '/users/logout')
    .success(function(data, status, headers, config) {
      if (data.result === 1) {
        _authorize = false;
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














.factory('Campaign', function($http) {

  var campaign_list = [];

  var getCampaignList = function() {
    return campaign_list;
  };

  var setTime = function() {
    for (var i = 0; i < campaign_list.length; i++) {
      var start_time = new Date(campaign_list[i].start_time);
      var rest_time = start_time - new Date();
      if (rest_time >= 0) {
        campaign_list[i].rest_time = rest_time;
      } else {
        campaign_list[i].beyond_time = 0 - rest_time;
      }

    }
  };

  // callback(campaign_list)
  var getUserCampaigns = function(callback) {
    $http.get(base_url + '/users/campaigns')
    .success(function(data, status, headers, config) {
      campaign_list = data.data;
      setTime();
      callback(campaign_list);
    });
  };

  // callback(campaign_list)
  var getGroupCampaigns = function(group_id, callback) {
    $http.get(base_url + '/group/' + group_id + '/campaigns')
    .success(function(data, status, headers, config) {
      campaign_list = data.data;
      setTime();
      callback(campaign_list);
    });
  };

  var join = function(callback) {
    return function(id) {
      $http.post(base_url + '/users/joinCampaign', { campaign_id: id })
      .success(function(data, status, headers, config) {
        callback();
      });
    };
  };

  var quit = function(callback) {
    return function(id) {
      $http.post(base_url + '/users/quitCampaign', { campaign_id: id })
      .success(function(data, status, headers, config) {
        callback();
      });
    };
  };

  return {
    getCampaignList: getCampaignList,
    getUserCampaigns: getUserCampaigns,
    getGroupCampaigns: getGroupCampaigns,
    join: join,
    quit: quit
  };

})












.factory('Schedule', function($http) {

  // callback(schedule_list)
  var getSchedules = function(callback) {
    $http.get(base_url + '/users/schedules')
    .success(function(data, status, headers, config) {
      callback(data.data);
    });
  };

  var quit = function(callback) {
    return function(id) {
      $http.post(base_url + '/users/quitCampaign', { campaign_id: id })
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
















.factory('Dynamic', function($http) {

  var getDynamics = function(callback) {
    $http.get(base_url + '/users/getGroupMessages')
    .success(function(data, status, headers, config) {
      callback(data.group_messages);
    });
  };

  // callback(positiveCount, negativeCount)
  var vote = function(dynamic_list, callback) {
    return function(provoke_dynamic_id, status, index) {
      $http.post(base_url + '/users/vote', {
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
    vote: vote
  };

})












.factory('Group', function($http) {

  var getGroups = function(callback) {
    $http.get(base_url + '/users/groups')
    .success(function(data, status, headers, config) {
      callback(data.joined_groups, data.unjoin_groups);
    });
  };

  return {
    getGroups: getGroups
  };


})













.factory('PhotoAlbum', function($http) {

  // callback(photos)
  var getPhotoList = function(photo_album_id, callback) {
    $http.get(base_url + '/photoAlbum/' + photo_album_id + '/photolist')
    .success(function(data, status) {
      callback(data.data);
    });
  };


  var deletePhoto = function(photo_album_id, callback) {
    return function(photo_id) {
      $http.delete(base_url + '/photoAlbum/' + photo_album_id + '/photo/' + photo_id)
      .success(function(data, status) {
        callback();
      });
    };
  };

  var commentPhoto = function(photo_album_id, callback) {
    return function(photo_id, comment) {
      $http.put(base_url + '/photoAlbum/' + photo_album_id + '/photo/' + photo_id, {
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
















.factory('User', function($http) {

  // callback(user)
  var getInfo = function(user_id, callback) {
    $http.post(base_url + '/users/info', { _id: user_id })
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

  var map = function(element_id, location) {

    var map = new BMap.Map(element_id);            // 创建Map实例
    var _address = location || '';
    var _title = location;
    var _longitude = 116.404 ;
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
    map: map
  };


})












.factory('Timeline', function($http) {

  // callback(time_lines)
  var getUserTimeline = function(callback) {
    $http.get(base_url + '/users/getTimelineForApp')
    .success(function(data, status) {
      callback(data.time_lines);
    });
  };


  return {
    getUserTimeline: getUserTimeline
  };



})








