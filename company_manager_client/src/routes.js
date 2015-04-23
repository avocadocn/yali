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
        .state('manager', {
          abstract: true,
          url: '',
          templateUrl: templateUrl('/views/manager_layout.html'),
          controller: 'layout.adminLTECtrl'
        })
        .state('manager.home', {
          url: '/home',
          templateUrl: templateUrl('/views/home.html'),
          controller: 'company.homeCtrl'
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
        .state('manager.companyInfo', {
          url: '/company/info',
          templateUrl: templateUrl('/views/edit_info.html'),
          controller: 'company.editCtrl'
        })
        .state('manager.accountSetting', {
          url: '/account',
          templateUrl: templateUrl('/views/account_settings.html'),
          controller: 'account.settingCtrl'
        })
        .state('manager.teamList', {
          url: '/team/list',
          templateUrl: templateUrl('/views/team_list.html'),
          controller: 'team.listCtrl'
        })
        .state('manager.createTeam', {
          url: '/team/create',
          templateUrl: templateUrl('/views/team_create.html'),
          controller: 'team.createCtrl'
        })
        .state('manager.editTeam', {
          url: '/team/edit/:teamId',
          templateUrl: templateUrl('/views/team_edit.html'),
          controller: 'team.editCtrl'
        })
        .state('manager.pointTeamLeader', {
          url: '/team/pointLeader/:teamId',
          templateUrl: templateUrl('/views/point_leader.html'),
          controller: 'team.pointLeaderCtrl'
        })
        .state('manager.createCampaign', {
          url: '/campaigns/create',
          templateUrl: templateUrl('/views/create_campaign.html'),
          controller: 'campaign.createCampaignCtrl',
          resolve: {
            teamList: ['teamService', 'initData', function(teamService, initData) {
              return teamService.getList(initData.company._id).then(function(res) {
                return res.data;
              });
            }]
          }
        })
        .state('manager.campaigns', {
          url: '/campaigns',
          templateUrl: templateUrl('/views/campaigns.html'),
          controller: 'campaign.campaignCtrl'
        })
        .state('manager.campaignsCanlendar', {
          url: '/campaignsCanlendar',
          templateUrl: templateUrl('/views/campaigns-canlendar.html'),
          controller: 'campaign.campaignCtrl'
        })
        .state('manager.inviteMembers', {
          url: '/members/invite',
          templateUrl: templateUrl('/views/members_invite.html'),
          controller: 'member.inviteCtrl'
        })
        .state('manager.activeMembers', {
          url: '/members/active',
          templateUrl: templateUrl('/views/members_active.html'),
          controller: 'member.activeCtrl'
        })
        .state('manager.inactiveMembers', {
          url: '/members/inactive',
          templateUrl: templateUrl('/views/members_inactive.html'),
          controller: 'member.inactiveCtrl'
        })
        .state('manager.allMembers', {
          url: '/members/all',
          templateUrl: templateUrl('/views/members_all.html'),
          controller: 'member.allCtrl'
        })
        .state('manager.batchImport', {
          url: '/members/batchImport',
          templateUrl: templateUrl('/views/members_batchimport.html'),
          controller: 'member.batchImport'
        })
        .state('manager.departments', {
          url: '/departments',
          templateUrl: templateUrl('/views/department.html'),
          controller: 'department.managerCtrl'
        });
    }
  ]);
});

