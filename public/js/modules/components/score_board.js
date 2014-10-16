'use strict';

angular.module('donler.components.scoreBoard', [])

  .controller('ScoreBoardCtrl', ['$scope', 'ScoreBoard', function ($scope, ScoreBoard) {

    ScoreBoard.getData($scope.componentId, function (err, scoreBoardData) {
      if (err) {
        // todo 这不是一个好的做法，alertify并非是此模块的依赖项
        alertify.alert(err);
      } else {
        $scope.scoreBoard = scoreBoardData;
        $scope.scores = [$scope.scoreBoard.playingTeams[0].score, $scope.scoreBoard.playingTeams[1].score];
      }
    });

    $scope.editing = false;

    $scope.editScore = function () {
      $scope.editing = true;
    };

    $scope.setScore = function () {
      ScoreBoard.setScore($scope.componentId, $scope.scores, function (err) {
        if (err) {
          alertify.alert(err);
        } else {
          $scope.editing = false;
          $scope.scoreBoard.playingTeams[0].score = $scope.scores[0];
          $scope.scoreBoard.playingTeams[1].score = $scope.scores[1];
        }
      });
    };

    $scope.confirmScore = function () {
      ScoreBoard.confirmScore($scope.componentId, function (err) {
        if (err) {
          alertify.alert(err);
        } else {
          $scope.scoreBoard.allConfirm = true;
        }
      });
    };

  }])

  .factory('ScoreBoard', ['$http', function ($http) {
    return {

      /**
       * 获取比分组件的数据
       * @param id 组件id
       * @param callback 成功或失败后的回调函数，形式为callback(err, componentData)
       */
      getData: function (id, callback) {
        $http.get('/components/ScoreBoard/id/' + id)
          .success(function (data) {
            if (data.result === 1) {
              callback(null, data.componentData);
            } else {
              callback('获取比分失败，请刷新页面重试');
            }
          })
          .error(function (data, status) {
            callback('获取比分失败，请刷新页面重试');
          });
      },

      /**
       * 设置比分
       * @param id 组件id
       * @param scores 比分数组，数组长度为2且元素均为数字
       * @param callback callback(err)
       */
      setScore: function (id, scores, callback) {
        $http.post('/components/ScoreBoard/id/' + id + '/setScore', {
          scores: scores
        })
          .success(function (data, status) {
            if (data.result === 1) {
              callback();
            } else {
              callback(data.msg);
            }
          })
          .error(function (data, status) {
            callback('设置失败');
          });
      },

      /**
       * 确认比分
       * @param id 组件id
       * @param callback callback(err)
       */
      confirmScore: function (id, callback) {
        $http.post('/components/ScoreBoard/id/' + id + '/confirmScore')
          .success(function (data, status) {
            if (data.result === 1) {
              callback();
            } else {
              callback(data.msg);
            }
          })
          .error(function (data, status) {
            callback('操作失败，请重试。这可能是由于网络原因导致的。')
          });
      }

    };
  }])

  .directive('scoreBoard', function () {
    return {
      restrict: 'E',
      replace: true,
      controller: 'ScoreBoardCtrl',
      templateUrl: '/components/ScoreBoard/template',
      scope: {
        componentId: '@',
        allowEdit: '@'
      }
    }
  })