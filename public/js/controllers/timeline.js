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
            var nearestEle = 0;
            for(var i = 0; i<selectedEle.length;i++){
                var _temp = selectedEle[i];
                if(_scrollTop > _temp.offsetTop && selectedEle[nearestEle].offsetTop < _temp.offsetTop){
                    nearestEle = i;
                }
            }
            scope['show_'+selectedEle[nearestEle].id] = true;
            if(nearestEle>0){
                scope['show_'+selectedEle[nearestEle-1].id] = true;
            }
            if(nearestEle<selectedEle.length-1){
                scope['show_'+selectedEle[nearestEle+1].id] = true;
            }
            scope.$apply(attr.whenScrolled+"(\'"+selectedEle[nearestEle].id+"\')");
        });
    };
});

timeline.controller('timelineController',['$scope', '$http', '$location', '$rootScope', 'anchorSmoothScroll', 'Campaign', 
    function ($scope, $http, $location, $rootScope, anchorSmoothScroll, Campaign) {
        var data = document.getElementById('user_data').dataset;
        var userId = data.id;
        var hostType = 'user';
        Campaign.getCampaignsDateRecord(hostType,userId,function(err,record){
            if(!err){
                $scope.timelines=record;
            }
        });
        $scope.nowYear='timeline_0';
        var addCampaign = function(timeline){
            for (var i = $scope.timelines.length - 1; i >= 0; i--) {
                if($scope.timelines[i].year==timeline.year){
                    for (var j = $scope.timelines[i].month.length - 1; j >= 0; j--) {
                        if($scope.timelines[i].month[j].month==timeline.month){
                            if($scope.timelines[i].month[j].campaigns.length==0){
                                $scope.timelines[i].month[j].campaigns = timeline.campaigns;
                            }
                            return;
                        }
                    };
                    break;
                }
            };
        }
        $scope.scrollTo =function(id){
            var temp = id.split('_');
            $scope.nowYear = temp[0];
            $scope.nowMonth = temp[1];
            $location.hash(id);
            anchorSmoothScroll.scrollTo(id);
            if(temp[0]!='timeline'){
                var paging = {
                    year:temp[0],
                    month:temp[1]
                }
                Campaign.getCampaignsData(hostType,userId,paging,function(err,timeline){
                    if(!err){
                        addCampaign(timeline);
                    }
                });
            }

        }
        $scope.loadMore = function (id) {
          // console.log(i++);
          var temp = id.split('_');
          $scope.nowYear = temp[0];
          $scope.nowMonth = id;
        }
    }
]);