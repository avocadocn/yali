'use strict';

angular.module('donler.components.rich_comment', ['angularFileUpload'])

  .controller('RichCommentCtrl', ['$scope', '$http', '$element', 'Comment', 'FileUploader',
    function ($scope, $http, $element, Comment, FileUploader) {
      // to do
      $http.get('/components/RichComment/' + $scope.componentId)
        .success(function (data, status) {
          if (data.result === 1) {
            $scope.comments = data.componentData.comments;
            $scope.nextStartDate = data.componentData.nextStartDate;
          }
        })
        .error(function (data, status) {
          // to do: error handle
        });


    }])

  .directive('richComment', function () {
    return {
      restrict: 'E',
      replace: true,
      controller: 'RichCommentCtrl',
      scope: {
        componentId: '@'
      },
      // to do: 临时做法, 暂时写绝对路径, 可移植性会很糟糕, 以后需要修改, 这里无法使用相对路径
      templateUrl: '/js/modules/components/rich_comment/rich_comment.html',
      link: function (scope, element, attrs, ctrl) {
        // to do

      }
    }
  })



