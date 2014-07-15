'use strict';

angular.module('mean.main', ['ngRoute','ui.bootstrap','pascalprecht.translate','wu.masonry']);


var app = angular.module('mean.main');

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
    var date = new Date(input);
    var intervalMilli = date.getTime() - today.getTime();
    var xcts = parseInt(intervalMilli / (24 * 60 * 60 * 1000));
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
    var date = new Date(input);
    var intervalMilli = date.getTime() - today.getTime();
    var xcts = parseInt(intervalMilli / (24 * 60 * 60 * 1000));
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
      return date.getMonthFormatted() + '-' + date.getDateFormatted();
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

var messagePreHandle = function(teams,msg){
  var direct_show = false;
  var detail = "";
  var content = "";
  var message_type = 0;
  var message = [];
  var team_messages = [],
      company_messages = [],
      global_messages = [],
      private_messages = [];
  for(var i = 0; i < msg.length; i ++) {
    //小队
    if(msg[i].type == 'team'){
      if(msg[i].message_content.sender.length > 0){
        if(msg[i].message_content.campaign_id == null){
          message_type = 0;
          content = "小队 "+msg[i].message_content.team[0].name + "的组长 "+msg[i].message_content.sender[0].nickname;
          detail = msg[i].message_content.content;
          direct_show = true;
        }else{
          detail = msg[i].message_content.content;
          if(msg[i].message_content.team[0].provoke_status == 0){
            message_type = 1;
          }else{
            message_type = 2;
          }
        }
      }
      // if(msg[i].message_content.team.length == 2){
      //   for(var j = 0; j < teams.length; j ++){
      //     if(teams[j]._id === msg[i].message_content.team[0]._id){
      //       content = provokeStatus(msg[i].message_content.team[0].provoke_status,msg[i].message_content.team[0].name,true);
      //       url = "/group/home/"+msg[i].message_content.team[0]._id+"#/group_message";
      //     }else{
      //       if(teams[j]._id === msg[i].message_content.team[1]._id){
      //         content = provokeStatus(msg[i].message_content.team[1].provoke_status,msg[i].message_content.team[1].name,false);
      //         url = "/group/home/"+msg[i].message_content.team[1]._id+"#/group_message";
      //       }
      //     }
      //   }
      // }else{
      // }
      team_messages.push({
        '_id':msg[i]._id,
        'caption':'Message From Campaign',
        'content':content,
        'status':msg[i].status,
        'date':msg[i].message_content.post_date,
        'detail':msg[i].message_content.content,
        'message_type':message_type,
        'campaign_id':msg[i].message_content.campaign_id,
        'campaign_name':msg[i].message_content.caption
      });
    }

    //公司
    if(msg[i].type == 'company'){
      if(msg[i].message_content.sender.length > 0){
        message_type = 3;
        detail = msg[i].message_content.content;
        company_messages.push({
          '_id':msg[i]._id,
          'caption':msg[i].message_content.caption,
          'status':msg[i].status,
          'date':msg[i].message_content.post_date,
          'detail':detail,
          'message_type':message_type
        });
      }
    }

    //私人
    if(msg[i].type == 'private'){
      if(msg[i].message_content.team.length > 0){
        if([2,3].indexOf(msg[i].message_content.team[0].provoke_status) > -1){


          message_type = 4;
          var last_content = msg[i].message_content.team[0].provoke_status == 3 ? "接受了您的比赛结果" : "发出了一个新的比赛确认";
          content = msg[i].message_content.team[0].name + " 的队长 " + msg[i].message_content.sender[0].nickname + last_content;
          private_messages.push({
            '_id':msg[i]._id,
            'caption':msg[i].message_content.caption,
            'content':content,
            'status':msg[i].status,
            'date':msg[i].message_content.post_date,
            'message_type':message_type,
            'campaign_id':msg[i].message_content.campaign_id
          });
        }
        if([0,1].indexOf(msg[i].message_content.team[0].provoke_status) > -1){


          message_type = 7;
          var last_content = msg[i].message_content.team[0].provoke_status == 1 ? "接受了您的挑战" : "向您发出了一个新的挑战";
          content = msg[i].message_content.team[0].name + " 的队长 " + msg[i].message_content.sender[0].nickname + last_content;
          private_messages.push({
            '_id':msg[i]._id,
            'caption':msg[i].message_content.caption,
            'content':content,
            'status':msg[i].status,
            'date':msg[i].message_content.post_date,
            'message_type':message_type,
            'team_id':msg[i].message_content.team[1]._id
          });
        }
      }else{
        message_type = 5;
        detail = msg[i].message_content.content;
        private_messages.push({
          '_id':msg[i]._id,
          'caption':msg[i].message_content.caption,
          'status':msg[i].status,
          'date':msg[i].message_content.post_date,
          'detail':detail,
          'sender':msg[i].message_content.sender,
          'message_type':message_type
        });
      }

    }

    //系统
    if(msg[i].type == 'global'){
      message_type = 6;
      private_messages.push({
        '_id':msg[i]._id,
        'caption':msg[i].message_content.caption,
        'status':msg[i].status,
        'date':msg[i].message_content.post_date,
        'detail':msg[i].message_content.content,
        'message_type':message_type
      })
    }
  }
  message.push(private_messages,team_messages,company_messages,global_messages);
  return message;
}

app.controller('messageHeaderController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
    $http.get('/message/header').success(function(data, status) {
        var messages = messagePreHandle(data.team,data.msg);
        $rootScope.private_length = messages[0].length;
        $rootScope.team_length = messages[1].length;
        $rootScope.company_length = messages[2].length;
        $rootScope.global_length = messages[3].length;
        $rootScope.o = $rootScope.private_length + $rootScope.team_length + $rootScope.company_length + $rootScope.global_length;
    });
}]);