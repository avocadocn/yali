'use strict';

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
      $http.post('/users/login', { username: username, password: password })
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
    $http.get('/users/logout')
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

  // callback(campaign_list)
  var getUserCampaigns = function(callback) {
    $http.get('/users/campaigns').
      success(function(data, status, headers, config) {
        callback(data.data);
      }
    );
  };

  // callback(campaign_list)
  var getGroupCampaigns = function(group_id, callback) {
    $http.get('/group/' + group_id + '/campaigns').
      success(function(data, status, headers, config) {
        callback(data.data);
      }
    );
  };

  var join = function(callback) {
    return function(id) {
      $http.post('/users/joinCampaign', { campaign_id: id }).
        success(function(data, status, headers, config) {
          callback();
        }
      );
    };
  };

  var quit = function(callback) {
    return function(id) {
      $http.post('/users/quitCampaign', { campaign_id: id }).
        success(function(data, status, headers, config) {
          callback();
        }
      );
    };
  };

  return {
    getUserCampaigns: getUserCampaigns,
    getGroupCampaigns: getGroupCampaigns,
    join: join,
    quit: quit
  };

})












.factory('Schedule', function($http) {

  var getSchedules = function(callback) {
    $http.get('/users/schedules').
      success(function(data, status, headers, config) {
        callback(data.data);
      }
    );
  };

  var quit = function(callback) {
    return function(id) {
      $http.post('/users/quitCampaign', { campaign_id: id }).
        success(function(data, status, headers, config) {
          callback();
        }
      );
    };
  };

  return {
    getSchedules: getSchedules,
    quit: quit
  };

})
















.factory('Dynamic', function($http) {

  var getDynamics = function(callback) {
    $http.get('/users/getGroupMessages').
      success(function(data, status, headers, config) {
        callback(data.group_messages);
      }
    );
  };

  var vote = function(dynamic_list, callback) {
    return function(provoke_dynamic_id, status, index) {
      $http.post('/users/vote', {
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
    $http.get('/users/groups').
      success(function(data, status, headers, config) {
        callback(data.joined_groups, data.unjoin_groups);
      }
    );
  };

  return {
    getGroups: getGroups
  };


})













.factory('PhotoAlbum', function($http) {

  // callback(photos)
  var getPhotoList = function(photo_album_id, callback) {
    $http.get('/photoAlbum/' + photo_album_id + '/photolist')
    .success(function(data, status) {
      callback(data.data);
    });
  };



  return {
    getPhotoList: getPhotoList
  };

})
















.factory('GetUserInfo', function($http) {
  return function(_id, callback) {
    $http.post('/users/info', { _id: _id })
    .success(function(data, status, headers, config) {
      if (data.result === 1) {
        callback(data.user);
      }
    });
  };
});


