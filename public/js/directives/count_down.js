'use strict';

angular.module('donler')

  .directive('countDown', function () {
    return {
      restrict: 'A',
      scope: {
        endText: '@',
        target: '=',
        isEnd: '=',
        startCal: '='
      },
      link: function (scope, element, attrs) {
        var endText = scope.endText ? scope.endText : '活动已开始';

        scope.$watch('target', function (newVal, oldVal) {
          if (newVal) {
            if (handle) {
              clearInterval(handle);
            }
            var handle = setInterval(function() {
              var startTime = new Date(newVal);
              startTime.setSeconds(startTime.getSeconds());
              if (startTime < Date.now()) {
                element.text(endText);
                scope.isEnd = true;
                clearInterval(handle);
                return;
              }
              var during = moment.duration(moment(startTime).diff(Date.now()));
              var remindText = '';
              var startAdd = false; // 是否开始添加
              var addedCount = 0; // 添加了几次
              var isFinishedAdd = false; // 是否添加完毕

              var addText = function (value, measure) {
                var text = value + measure;
                if (value > 0) {
                  if (!startAdd) {
                    startAdd = true;
                  }
                  if (!isFinishedAdd) {
                    remindText += text;
                    addedCount += 1;
                    if (addedCount >= 2) {
                      isFinishedAdd = true;
                    }
                  }
                } else {
                  if (startAdd) {
                    addedCount += 1;
                    if (addedCount >= 2) {
                      isFinishedAdd = true;
                    }
                  }
                }
              };

              addText(during.years(), '年');
              addText(during.months(), '个月');
              addText(during.days(), '天');
              addText(during.hours(), '小时');
              addText(during.minutes(), '分');
              addText(during.seconds(), '秒');

              element.text(remindText);
              if (scope.startCal === false) {
                scope.startCal = true;
                scope.$apply();
              }
            }, 1000);
          }
        });

      }
    }
  });


