'use strict';

var timeline = angular.module('donler');

timeline.service('anchorSmoothScroll', function(){
    
    this.scrollTo = function(eID) {

        // This scrolling function 
        // is from http://www.itnewb.com/tutorial/Creating-the-Smooth-Scroll-Effect-with-JavaScript
        
        var startY = currentYPosition();
        var stopY = elmYPosition(eID);
        var distance = stopY > startY ? stopY - startY : startY - stopY;
        if (distance < 100) {
            scrollTo(0, stopY); return;
        }
        var speed = Math.round(distance / 200);
        if (speed >= 20) speed = 20;
        var step = Math.round(distance / 25);
        var leapY = stopY > startY ? startY + step : startY - step;
        var timer = 0;
        if (stopY > startY) {
            for ( var i=startY; i<stopY; i+=step ) {
                setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
                leapY += step; if (leapY > stopY) leapY = stopY; timer++;
            } return;
        }
        for ( var i=startY; i>stopY; i-=step ) {
            setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
            leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
        }
        
        function currentYPosition() {
            // Firefox, Chrome, Opera, Safari
            if (self.pageYOffset) return self.pageYOffset;
            // Internet Explorer 6 - standards mode
            if (document.documentElement && document.documentElement.scrollTop)
                return document.documentElement.scrollTop;
            // Internet Explorer 6, 7 and 8
            if (document.body.scrollTop) return document.body.scrollTop;
            return 0;
        }
        
        function elmYPosition(eID) {
            var elm = document.getElementById(eID);
            if(!elm){
              return 0;
            }
            var y = elm.offsetTop;
            var node = elm;
            while (node.offsetParent && node.offsetParent != document.body) {
                node = node.offsetParent;
                y += node.offsetTop;
            } return y;
        }

    };
    
});
timeline.directive('whenScrolled', function($window) {
    return function(scope, elm, attr) {
        var raw = elm[0];
        var selectClass=angular.element(raw).attr('select-class');
        angular.element($window).bind('scroll', function() {
            var _scrollTop = angular.element($window).scrollTop()
            var selectedEle = angular.element('.'+selectClass);
            var nearestEle = selectedEle[0];
            for(var i = 0; i<selectedEle.length;i++){
                var _temp = selectedEle[i];
                if(_scrollTop > _temp.offsetTop && nearestEle.offsetTop < _temp.offsetTop){
                    nearestEle = _temp;
                }
            }
            scope.$apply(attr.whenScrolled+"(\'"+nearestEle.id+"\')");
        });
    };
});

timeline.controller('timelineController', function ($scope, $http, $location, $rootScope,anchorSmoothScroll) {
  $rootScope.nowYear='timeline_0';
  $rootScope.scrollTo =function(id){
    $rootScope.nowMonth = id;
    $location.hash(id);
    anchorSmoothScroll.scrollTo(id);
  }
  $rootScope.loadMore = function (id) {
      // console.log(i++);
      var temp = id.split('_');
      $rootScope.nowYear = temp[0];
      $rootScope.nowMonth = id;
  }
});