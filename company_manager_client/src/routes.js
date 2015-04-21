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

      $stateProvider
        .state('home', {
          url: '/',
          views: {
            content: {
              templateUrl: templateUrl('/views/home.html'),
              controller: 'company.homeCtrl'
            }
          }
        })
        .state('login', {
          url: '/login',
          templateUrl: '/company/manager/login.html',
          controller: 'account.loginCtrl'
        })
        // .state('statistics', {
        //   url: '/statistics',
        //   views: {
        //     content: {
        //       templateUrl: templateUrl('/views/statistics.html'),
        //       controller: 'statistics.chartsCtrl'
        //     }
        //   }
        // })
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
        })
        .state('campaigns', {
          url: '/campaigns',
          views: {
            content: {
              templateUrl: templateUrl('/views/campaigns.html'),
              controller: 'campaign.campaignCtrl'
            }
          }
        })
        .state('inviteMembers', {
          url: '/members/invite',
          views: {
            content: {
              templateUrl: templateUrl('/views/members_invite.html'),
              controller: 'member.inviteCtrl'
            }
          }
        })
        .state('activeMembers', {
          url: '/members/active',
          views: {
            content: {
              templateUrl: templateUrl('/views/members_active.html'),
              controller: 'member.activeCtrl'
            }
          }
        })
        .state('inactiveMembers', {
          url: '/members/inactive',
          views: {
            content: {
              templateUrl: templateUrl('/views/members_inactive.html'),
              controller: 'member.inactiveCtrl'
            }
          }
        })
        .state('allMembers', {
          url: '/members/all',
          views: {
            content: {
              templateUrl: templateUrl('/views/members_all.html'),
              controller: 'member.allCtrl'
            }
          }
        })
        .state('departments', {
          url: '/departments',
          views: {
            content: {
              templateUrl: templateUrl('/views/department.html'),
              controller: 'department.managerCtrl'
            }
          }
        });
    }
  ])
    .constant('apiBaseUrl', 'http://' + window.location.hostname + ':3002');
});