define(['angular', 'theme/admin_lte', 'jQuery', 'uiRouter'], function(angular, adminLTE, $) {
  'use strict';

  return angular.module('layoutCtrls', ['ui.router'])
    .controller('layout.adminLTECtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
      setTimeout(adminLTE);

      var isManagerState = function(state) {
        return (state.name.indexOf('manager.') !== -1);
      };

      $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        if (isManagerState(toState)) {
          $rootScope.isLoading = true;
        }
      });

      $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        if (isManagerState(toState)) {
          setTimeout(function() {
            $.AdminLTE.layout.fix();
            $rootScope.isLoading = false;
            $rootScope.$digest();
          });
        }
      });
    }]);

});