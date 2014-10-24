'use strict';

angular.module('donler.components.scoreBoard', [])

  .controller('ScoreBoardCtrl', ['$scope', 'ScoreBoard', function ($scope, ScoreBoard) {

    /**
     * 对于有编辑权限的用户的状态，可以是以下的值
     * 'init' 初始状态，双发都没有设置比分
     * 'waitConfirm' 等待对方确认
     * 'toConfirm' 对方已设置比分，需要我方确认
     * 'confirm' 双方已确认
     * @type {String}
     */
    $scope.leaderStatus = 'init';

    /**
     * 是否可以管理比分板
     * @type {Boolean}
     */
    $scope.allowEdit = false;

    var getScoreBoardData = function () {
      ScoreBoard.getData($scope.componentId, function (err, scoreBoardData) {
        if (err) {
          // todo 这不是一个好的做法，alertify并非是此模块的依赖项
          alertify.alert(err);
        } else {
          $scope.scoreBoard = scoreBoardData;
          $scope.scores = [];
          $scope.results = [];
          for (var i = 0; i < $scope.scoreBoard.playingTeams.length; i++) {
            var playingTeam = $scope.scoreBoard.playingTeams[i];
            $scope.scores.push(playingTeam.score);
            $scope.results.push(playingTeam.result);
            if ($scope.scoreBoard.status === 1) {
              if (playingTeam.allowEdit) {
                $scope.allowEdit = true;
                if (playingTeam.confirm) {
                  $scope.leaderStatus = 'waitConfirm';
                } else {
                  $scope.leaderStatus = 'toConfirm';
                }
              }
            } else if ($scope.scoreBoard.status === 0) {
              if (playingTeam.allowEdit) {
                $scope.allowEdit = true;
              }
            }
          }
        }
      });
    };
    getScoreBoardData();

    $scope.editing = false;

    /**
     * 设置胜负结果
     * @param {Number} result -1, 0, 1
     * @param {Number} index  0或1, $scope.results的索引
     */
    $scope.setResult = function (result, index) {
      if (index === 0) {
        // 两队胜负值的和为0
        $scope.results[0] = result;
        $scope.results[1] = 0 - result;
      } else if (index === 1) {
        $scope.results[0] = 0 - result;
        $scope.results[1] = result;
      }
    };

    $scope.toggleEdit = function () {
      $scope.editing = !$scope.editing;
    };

    var finishEdit = function () {
      $scope.editing = false;
      $scope.scoreBoard.status === 1;
      $scope.leaderStatus = 'waitConfirm';
      for (var i = 0; i < $scope.scoreBoard.playingTeams.length; i++) {
        var playingTeam = $scope.scoreBoard.playingTeams[i];
        playingTeam.score = $scope.scores[i];
        playingTeam.result = $scope.results[i];
      }
    };

    $scope.initScore = function () {
      ScoreBoard.initScore($scope.componentId, {
        scores: $scope.scores,
        results: $scope.results
      }, function (err) {
        if (err) {
          alertify.alert(err);
        } else {
          finishEdit();
        }
      })
    };

    $scope.resetScore = function () {
      ScoreBoard.resetScore($scope.componentId, {
        scores: $scope.scores,
        results: $scope.results
      }, function (err) {
        if (err) {
          alertify.alert(err);
        } else {
          finishEdit();
        }
      })
    };

    $scope.confirmScore = function () {
      var remindMsg = '提示：同意后将无法修改，确定要同意吗？';
      alertify.confirm(remindMsg, function (e) {
        if (e) {
          ScoreBoard.confirmScore($scope.componentId, function (err) {
            if (err) {
              alertify.alert(err);
            } else {
              $scope.scoreBoard.allConfirm = true;
              $scope.leaderStatus = 'confirm';
              $scope.scoreBoard.status = 2;
            }
          });
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
      },

      /**
       * 确认比分
       * @param {String} id 组件id
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
        componentId: '@'
      }
    }
  })