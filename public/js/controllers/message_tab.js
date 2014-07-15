var messageApp = angular.module('mean.main');
messageApp.config(['$routeProvider', '$locationProvider',
  function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/message_private', {
        templateUrl: '/message/private',
        controller: 'messagePrivateController',
        controllerAs: 'private'
      })
      .when('/message_team', {
        templateUrl: '/message/team',
        controller: 'messageTeamController',
        controllerAs: 'team'
      })
      .when('/message_company', {
        templateUrl: '/message/company',
        controller: 'messageCompanyController',
        controllerAs: 'company'
      }).
      // .when('/system', {
      //   templateUrl: '/message/system',
      //   controller: 'messageGlobalController',
      //   controllerAs: 'system'
      // }).
      otherwise({
        redirectTo: '/message/private'
      });
}]);