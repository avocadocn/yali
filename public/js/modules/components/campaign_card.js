'use strict';

angular.module('donler.components.campaignCard', [])

  .controller('CampaignCardCtrl', ['$scope', function ($scope) {
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
        role:'@'
      },
      templateUrl: '/components/campaignCard/template',
      // controller: 'CampaignCardCtrl',
      // link: function (scope, ele, attrs, ctrl) {

      // }
    }

  })