define(['angular'], function (angular) {
  return angular.module('filters', [])
    .filter("unsafe", ['$sce', function($sce) {
      return function(val) {
        return $sce.trustAsHtml(val);
      };
    }]);
});
