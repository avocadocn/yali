'use strict';



// rst.push({
//   'rec_id':messages[i].rec_id,
//   'status':messages[i].status,
//   'message_content':messages[i].MessageContent
// });
var messageApp = angular.module('mean.main');
messageApp.config(['$routeProvider', '$locationProvider',
  function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/private', {
        templateUrl: '/message/private',
        controller: 'messagePrivateController',
        controllerAs: 'private'
      })
      .when('/team', {
        templateUrl: '/message/team',
        controller: 'messageTeamController',
        controllerAs: 'team'
      })
      .when('/company', {
        templateUrl: '/message/company',
        controller: 'messageCompanyController',
        controllerAs: 'company'
      })
      .when('/system', {
        templateUrl: '/message/system',
        controller: 'messageGlobalController',
        controllerAs: 'system'
      }).
      otherwise({
        redirectTo: '/private'
      });
}]);

messageApp.run(['$http','$rootScope', function ($http, $rootScope) {
    $rootScope.nowTab = window.location.hash.substr(2);
    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
    };

    $rootScope.getMessageByHand = function(_type){
      try{
        $http({
            method: 'post',
            url: '/message/pull',
            data:{
                _type:_type
            }
        }).success(function(data, status) {
            var messages = messagePreHandle(data.team,data.msg);
            $rootScope.private_messages = messages[0];
            $rootScope.team_messages = messages[1];
            $rootScope.company_messages = messages[2];
            $rootScope.global_messages = messages[3];

            $rootScope.teams = data.team;
            $rootScope.cid = data.cid;
            $rootScope.uid = data.uid;
        }).error(function(data, status) {
            //TODO:更改对话框
            $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
        });
      }
      catch(e){
          console.log(e);
      }
    }
}]);

var provokeStatus = function(value,name,own){
  switch(value){
    case 0:
      if(own){
        return "您的小队 "+name+"发出了一个新的挑战,快去看看吧!";
      }else{
        return "您的小队 "+name+"接受了一个新的挑战,快去看看吧!";
      }
    break;
    case 1:
      if(own){
        return "您的小队 "+name+"发出的挑战已经生效,快去看看吧!";
      }else{
        return "您的小队 "+name+"接受的挑战已经生效,快去看看吧!";
      }
    break;
    default:break;
  }
}


var messagePreHandle = function(teams,msg){
  var direct_show = false;
  var detail = "";
  var content = "";
  var url = "#";
  var message = [];
  var team_messages = [],
      company_messages = [],
      global_messages = [],
      private_messages = [];
  for(var i = 0; i < msg.length; i ++) {
    //小队
    if(msg[i].type == 'team'){
      if(msg[i].message_content.team.length == 2){
        for(var j = 0; j < teams.length; j ++){
          if(teams[j]._id === msg[i].message_content.team[0]._id){
            content = provokeStatus(msg[i].message_content.team[0].provoke_status,msg[i].message_content.team[0].name,true);
            url = "/group/home/"+msg[i].message_content.team[0]._id+"#/group_message";
          }else{
            if(teams[j]._id === msg[i].message_content.team[1]._id){
              content = provokeStatus(msg[i].message_content.team[1].provoke_status,msg[i].message_content.team[1].name,false);
              url = "/group/home/"+msg[i].message_content.team[1]._id+"#/group_message";
            }
          }
        }
      }else{
        if(msg[i].message_content.sender.length > 0){
          content = "小队 "+msg[i].message_content.team[0].name + "的组长 "+msg[i].message_content.sender[0].nickname + " 给您发了一条私信!";
          detail = msg[i].message_content.content;
          direct_show = true;
        }else{
          content = "您的小队 "+msg[i].message_content.team[0].name + "有了新的活动哟!";
          url = "/group/home/"+msg[i].message_content.team[0]._id+"#/group_message";
        }
      }
      team_messages.push({
        '_id':msg[i]._id,
        'caption':msg[i].message_content.caption,
        'content':content,
        'status':msg[i].status,
        'date':msg[i].message_content.post_date,
        'url':url,
        'detail':detail,
        'direct_show':direct_show
      });
    }

    //公司
    if(msg[i].type == 'company'){
      if(msg[i].message_content.sender.length > 0){
        content = "公司给您发了一条私信!";
        detail = msg[i].message_content.content;
        direct_show = true;
        company_messages.push({
          '_id':msg[i]._id,
          'caption':msg[i].message_content.caption,
          'content':content,
          'status':msg[i].status,
          'date':msg[i].message_content.post_date,
          'url':url,
          'detail':detail,
          'direct_show':direct_show
        });
      }else{
        company_messages.push({
          '_id':msg[i]._id,
          'caption':msg[i].message_content.caption,
          'content':'公司有了新的活动,快去看看吧!',
          'status':msg[i].status,
          'date':msg[i].message_content.post_date,
          'url':'/company/home#/company_campaign',
          'detail':detail,
          'direct_show':direct_show
        });
      }
    }

    //私人
    if(msg[i].type == 'private'){
      content = msg[i].message_content.sender.nickname + "给您发了一条私信!";
      direct_show = true;
      detail = msg[i].message_content.content;
      private_messages.push({
        '_id':msg[i]._id,
        'caption':msg[i].message_content.caption,
        'content':content,
        'status':msg[i].status,
        'date':msg[i].message_content.post_date,
        'detail':detail,
        'direct_show':direct_show
      })
    }

    //系统
    if(msg[i].type == 'global'){
      global_messages.push({
        '_id':msg[i]._id,
        'caption':msg[i].message_content.caption,
        'content':msg[i].message_content.content,
        'status':msg[i].status,
        'date':msg[i].message_content.post_date,
        'detail':detail,
        'direct_show':direct_show
      })
    }
  }
  message.push(private_messages,team_messages,company_messages,global_messages);
  return message;
}


var sendSet = function(http,status,rootScope,_id,type,index){
  try{
    http({
        method: 'post',
        url: '/message/modify',
        data:{
            status:status,
            msg_id:_id
        }
    }).success(function(data, status) {
        switch(type){
          case 'private':
            rootScope.private_length--;
            rootScope.private_messages[index].status = 'read';
          break;
          case 'team':
            rootScope.team_length--;
            rootScope.team_messages[index].status = 'read';
          break;
          case 'company':
            rootScope.company_length--;
            rootScope.company_messages[index].status = 'read';
          break;
          default:break;
        }
    }).error(function(data, status) {
        //TODO:更改对话框
        alertify.alert(status);
    });
  }
  catch(e){
      console.log(e);
  }
}

//获取一对一私信
messageApp.controller('messagePrivateController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
  $rootScope.getMessageByHand('private');
  $scope.setToRead = function(index){
    if($rootScope.private_messages[index].direct_show){
      alertify.alert($rootScope.private_messages[index].detail);
    }
    if($rootScope.private_messages[index].status === 'unread'){
      sendSet($http,'read',$rootScope,$rootScope.private_messages[index]._id,index);
    }
  }
}]);

//获取小队站内信
messageApp.controller('messageTeamController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
  $rootScope.getMessageByHand('team');
  $scope.private_message_content = {
    'text':''
  }
  $scope.private_message_caption = {
    'text':''
  }
  //队长给队员发私信
  $scope.sendToAll = function(){
    var _team = {
      size : 1,
      own : {
        _id : $rootScope.teamId,
        name : $rootScope.teamName,
      }
    };
    try{
      $http({
          method: 'post',
          url: '/message/push/leader',
          data:{
              team : _team,
              content : $scope.private_message_content.text,
              caption : $scope.private_message_caption.text
          }
      }).success(function(data, status) {
          if(data.msg === 'SUCCESS'){
            $rootScope.team_length++;
          }
      }).error(function(data, status) {
          //TODO:更改对话框
          $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
      });
    }
    catch(e){
        console.log(e);
    }
  }
  $scope.setToRead = function(index){
    if($rootScope.team_messages[index].direct_show){
      alertify.alert($rootScope.team_messages[index].detail);
    }
    if($rootScope.team_messages[index].status === 'unread'){
      sendSet($http,'read',$rootScope,$rootScope.team_messages[index]._id,index);
    }
  }
}]);

//获取公司站内信
messageApp.controller('messageCompanyController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
  $rootScope.getMessageByHand('company');

  $scope.private_message_content = {
    'text':''
  }
  $scope.private_message_caption = {
    'text':''
  }
  //队长给队员发私信
  $scope.sendToAll = function(){
    try{
      $http({
          method: 'post',
          url: '/message/push/hr',
          data:{
              cid : $rootScope.cid,
              content : $scope.private_message_content.text,
              caption : $scope.private_message_caption.text
          }
      }).success(function(data, status) {
          if(data.msg === 'SUCCESS'){
            $rootScope.company_length++;
          }
      }).error(function(data, status) {
          //TODO:更改对话框
          $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
      });
    }
    catch(e){
        console.log(e);
    }
  }

  $scope.setToRead = function(index){
    if($rootScope.company_messages[index].direct_show){
      alertify.alert($rootScope.company_messages[index].detail);
    }
    if($rootScope.company_messages[index].status === 'unread'){
      sendSet($http,'read',$rootScope,$rootScope.company_messages[index]._id,index);
    }
  }
}]);

//获取系统公告
messageApp.controller('messageGlobalController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
  $rootScope.getMessageByHand('global');
}]);


messageApp.controller('messageHeaderController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {

    $http.get('/message/header').success(function(data, status) {
        var messages = messagePreHandle(data.team,data.msg);
        $rootScope.private_length = messages[0].length;
        $rootScope.team_length = messages[1].length;
        $rootScope.company_length = messages[2].length;
        $rootScope.global_length = messages[3].length;
    });
}]);