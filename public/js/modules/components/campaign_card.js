'use strict';

angular.module('donler.components.campaignCard', [])

  .controller('CampaignCardCtrl', ['$scope', 'Campaign', function ($scope, Campaign) {
    this.join = function (cid, tid, item) {
      Campaign.join({
        campaignId: item.id,
        cid: cid,
        tid: tid
      }, function (err) {
        if (err) {
          alertify.alert('参加失败');
        } else {
          alertify.alert('参加成功');
          item.isJoin = true;
        }
      });
    };

    this.quit = function (item) {
      alertify.confirm('确定要退出该活动吗？', function (e) {
        if (e) {
          Campaign.quit(item.id, function (err) {
            if (err) {
              alertify.alert('退出失败');
            } else {
              alertify.alert('退出成功');
              item.isJoin = false;
            }
          });
        }
      });
    };

  }])
  // .directive("campaignCardContainer", function () {
  //   return {
  //     restrict: "A",
  //     scope: true,
  //     controller: function ($scope) {
  //       $scope.nowComment ='';
  //       this.changeShowComment = function(nowId) {
  //         $scope.nowComment =nowId;
  //         console.log(nowId);
  //       };
  //       this.setShowComment = function(){
  //         return $scope.nowComment;
  //       }
  //     }
  //   };
  // })
  .directive('campaignCard', function () {

    return {
      restrict: 'E',
      replace: true,
      // require: "^campaignCardContainer",
      scope: {
        item: '=',
        role:'@',
        cid: '@',
        tid: '@'
      },
      templateUrl: '/components/campaignCard/template',
      controller: 'CampaignCardCtrl',
      link: function (scope, ele, attrs, ctrl) {
        scope.join = function (cid, tid) {
          ctrl.join(cid, tid, scope.item);
        };
        scope.quit = function () {
          ctrl.quit(scope.item);
        };
      }
    };

  })