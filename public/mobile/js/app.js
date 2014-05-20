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
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })

    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl'
    })

    .state('app.search', {
      url: "/search",
      views: {
        'menuContent' :{
          templateUrl: "templates/search.html"
        }
      }
    })

    .state('app.browse', {
      url: "/browse",
      views: {
        'menuContent' :{
          templateUrl: "templates/browse.html"
        }
      }
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

    .state('app.single', {
      url: "/playlists/:playlistId",
      views: {
        'menuContent' :{
          templateUrl: "templates/playlist.html",
          controller: 'PlaylistCtrl'
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/campaign_list');

})


.factory('Authorize', function($state, $http) {


  /**
   * 是否经过授权
   * @property authorize
   * @type Boolean
   * @default false
   */
  var authorize = false;

  var Authorize = function() {
    if (authorize === false) {
      $state.go('login');
      return false;
    } else {
      return true;
    }
  }

  var Login = function($scope) {
    return function(username, password) {
      $http.post('/users/login', { username: username, password: password }).
        success(function(data, status, headers, config) {
          if (data.result === 1) {
            console.log('r');
            authorize = true;
            var userInfo = data.data;
            if (userInfo) {
              window.localStorage.setItem('nickname', userInfo.nickname);
              window.localStorage.setItem('_id', userInfo._id);
            }
            $state.go('app.campaignList');
          }
        }).
        error(function(data, status, headers, config) {
          if (status === 401) {
            $scope.loginMsg = '用户名或密码错误';
          }
        });
    };
  };

  var Logout = function() {
    $http.get('/users/logout').
      success(function(data, status, headers, config) {
        if (data.result === 1) {
          authorize = false;
          $state.go('login');
        }
      }
    );
  };

  return {
    Authorize: Authorize,
    Login: Login,
    Logout: Logout
  };

});

