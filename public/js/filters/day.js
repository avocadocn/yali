'use strict';

angular.module('dayFilter', []).filter('day', function() {
    return function(date) {
      var output = ['日', '一', '二', '三', '四', '五', '六'];
      var day = date.getDay();
      return '星期' + output[day];
    };
});