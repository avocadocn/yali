define([
  'angular',
  'uiRouter',
  './account/module'
], function(angular) {
  return angular.module('app', [
    'ui.router',
    'account'
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