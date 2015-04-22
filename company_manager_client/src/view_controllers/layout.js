define(['angular', 'theme/admin_lte', 'jQuery', 'uiRouter'], function(angular, adminLTE, $) {
  'use strict';

  return angular.module('layoutCtrls', ['ui.router'])
    .controller('layout.adminLTECtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
      setTimeout(adminLTE);

      $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        if (toState.name.indexOf('manager.') !== -1) {
          setTimeout(function() {
            var contentWrapperEle = $('.content-wrapper');
            $.AdminLTE.layout.fix();
          });
        }
      });
    }]);

});