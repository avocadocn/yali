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
            window.scrollByU =true;
            scrollTo(0, stopY); return;
        }
        var speed = Math.round(distance / 200);
        if (speed >= 20) speed = 20;
        var step = Math.round(distance / 25);
        var leapY = stopY > startY ? startY + step : startY - step;
        var timer = 0;
        if (stopY > startY) {
            for ( var i=startY; i<stopY; i+=step ) {
                setTimeout("window.scrollByU =true;window.scrollTo(0, "+leapY+")", timer * speed);
                leapY += step; if (leapY > stopY) leapY = stopY; timer++;
            } return;
        }
        for ( var i=startY; i>stopY; i-=step ) {
            setTimeout("window.scrollByU =true;window.scrollTo(0, "+leapY+")", timer * speed);
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
        var lastScrollTop=0;
        angular.element($window).bind('scroll', function() {
            if($window.scrollByU){
                $window.scrollByU =false;
                return;
            }
            var _scrollTop = $window.scrollY;
            var _windowHeight = $window.innerHeight;
            var _scrollHeight = _scrollTop +_windowHeight;
            var selectedEle = angular.element('.'+selectClass);
            var nearestEle = 0;
            // if(lastScrollTop>_scrollTop){
            //     //向上滚动 
            //     for(var i = 0; i<selectedEle.length;i++){
            //         var _temp = selectedEle[i];
            //         if( _scrollTop > _temp.offsetTop && selectedEle[nearestEle].offsetTop < _temp.offsetTop){
            //             nearestEle = i;
            //         }
            //     }
            //     for(var j=nearestEle;j>0;j--){
            //         if(selectedEle[j].id&&selectedEle[j].dataset.load!='0'){
            //             nearestEle =j;
            //             break;
            //         }
            //     }
            // }
            // else{
            //     //向下滚动
            //     for(var i = 0; i<selectedEle.length;i++){
            //         var _temp = selectedEle[i];
            //         if( _scrollHeight > _temp.offsetTop && selectedEle[nearestEle].offsetTop > _temp.offsetTop){
            //             nearestEle = i;
            //         }
            //     }
            //     for(var j=nearestEle;j<selectedEle.length;j++){
            //         if(selectedEle[j].id&&selectedEle[j].dataset.load!='0'){
            //             nearestEle =j;
            //             break;
            //         }
            //     }
            // }
            for(var i = 0; i<selectedEle.length;i++){
                var _temp = selectedEle[i];
                if( _scrollTop < _temp.offsetTop && _scrollHeight > _temp.offsetTop){
                    // nearestEle = i;
                    if(_temp.id){
                        scope.$apply(attr.whenScrolled+"(\'"+_temp.id+"\')");
                    }
                }
            }

            lastScrollTop = _scrollTop;
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
                addCampaign(record[0].year+'_'+record[0].month[0].month);
            }
        });
        $scope.nowYear='timeline1_0';
        var addCampaign = function(id){
            var temp = id.split('_');
            if(temp[0]!='timeline1'&&temp[0]!='timeline0'){
                var paging = {
                    year:temp[0],
                    month:temp[1]
                }
                for (var i = $scope.timelines.length - 1; i >= 0; i--) {
                    if($scope.timelines[i].year==temp[0]){
                        for (var j = $scope.timelines[i].month.length - 1; j >= 0; j--) {
                            if($scope.timelines[i].month[j].month==temp[1]){
                                if($scope.timelines[i].month[j].campaigns.length==0){
                                    Campaign.getCampaignsData(hostType,userId,paging,function(err,timeline){
                                        if(!err){
                                            $scope.timelines[i].month[j].campaigns = timeline.campaigns;
                                            return timeline.campaigns.length;
                                        }
                                    });
                                }
                                return 0;
                            }
                        };
                        break;
                    }
                };
            }
            else{
                return false;
            }
            
        }
        $scope.scrollTo =function(id){
            var temp = id.split('_');
            $scope.nowYear = temp[0];
            $scope.nowMonth = temp[1];
            $location.hash(id);
            anchorSmoothScroll.scrollTo(id);
            addCampaign(id);
        }
        $scope.loadMore = function (id) {
          var temp = id.split('_');
          $scope.nowYear = temp[0];
          $scope.nowMonth = temp[1];
          addCampaign(id);
        }
    }
]);