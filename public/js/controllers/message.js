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
      }).
      // .when('/system', {
      //   templateUrl: '/message/system',
      //   controller: 'messageGlobalController',
      //   controllerAs: 'system'
      // }).
      otherwise({
        redirectTo: '/private'
      });
}]);

messageApp.run(['$http','$rootScope', function ($http, $rootScope) {
    $rootScope.nowTab = window.location.hash.substr(2);

    $rootScope.private_length = 0;
    $rootScope.team_length = 0;
    $rootScope.company_length = 0;
    $rootScope.global_length = 0;
    $rootScope.o = 0;

    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
    };

    $rootScope.statusHandle = function(value){
      switch(value){
        case 'read':
        return '已读';
        case 'unread':
        return '未读';
        case 'delete':
        return '删除';
        default:return '未知';
      }
    }
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

// var provokeStatus = function(value,name,own){
//   switch(value){
//     case 0:
//       if(own){
//         return "您的小队 "+name+"发出了一个新的挑战,快去看看吧!";
//       }else{
//         return "您的小队 "+name+"接受了一个新的挑战,快去看看吧!";
//       }
//     break;
//     case 1:
//       if(own){
//         return "您的小队 "+name+"发出的挑战已经生效,快去看看吧!";
//       }else{
//         return "您的小队 "+name+"接受的挑战已经生效,快去看看吧!";
//       }
//     break;
//     default:break;
//   }
// }


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
        if(msg[i].message_content.team[0].provoke_status > 0){
          message_type = 4;
          var last_content = msg[i].message_content.team[0].provoke_status == 1 ? "接受了您的比赛结果" : "发出了一个新的比赛确认";
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


var sendSet = function(http,_status,rootScope,_id,type,index,multi){
  try{
    http({
        method: 'post',
        url: '/message/modify',
        data:{
            status:_status,
            msg_id:_id,
            multi:multi,
            type:type
        }
    }).success(function(data, status) {
        switch(type){
          case 'private':

            if(!multi){
              if(rootScope.private_length.length>0 && rootScope.private_messages[index].status === 'unread'){rootScope.private_length--;rootScope.o--}
              rootScope.private_messages[index].status = _status;
            }else{
              var sum = 0;
              for(var i = 0; i < rootScope.private_messages.length; i ++){
                if(rootScope.private_messages[i].status === 'unread'){
                  rootScope.private_messages[i].status = 'read';
                  rootScope.private_length--;
                  sum ++;
                }
              }
              for(var i = 0; i < rootScope.global_messages.length; i ++){
                if(rootScope.global_messages[i].status === 'unread'){
                  rootScope.global_messages[i].status = 'read';
                  rootScope.global_length--;
                  sum ++;
                }
              }

            }

            if(_status === 'delete'){
              rootScope.private_messages.splice(index,1);
            }
          break;
          case 'team':
            if(rootScope.team_length>0 && rootScope.team_messages[index].status === 'unread'){rootScope.team_length--;rootScope.o--}
            rootScope.team_messages[index].status = _status;
            if(_status === 'delete'){
              rootScope.team_messages.splice(index,1);
            }
          break;
          case 'company':
            if(rootScope.company_length>0 && rootScope.company_messages[index].status === 'unread'){rootScope.company_length--;rootScope.o--}
            rootScope.company_messages[index].status = _status;
            if(_status === 'delete'){
              rootScope.company_messages.splice(index,1);
            }
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

//获取一对一私信或者系统站内信
messageApp.controller('messagePrivateController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
  $rootScope.getMessageByHand('private');
  $scope.setToDelete = function(index){
    sendSet($http,'delete',$rootScope,$rootScope.private_messages[index]._id,'private',index,false);
  }
  $scope.showPop = function(index){
    popOver(index,$rootScope.private_messages[index].detail);
  }
  $scope.setToRead = function(index){
    if($rootScope.private_messages[index].status === 'unread'){
      sendSet($http,'read',$rootScope,$rootScope.private_messages[index]._id,'private',index,false);
    }
  }
}]);

var popOver = function(index,detail){
  $('.pop').popover('destroy');
  $('#pop_message_'+index).popover({
    'content': detail,
    'trigger': 'hover'
  });
  $('#pop_message_'+index).popover('show');
}


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
    $rootScope.message_for_group = true;
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
            $rootScope.o ++;
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

  $scope.setToDelete = function(index){
    sendSet($http,'delete',$rootScope,$rootScope.team_messages[index]._id,'team',index,false);
  }
  $scope.showPop = function(index){
    popOver(index,$rootScope.team_messages[index].detail);
  }
  $scope.setToRead = function(index){
    if($rootScope.team_messages[index].status === 'unread'){
      sendSet($http,'read',$rootScope,$rootScope.team_messages[index]._id,'team',index,false);
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

  //公司给员工发私信
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
            $rootScope.o ++;
            alertify.alert('发送成功!');
          }else{
            alertify.alert('发送失败!');
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

  $scope.setToDelete = function(index){
    sendSet($http,'delete',$rootScope,$rootScope.company_messages[index]._id,'company',index,false);
  }

  $scope.showPop = function(index){
    popOver(index,$rootScope.company_messages[index].detail);
  }
  $scope.setToRead = function(index){
    if($rootScope.company_messages[index].status === 'unread'){
      sendSet($http,'read',$rootScope,$rootScope.company_messages[index]._id,'company',index,false);
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
        $rootScope.o = $rootScope.private_length + $rootScope.team_length + $rootScope.company_length + $rootScope.global_length;
    });
}]);