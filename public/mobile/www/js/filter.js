'use strict';



angular.module('starter.filter', [])

.filter('dateView', function() {
  return function(input) {
    // input will be ginger in the usage below
    switch(new Date(input).getDay()){
      case 0:
      input = '周日';
      break;
      case 1:
      input = '周一';
      break;
      case 2:
      input = '周二';
      break;
      case 3:
      input = '周三';
      break;
      case 4:
      input = '周四';
      break;
      case 5:
      input = '周五';
      break;
      case 6:
      input = '周六';
      break;
      default:
      input = '';
    }
    return input;
  }
})

.filter('nospace', function() {
  return function(input) {
    return input.replace(/ /g, '');
  };
})
