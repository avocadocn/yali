'use strict';

angular.module('donler.components.rich_comment', ['angularFileUpload'])

.controller('RichCommentCtrl', ['$scope', '$element', 'Comment', 'FileUploader', function ($scope, $element, Comment, FileUploader) {
  // to do
}])

.directive('richComment', function () {
  return {
    restrict: 'E',
    controller: 'RichCommentCtrl',
    scope: {
      componentId: '='
    },
    templateUrl: './rich_comment.html',
    link: function (scope, element, attrs, ctrl) {
      // to do
    }
  }
})



