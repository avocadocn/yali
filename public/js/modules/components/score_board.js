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

    /**
     * 设置比分
     * @param id 组件id
     * @param data 比分数据
     *  data: {
     *    team: {
     *      cid: String|Object,
     *      tid: String|Object
     *    }, // 指明是以哪个队的队长身份修改，有可能会出现同时是两队队长的情况
     *    scores: [Number], // 可选
     *    results: [Number], // 可选
     *    // scores,results属性至少要有一个
     *  }
     * @param {Boolean} isInit 是否是初始化设置
     * @param callback callback(err)
     */
    var setScore = function (id, data, isInit, callback) {
      $http.post('/components/ScoreBoard/id/' + id + '/setScore', {
        data: data,
        isInit: isInit
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
    };

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

      // 初始化比分
      initScore: function (id, data, callback) {
        setScore(id, data, true, callback);
      },

      // 重设比分
      resetScore: function (id, data, callback) {
        setScore(id, data, false, callback);
      }

      /**
       * 确认比分
       * @param {String} id 组件id
       * @param callback callback(err)
       */
      confirmScore: function (id, callback) {

        var remindMsg = '提示：确认比分后将无法再修改；如果对方在您确认后修改过比分，您需要重新确认。确定要修改比分吗？';
        alertify.confirm(remindMsg, function (e) {
          if (e) {
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
        allowEdit: '='
      }
    }
  })