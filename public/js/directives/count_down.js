'use strict';

angular.module('donler')

  .directive('countDown', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {


        var startTime = new Date(attrs.countDown);
        var handle = setInterval(function() {
          startTime.setSeconds(startTime.getSeconds());
          if (startTime < Date.now()) {
            element.text('活动已开始');
            clearInterval(handle);
            return;
          }
          var during = moment.duration(moment(startTime).diff(Date.now()));
          var remindText = during.seconds() + '秒';
          if (during.minutes() > 0) {
            remindText = during.minutes() + '分' + remindText;
          }
          if (during.hours() > 0) {
            remindText = during.hours() + '小时' + remindText;
          }
          if (during.days() > 0) {
            remindText = during.days() + '天' + remindText;
          }
          if (during.months() > 0) {
            remindText = during.months() + '月' + remindText;
          }
          if (during.years() > 0) {
            remindText = during.years() + '年' + remindText;
          }
          element.text(remindText);
        }, 1000);
      }
    }
  });