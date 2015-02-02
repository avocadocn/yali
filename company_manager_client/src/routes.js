define(['./app'], function (app) {
  return app.config([
    '$httpProvider',
    '$urlRouterProvider',
    '$stateProvider',
    function ($httpProvider, $urlRouterProvider, $stateProvider) {

      $httpProvider.interceptors.push('UnAuthRedirectService');

      var templateUrl = function (url) {
        var baseUrl = '/company/manager/templates';
        return baseUrl + url;
      };

      $urlRouterProvider
        .when('', '/');

      $stateProvider.state('home', {
        url: '/',
        views: {
          nav: {
            templateUrl: templateUrl('/nav/nav.html')
          },
          aside: {
            templateUrl: templateUrl('/aside/aside.html')
          }
        }
      });
    }
  ]);
});