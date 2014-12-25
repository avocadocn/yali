'use strict';

angular.module('donler')
  .service('anchorSmoothScroll', function(){
    
    this.scrollTo = function(eID) {
      var defaultSpeed = 20;
      var startY,stopY,distance;
      // This scrolling function 
      // is from http://www.itnewb.com/tutorial/Creating-the-Smooth-Scroll-Effect-with-JavaScript
      startY = currentYPosition();
      if(typeof eID =='number'){
        stopY = elmYPosition(eID);
      }
      else{
        stopY = elmYPosition(eID);
      }
      distance = stopY > startY ? stopY - startY : startY - stopY;
      if (distance < 100) {
        window.scrollByU =true;
        scrollTo(0, stopY); return;
      }
      var speed = Math.round(distance / 200);
      if (speed >= defaultSpeed) speed = defaultSpeed;
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