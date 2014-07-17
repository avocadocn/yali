var messageApp = angular.module('donler');
messageApp.config(['$routeProvider', '$locationProvider',
  function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/message_all', {
        templateUrl: '/message/all',
        controller: 'messageAllController',
        controllerAs: 'all'
      })
      .when('/send', {
        templateUrl: '/message/send',
        controller: 'messageSenderController',
        controllerAs: 'team'
      }).
      otherwise({
        redirectTo: '/message/all'
      });
}]);