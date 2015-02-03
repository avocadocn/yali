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
        .state('companyInfo', {
          url: '/company/info',
          views: {
            content: {
              templateUrl: templateUrl('/company/edit_info.html'),
              controller: 'company.editCtrl'
            }
          }
        });
    }
  ])
    .constant('apiBaseUrl', 'http://localhost:3002');
});