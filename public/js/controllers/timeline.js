'use strict';

var timeline = angular.module('donler');

timeline.controller('timelineController', ['$scope', '$http', '$location', '$anchorScroll', function ($scope, $http, $location, $anchorScroll) {
  $scope.nowYear='0';

  $scope.scrollTo =function(id){
    $location.hash(id);
    $anchorScroll();
  }

}]);
