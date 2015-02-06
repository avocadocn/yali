define(['app'], function (app) {
  return app.config([
    '$httpProvider',
    '$urlRouterProvider',
    '$stateProvider',
    function ($httpProvider, $urlRouterProvider, $stateProvider) {

      $httpProvider.interceptors.push('unAuthRedirectService');

      var templateUrl = function (url) {
        var baseUrl = '/company/manager/templates';
        return baseUrl + url;
      };

      $urlRouterProvider
        .when('', '/');

      $stateProvider
        .state('home', {
          url: '/'
        })
        .state('login', {
          url: '/login',
          templateUrl: '/company/manager/login.html',
          controller: 'account.loginCtrl'
        })
        .state('statistics', {
          url: '/statistics',
          views: {
            content: {
              templateUrl: templateUrl('/views/statistics.html')
            }
          }
        })
        .state('companyInfo', {
          url: '/company/info',
          views: {
            content: {
              templateUrl: templateUrl('/views/edit_info.html'),
              controller: 'company.editCtrl'
            }
          }
        })
        .state('accountSetting', {
          url: '/account',
          views: {
            content: {
              templateUrl: templateUrl('/views/account_settings.html'),
              controller: 'account.settingCtrl'
            }
          }
        })
        .state('teamList', {
          url: '/team/list',
          views: {
            content: {
              templateUrl: templateUrl('/views/team_list.html'),
              controller: 'team.listCtrl'
            }
          }
        })
        .state('createTeam', {
          url: '/team/create',
          views: {
            content: {
              templateUrl: templateUrl('/views/team_create.html'),
              controller: 'team.createCtrl'
            }
          }
        })
        .state('pointTeamLeader', {
          url: '/team/pointLeader/:teamId',
          views: {
            content: {
              templateUrl: templateUrl('/views/point_leader.html'),
              controller: 'team.pointLeaderCtrl'
            }
          }
        });
    }
  ])
    .constant('apiBaseUrl', 'http://localhost:3002');
});