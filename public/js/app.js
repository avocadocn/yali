'use strict';

angular.module('donler', ['ngRoute','ui.bootstrap','pascalprecht.translate','wu.masonry']);


var app = angular.module('donler');

app.directive('match', function ($parse) {
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl) {
      scope.$watch(function() {
        return $parse(attrs.match)(scope) === ctrl.$modelValue;
      }, function(currentValue) {
        ctrl.$setValidity('mismatch', currentValue);
      });
    }
  };
});
//弹出信息卡片的控制器
app.directive('bsPopover',function() {
  return{
    controller:['$http','$scope',function($http, $scope){
      $scope.showUserCard = function(member_id,pop_id) {
        if($scope.member_id===member_id)
          $('#pop'+pop_id).dl_card({content:$scope.htmlcontent});
        else{
          $scope.member_id = member_id;
          $http.get('/users/briefInfo/'+member_id).success(function(data, status){
            $scope.htmlcontent=data;
            $('#pop'+pop_id).dl_card({content:data});
          });
        }
      };
      $scope.showGroupCard = function(group_id,pop_id) {
        if($scope.group_id===group_id)
          $('#pop'+pop_id).dl_card({content:$scope.htmlcontent});
        else{
          $scope.group_id = group_id;
          $http.get('/group/briefInfo/'+group_id).success(function(data, status){
            $('#pop'+pop_id).dl_card({content:data});
            $scope.htmlcontent = data;
          });
        }
      };
    }],
  };
});
app.directive('match', function ($parse) {
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl) {
      scope.$watch(function() {
        return $parse(attrs.match)(scope) === ctrl.$modelValue;
      }, function(currentValue) {
        ctrl.$setValidity('mismatch', currentValue);
      });
    }
  };
});
app.run(['$rootScope', function ($rootScope) {

    $rootScope.shortTrim = function(value){
      //中文
      if(escape(value).indexOf("%u")>=0){
        if(value.length>6){
          return value.substr(0,6)+'...';
        }else{
          return value;
        }
      //非中文
      }else{
        if(value.length>15){
          return value.substr(0,15)+'...';
        }else{
          return value;
        }
      }
    }

    $rootScope.initAlertCss = function(){
       var body = {
            'border': 'solid 1px #e5e5e5',
            'border-radius': '0px',
            'top' : '50px',
            'left' : '55%',
            'width' : '350px'
        };

        var buttons = {
            'border-top' : '0px',
            'background' : '#fff',
            'text-align' : 'center'
        }

        var button = {
            'margin-left' : '0px',
            'padding' : '6px 15px',
            'box-shadow' : '0px 0px 0px #ffffff',
            'background-color' : '#3498db'
        }

        $(".alertify-buttons").css(buttons);
        $(".alertify").css(body);
        $(".alertify-button").css(button);
    }
    $rootScope.donlerAlert = function(msg) {
      alertify.alert(msg);
      $rootScope.initAlertCss();
    }
}]);

app.filter('dateView', function() {
  return function(input) {
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    var date = new Date(input);
    var intervalMilli = date.getTime() - today.getTime();
    var xcts = Math.floor(intervalMilli / (24 * 60 * 60 * 1000));
    var nowTime = (date.getHours()<10?('0'+date.getHours()):date.getHours())+':'+(date.getMinutes()<10?('0'+date.getMinutes()):date.getMinutes());
    // -2:前天 -1：昨天 0：今天 1：明天 2：后天， out：显示日期
    switch(xcts){
      case -2:
      return '前天'+nowTime;
      break;
      case -1:
      return '昨天'+nowTime;
      break;
      case 0:
      return '今天'+nowTime;
      break;
      case 1:
      return '明天'+nowTime;
      break;
      case 2:
      return '后天'+nowTime;
      break;
      default:
      return input;
    }
  }
});
app.filter('day', function() {
  return function(input) {
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    var date = new Date(input);
    var intervalMilli = date.getTime() - today.getTime();
    var xcts = Math.floor(intervalMilli / (24 * 60 * 60 * 1000));
    // -2:前天 -1：昨天 0：今天 1：明天 2：后天， out：显示日期
    switch(xcts){
    // case -2:
    //   return '前天';
    case -1:
      return '昨天';
    case 0:
      return '今天';
    case 1:
      return '明天';
    // case 2:
    //   return '后天';
    default:
      return (date.getMonth() + 1) + '-' + date.getDate();
    }
  }
});
app.filter('week', function() {
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
});