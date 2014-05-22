// Ionic Starter App

angular.module('starter', ['ionic', 'starter.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'AppCtrl'
    })

    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl'
    })

    .state('app.campaignList', {
      url: '/campaign_list',
      views: {
        'menuContent': {
          templateUrl: 'templates/campaign_list.html',
          controller: 'CampaignListCtrl'
        }
      }
    })

    .state('app.scheduleList', {
      url: '/schedule_list',
      views: {
        'menuContent': {
          templateUrl: 'templates/schedule_list.html',
          controller: 'ScheduleListCtrl'
        }
      }
    })

    .state('app.dynamicList', {
      url: "/dynamic_list",
      views: {
        'menuContent': {
          templateUrl: 'templates/dynamic_list.html',
          controller: 'DynamicListCtrl'
        }
      }
    })

    .state('app.groupList', {
      url: '/group_list',
      views: {
        'menuContent': {
          templateUrl: 'templates/group_list.html',
          controller: 'GroupListCtrl'
        }
      }
    })


    .state('app.groupDetail', {
      url: '/group_detail/:group_index',
      views: {
        'menuContent': {
          templateUrl: 'templates/group_detail.html',
          controller: 'GroupDetailCtrl'
        }
      }
    })


    .state('app.userInfo', {
      url: '/user_info',
      views: {
        'menuContent': {
          templateUrl: 'templates/user_info.html',
          controller: 'UserInfoCtrl'
        }
      }
    });



  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');


})


.factory('Authorize', function($state, $http) {


  /**
   * 是否经过授权
   * @property authorize
   * @type Boolean
   * @default false
   */
  var authorize = false;

  // TO DO: for test
  //authorize = true;

  var Authorize = function() {
    if (authorize === false) {
      $state.go('login');
      return false;
    } else {
      return true;
    }
  }

  var Login = function($scope, $rootScope) {
    return function(username, password) {
      $http.post('/users/login', { username: username, password: password })
      .success(function(data, status, headers, config) {
        if (data.result === 1) {
          authorize = true;
          var user_info = data.data;
          if (user_info) {
            $rootScope._id = user_info._id;
            $rootScope.nickname = user_info.nickname;
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

  var Logout = function() {
    $http.get('/users/logout')
    .success(function(data, status, headers, config) {
      if (data.result === 1) {
        authorize = false;
        $state.go('login');
      }
    });
  };

  return {
    Authorize: Authorize,
    Login: Login,
    Logout: Logout
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

