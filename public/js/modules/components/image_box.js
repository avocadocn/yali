'use strict';

angular.module('donler.components.imageBox', [])

  .controller('ImageBoxCtrl', ['$scope', '$http', function ($scope,$http) {
    $scope.thumbBoxInnerStyle = {};
    this.maxScrollWidth = 0;
    this.maxShowThumbCount = 0; // 下方缩略图最多可展示的数目
    this.thumbWidth = 60;
    var self = this;

    $scope.canPrev = false;
    $scope.canNext = false;
    $scope.imagesLoaded =false;
    $scope.setMargin = function (index) {
      var correctIndex = 0;
      if ($scope.images.length > self.maxShowThumbCount) {
        correctIndex = index - parseInt((self.maxShowThumbCount - 1) / 2);
      }
      if (correctIndex < 0) {
        correctIndex = 0;
      }
      var marginWidth = self.thumbWidth * correctIndex;
      if (self.maxScrollWidth > 0) {
        if (marginWidth > self.maxScrollWidth) {
          marginWidth = self.maxScrollWidth;
        }
        var margin = (0 - marginWidth) + 'px';
        $scope.thumbBoxInnerStyle = {
          'margin-left': margin
        };
      }
      if (marginWidth === 0) {
        $scope.canPrev = false;
      } else {
        $scope.canPrev = true;
      }

      if (marginWidth >= self.maxScrollWidth) {
        $scope.canNext = false;
      } else {
        $scope.canNext = true;
      }

    };
    $scope.getMoreImages = function (callback) {
      if($scope.imagesLoaded){
        callback();
        return;
      }
      $http({
        method:'get',
        url: '/photoAlbum/'+$scope.photoAlbumId+'/photolist',
      }).success(function(data,status){
        if(data.result===1){
          $scope.images = data.data;
          $scope.imagesLoaded =true;
          callback();
        }
      }).error(function(data,status){
        console.log('DATA ERROR');
      });

    };
  }])

  .directive('imageBox', function () {

    return {
      restrict: 'E',
      replace: true,
      scope: {
        images: '='
      },
      templateUrl: '/component_templates/image_box.html',
      controller: 'ImageBoxCtrl',
      link: function (scope, ele, attrs, ctrl) {
        var images = scope.images;
        if (images.length > 0) {
          scope.isPreview = false;
          scope.prevIndex = 0;
          scope.thisIndex = 0;
          scope.nextIndex = 0;
          var pageIndex = 0;

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
            pageIndex = scope.thisIndex;
            scope.previewImg = images[scope.thisIndex].uri;
            scope.setMargin(scope.thisIndex);

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

          scope.prevList = function () {
            if (scope.canPrev) {
              pageIndex -= ctrl.maxShowThumbCount;
              scope.setMargin(pageIndex);
            }
          };

          scope.nextList = function () {
            if (scope.canNext) {
              pageIndex += ctrl.maxShowThumbCount;
              scope.setMargin(pageIndex);
            }
          };


        }

      }
    };

  })
  .directive('preImageBox',['$timeout', function ($timeout) {

    return {
      restrict: 'E',
      replace: true,
      scope: {
        images: '=',
        photoAlbumId:'='
      },
      templateUrl: '/component_templates/preimage_box.html',
      controller: 'ImageBoxCtrl',
      link: function (scope, ele, attrs, ctrl) {
        if (scope.images.length > 0) {
          scope.preImages  = scope.images;
          scope.isPreview = false;
          scope.prevIndex = 0;
          scope.thisIndex = 0;
          scope.nextIndex = 0;
          var pageIndex = 0;
          var setIndex = function (index) {
            if (index <= 0) {
              scope.prevIndex = 0;
              scope.nextIndex = Math.min(index + 1, scope.images.length - 1);
              scope.thisIndex = 0;
            } else if (index >= scope.images.length - 1) {
              scope.prevIndex = Math.max(index - 1, 0);
              scope.nextIndex = scope.images.length - 1;
              scope.thisIndex = scope.images.length - 1;
            } else {
              scope.prevIndex = index - 1;
              scope.nextIndex = index + 1;
              scope.thisIndex = index;
            }
            pageIndex = scope.thisIndex;
            scope.previewImg = scope.images[scope.thisIndex].uri;
            scope.setMargin(scope.thisIndex);

          };

          scope.choose = function (index) {
            setIndex(index);
          }

          scope.preview = function (uri) {
            scope.getMoreImages(function(){
              for(var i=0;i<scope.images.length;i++){
                if(scope.images[i].uri==uri){
                  $timeout(function(){
                    setIndex(i);
                  });
                  break;
                }
              }
            });
            
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

          scope.prevList = function () {
            if (scope.canPrev) {
              pageIndex -= ctrl.maxShowThumbCount;
              scope.setMargin(pageIndex);
            }
          };

          scope.nextList = function () {
            if (scope.canNext) {
              pageIndex += ctrl.maxShowThumbCount;
              scope.setMargin(pageIndex);
            }
          };


        }

      }
    };

  }])
  .directive('calWidth', function () {
    return {
      require: ['^?imageBox','^?preImageBox'],
      restrict: 'A',
      link: function (scope, ele, attrs, ctrl) {
        var eleWidth = ele.width();
        ctrl= ctrl[0] || ctrl[1];
        scope.$watch('images', function (newVal, oldVal) {
          if(newVal){
            // 最大滚动宽度，可能为负值，表示允许向左滚动的最大值
            var maxScrollWidth = ctrl.thumbWidth * scope.images.length - eleWidth;
            // 校正最大滚动宽度为缩略图的整数倍
            if (maxScrollWidth > 0) {
              var count = parseInt(maxScrollWidth / ctrl.thumbWidth);
              var remainder = maxScrollWidth % ctrl.thumbWidth;
              if (remainder != 0) {
                maxScrollWidth = ctrl.thumbWidth * (count + 1);
              }
            }
            ctrl.maxScrollWidth = maxScrollWidth;
            ctrl.maxShowThumbCount = parseInt(eleWidth / ctrl.thumbWidth);
          }

        });
      }
    };
  })

  .directive('needScroll', function () {
    return {
      restrict: 'A',
      link: function (scope, ele, attrs, ctrl) {
        var lastHeight = 0;
        scope.$watch('previewImg', function (newVal, oldVal) {
          if(newVal){
            var img = new Image();
            img.src = newVal;
            img.onload = function () {
              if (this.height > document.body.clientHeight || lastHeight > document.body.clientHeight) {
                window.scrollTo(0, ele[0].offsetTop);
              }
              lastHeight = this.height;
            }
          }

        })
      }
    };
  })


