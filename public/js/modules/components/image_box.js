'use strict';

angular.module('donler.components.imageBox', [])

  .directive('imageBox', function () {

    return {
      restrict: 'E',
      replace: true,
      scope: {
        images: '='
      },
      templateUrl: '/components/ImageBox/template',
      link: function (scope, ele, attrs, ctrl) {
        var images = scope.images;
        if (images.length > 0) {

          scope.sliderWidth = 0;

          scope.isPreview = false;
          scope.prevIndex = 0;
          scope.thisIndex = 0;
          scope.nextIndex = 0;
          scope.previewImg = images[0].uri;

          scope.thumbBoxInnerStyle = {};
          var width = 60;

          var setMargin = function (index) {
            var marginWidth = width * index;
            if (marginWidth >= scope.sliderWidth) {
              var margin = (0 - marginWidth) + 'px';
              scope.thumbBoxInnerStyle = {
                'margin-left': margin
              };
            }
          };

          var setIndex = function (index) {
            if (index <= 0) {
              scope.prevIndex = 0;
              scope.nextIndex = Math.min(index + 1, images.length - 1);
              scope.thisIndex = 0;
            } else if (index >= images.length - 1) {
              scope.prevIndex = Math.max(index - 1, 0);
              scope.nextIndex = images.length - 1;
              scope.thisIndex = images.length - 1;
            } else {
              scope.prevIndex = index - 1;
              scope.nextIndex = index + 1;
              scope.thisIndex = index;
            }
            scope.previewImg = images[scope.thisIndex].uri;
            setMargin(scope.thisIndex);
          };

          scope.choose = function (index) {
            setIndex(index);
          }

          scope.preview = function (index) {
            setIndex(index);
            scope.isPreview = true;
          };

          scope.prev = function () {
            setIndex(scope.thisIndex - 1);
          };

          scope.next = function () {
            setIndex(scope.thisIndex + 1);
          }

          scope.close = function () {
            scope.isPreview = false;
          };
        }

      }
    };

  })

  .directive('calWidth', function () {
    return {
      restrict: 'A',
      scope: {
        resultWidth: '='
      },
      link: function (scope, ele, attrs, ctrl) {
        scope.resultWidth = ele.width();
      }
    };
  })