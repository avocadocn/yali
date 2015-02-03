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
          url: '/',
          views: {
            nav: {
              templateUrl: templateUrl('/nav/nav.html'),
              controller: 'nav.navCtrl'
            },
            aside: {
              templateUrl: templateUrl('/aside/aside.html')
            }
          }
        })
        .state('login', {
          url: '/login',
          templateUrl: '/company/manager/login.html',
          controller: 'account.loginCtrl'
        });
    }
  ])
    .constant('apiBaseUrl', 'http://localhost:3002');
});