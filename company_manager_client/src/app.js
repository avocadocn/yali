define([
  'angular',
  'uiRouter',
  'account/account'
], function(angular) {
  return angular.module('app', [
    'ui.router'
  ]).run([
    '$rootScope',
    '$state',
    '$stateParams',
    function($rootScope, $state, $stateParams) {
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
    }
  ]);
});