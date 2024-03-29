define(['angular'], function (angular) {
  return angular.module('utils', [])
    .directive('match', ['$parse', function($parse) {
      return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
          scope.$watch(function() {
            return $parse(attrs.match)(scope) === ctrl.$modelValue;
          }, function(currentValue) {
            ctrl.$setValidity('mismatch', currentValue);
          });
        }
      };
    }]);
});