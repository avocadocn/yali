'use strict';

angular.module('donler.components.scoreBoard', [])

  .controller('ScoreBoardCtrl', ['$scope', '$http', function ($scope, $http) {

    $http.get('/components/ScoreBoard/id/' + $scope.componentId)
      .success(function (data) {
        if (data.result === 1) {
          // todo
        }
      })
      .error(function (data, status) {
        alertify.alert('获取比分失败，请刷新页面重试');
      });

  }])

  .directive('scoreBoard', function () {
    return {
      restrict: 'E',
      replace: true,
      controller: 'ScoreBoardCtrl',
      templateUrl: '/components/ScoreBoard/template',
      scope: {
        componentId: '@'
      }
    }
  })