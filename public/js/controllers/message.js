'use strict';

var messageApp = angular.module('donler');


messageApp.run(['$http','$rootScope', function ($http, $rootScope) {
    $rootScope.nowTab = window.location.hash.substr(2);

    $rootScope.$on("$routeChangeStart",function(){
      $rootScope.loading = true;
    });
    $rootScope.$on("$routeChangeSuccess",function(){
      $rootScope.loading = false;
    });

    $rootScope.private_length = 0;
    $rootScope.team_length = 0;
    $rootScope.company_length = 0;
    $rootScope.global_length = 0;
    $rootScope.o = 0;

    $rootScope.page_private_messages = [];
    $rootScope.page_team_messages = [];
    $rootScope.page_company_messages = [];
    $rootScope.page_global_messages = [];


    $rootScope.page_send = {
      'type':'send',
      'arrow':'both',
      'current_page':0,
      'up':0,
      'down':0
    };

    $rootScope.page_all = {
      'type':'all',
      'arrow':'both',
      'current_page':0,
      'up':0,
      'down':0
    };

    $rootScope.page_private = {
      'type':'private',
      'arrow':'both',
      'current_page':0,
      'up':0,
      'down':0
    };
    $rootScope.page_team = {
      'type':'team',
      'arrow':'both',
      'current_page':0,
      'up':0,
      'down':0
    };
    $rootScope.page_company = {
      'type':'company',
      'arrow':'both',
      'current_page':0,
      'up':0,
      'down':0
    };
    $rootScope.page_global = {
      'type':'global',
      'arrow':'both',
      'current_page':0,
      'up':0,
      'down':0
    };

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
            var messages;
            if(_type!=='all'){
              messages = messagePreHandle(data.team,data.msg,true); //将站内信分类
              $rootScope.private_messages = messages[0];
              $rootScope.team_messages = messages[1];
              $rootScope.company_messages = messages[2];
              $rootScope.global_messages = messages[3];
              if($rootScope.team_messages.length > 0){
                $rootScope.page_team_messages = pageHandle($rootScope.team_messages,$rootScope.page_team,'init');
              }
              if($rootScope.private_messages.length > 0){
                $rootScope.page_private_messages = pageHandle($rootScope.private_messages,$rootScope.page_private,'init');
              }
              if($rootScope.company_messages.length > 0){
                $rootScope.page_company_messages = pageHandle($rootScope.company_messages,$rootScope.page_company,'init');
              }
              if($rootScope.global_messages.length > 0){
                $rootScope.page_global_messages = pageHandle($rootScope.global_messages,$rootScope.page_global,'init');
              }
            }else{
              $rootScope.all_messages = messagePreHandle(data.team,data.msg,false); //不分类,直接显示所有站内信
              if($rootScope.all_messages.length > 0){
                $rootScope.page_all_messages = pageHandle($rootScope.all_messages,$rootScope.page_all,'init');
              }
            }
            $rootScope.teams = data.team;
            $rootScope.cid = data.cid;
            $rootScope.uid = data.uid;
        }).error(function(data, status) {
            //TODO:更改对话框
            alertify.alert('DATA ERROR');
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


var messagePreHandle = function(teams,msg,divide){
  var direct_show = false;
  var detail = "";
  var content = "";
  var sender = null;
  var message_type = 0;
  var message = [];
  var team_messages = [],
      company_messages = [],
      global_messages = [],
      private_messages = [],
      all_messages = [];
  for(var i = 0; i < msg.length; i ++) {
    //小队
    if(msg[i].type == 'team'){
      if(msg[i].message_content.sender.length > 0){
        if(msg[i].message_content.campaign_id == null){
          message_type = 0;

          if(msg[i].message_content.sender[0].role === 'LEADER'){
            sender = "队长 "+msg[i].message_content.sender[0].nickname;
          }else{
            if(msg[i].message_content.sender[0].role === 'HR'){
              sender = "您的公司";
            }
          }
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
      if(divide){
        team_messages.push({
          '_id':msg[i]._id,
          'content':content,
          'status':msg[i].status,
          'date':msg[i].message_content.post_date,
          'detail':msg[i].message_content.content,
          'team':msg[i].message_content.team[0],
          'sender':sender,
          'message_type':message_type,
          'campaign_id':msg[i].message_content.campaign_id,
          'campaign_name':msg[i].message_content.caption
        });
      }else{
        all_messages.push({
          '_id':msg[i]._id,
          'content':content,
          'status':msg[i].status,
          'date':msg[i].message_content.post_date,
          'detail':msg[i].message_content.content,
          'message_type':message_type,
          'team':msg[i].message_content.team[0],
          'sender':sender,
          'campaign_id':msg[i].message_content.campaign_id,
          'campaign_name':msg[i].message_content.caption
        });
      }
    }

    //公司
    if(msg[i].type == 'company'){
      if(msg[i].message_content.sender.length > 0){
        message_type = 3;
        detail = msg[i].message_content.content;
        if(divide){
          company_messages.push({
            '_id':msg[i]._id,
            'caption':msg[i].message_content.caption,
            'status':msg[i].status,
            'date':msg[i].message_content.post_date,
            'detail':detail,
            'message_type':message_type
          });
        }else{
          all_messages.push({
            '_id':msg[i]._id,
            'caption':msg[i].message_content.caption,
            'status':msg[i].status,
            'date':msg[i].message_content.post_date,
            'detail':detail,
            'message_type':message_type
          });
        }
      }
    }

    //私人
    if(msg[i].type == 'private'){
      if(msg[i].message_content.team.length > 0){
        if([2,3].indexOf(msg[i].message_content.team[0].provoke_status) > -1){


          message_type = 4;
          var last_content = msg[i].message_content.team[0].provoke_status == 3 ? "接受了您的比赛结果" : "发出了一个新的比赛确认";
          content = msg[i].message_content.team[0].name + " 的队长 " + msg[i].message_content.sender[0].nickname + last_content;
          if(divide){
            private_messages.push({
              '_id':msg[i]._id,
              'caption':msg[i].message_content.caption,
              'content':content,
              'status':msg[i].status,
              'date':msg[i].message_content.post_date,
              'message_type':message_type,
              'campaign_id':msg[i].message_content.campaign_id
            });
          }else{
            all_messages.push({
              '_id':msg[i]._id,
              'caption':msg[i].message_content.caption,
              'content':content,
              'status':msg[i].status,
              'date':msg[i].message_content.post_date,
              'message_type':message_type,
              'campaign_id':msg[i].message_content.campaign_id
            });
          }
        }
        if([0,1].indexOf(msg[i].message_content.team[0].provoke_status) > -1){


          message_type = 7;
          var last_content = msg[i].message_content.team[0].provoke_status == 1 ? "接受了您的挑战" : "向您发出了一个新的挑战";
          content = msg[i].message_content.team[0].name + " 的队长 " + msg[i].message_content.sender[0].nickname + last_content;
          if(divide){
            private_messages.push({
              '_id':msg[i]._id,
              'caption':msg[i].message_content.caption,
              'content':content,
              'status':msg[i].status,
              'date':msg[i].message_content.post_date,
              'message_type':message_type,
              'team_id':msg[i].message_content.team[1]._id
            });
          }else{
            all_messages.push({
              '_id':msg[i]._id,
              'caption':msg[i].message_content.caption,
              'content':content,
              'status':msg[i].status,
              'date':msg[i].message_content.post_date,
              'message_type':message_type,
              'team_id':msg[i].message_content.team[1]._id
            });
          }
        }
      }else{
        message_type = 5;
        detail = msg[i].message_content.content;
        if(divide){
          private_messages.push({
            '_id':msg[i]._id,
            'caption':msg[i].message_content.caption,
            'status':msg[i].status,
            'date':msg[i].message_content.post_date,
            'detail':detail,
            'sender':msg[i].message_content.sender,
            'message_type':message_type
          });
        }else{
          all_messages.push({
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

    }

    //系统
    if(msg[i].type == 'global'){
      message_type = 6;
      if(divide){
        private_messages.push({
          '_id':msg[i]._id,
          'caption':msg[i].message_content.caption,
          'status':msg[i].status,
          'date':msg[i].message_content.post_date,
          'detail':msg[i].message_content.content,
          'message_type':message_type
        });
      }else{
        all_messages.push({
          '_id':msg[i]._id,
          'caption':msg[i].message_content.caption,
          'status':msg[i].status,
          'date':msg[i].message_content.post_date,
          'detail':msg[i].message_content.content,
          'message_type':message_type
        });
      }
    }
  }
  if(divide){
    message.push(private_messages,team_messages,company_messages,global_messages);
    return message;
  }else{
    return all_messages;
  }
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
          case 'send':
            if(!multi){
              rootScope.send_messages.splice(index,1);
            }else{
              rootScope.send_messages = [];
            }
          break;
          case 'all':
            if(!multi){
              if(rootScope.o>0 && rootScope.all_messages[index].status === 'unread'){rootScope.o--}
              rootScope.all_messages[index].status = _status;
            }else{
              for(var i = 0; i < rootScope.all_messages.length; i ++){
                if(rootScope.all_messages[i].status === 'unread'){
                  rootScope.all_messages[i].status = 'read';
                  rootScope.o--;
                }
              }
            }
            if(_status === 'delete'){
              if(!multi){
                rootScope.all_messages.splice(index,1);
              }else{
                rootScope.all_messages = [];
                rootScope.o =0;
              }
            }
          break;
          //这些用于站内信分类,以后会用到
          /*
          case 'private':
            if(!multi){
              if(rootScope.private_length.length>0 && rootScope.private_messages[index].status === 'unread'){rootScope.private_length--;rootScope.o--}
              rootScope.private_messages[index].status = _status;
            }else{
              for(var i = 0; i < rootScope.private_messages.length; i ++){
                if(rootScope.private_messages[i].status === 'unread'){
                  rootScope.private_messages[i].status = 'read';
                  rootScope.private_length--;
                  rootScope.o--;
                }
              }
            }

            if(_status === 'delete'){
              if(!multi){
                rootScope.private_messages.splice(index,1);
              }else{
                rootScope.private_messages = [];
                rootScope.o -= (rootScope.private_length + rootScope.global_length);
                rootScope.private_length = 0;
                rootScope.global_length = 0;
              }
            }
          break;
          case 'team':
            if(!multi){
              if(rootScope.team_length>0 && rootScope.team_messages[index].status === 'unread'){rootScope.team_length--;rootScope.o--}
              rootScope.team_messages[index].status = _status;
            }else{
              for(var i = 0; i < rootScope.team_messages.length; i ++){
                if(rootScope.team_messages[i].status === 'unread'){
                  rootScope.team_messages[i].status = 'read';
                  rootScope.team_length--;
                  rootScope.o--;
                }
              }
            }
            if(_status === 'delete'){
              if(!multi){
                rootScope.team_messages.splice(index,1);
              }else{
                rootScope.team_messages = [];
                rootScope.o -= (rootScope.team_length);
                rootScope.team_length = 0;
              }
            }
          break;
          case 'company':
            if(!multi){
              if(rootScope.company_length>0 && rootScope.company_messages[index].status === 'unread'){rootScope.company_length--;rootScope.o--}
              rootScope.company_messages[index].status = _status;
            }else{
              for(var i = 0; i < rootScope.company_messages.length; i ++){
                if(rootScope.company_messages[i].status === 'unread'){
                  rootScope.company_messages[i].status = 'read';
                  rootScope.companylength--;
                  rootScope.o--;
                }
              }
            }
            if(_status === 'delete'){
              if(!multi){
                rootScope.company_messages.splice(index,1);
              }else{
                rootScope.company_messages = [];
                rootScope.o -= (rootScope.company_length);
                rootScope.company_length = 0;
              }
            }
          break;
          */
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


messageApp.controller('messageAllController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
  $rootScope.getMessageByHand('all');

  $scope.pageOperate = function(arrow){
    pageHandle($rootScope.all_messages,$rootScope.page_all,arrow);
  }

  $scope.setAllStatus = function(_status){
    sendSet($http,_status,$rootScope,null,'all',null,true);
  }
  $scope.setToDelete = function(index){
    sendSet($http,'delete',$rootScope,$rootScope.all_messages[index]._id,'all',index,false);
  }
  $scope.setToRead = function(index){
    if($rootScope.all_messages[index].status === 'unread'){
      sendSet($http,'read',$rootScope,$rootScope.all_messages[index]._id,'all',index,false);
    }
  }
}]);


//获取一对一私信或者系统站内信
messageApp.controller('messagePrivateController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
  $rootScope.getMessageByHand('private');

  $scope.pageOperate = function(arrow){
    pageHandle($rootScope.private_messages,$rootScope.page_private,arrow);
  }

  $scope.setAllStatus = function(_status){
    sendSet($http,_status,$rootScope,null,'private',null,true);
  }
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


//站内信分页
var pageHandle = function(messages,page,arrow){
  var VALVE = 10;
  var length = messages.length;
  var sum = parseInt(length / VALVE);
  var mod = length % VALVE;
  sum += (mod != 0) ? 1 : 0;

  if(arrow === 'init'){
    page.current_page = 0;
    if(length >= VALVE){
      page.arrow = 'right';
      page.up = 0;
      page.down = VALVE-1;
    }else{
      page.arrow = 'none';
      page.up = 0;
      page.down = length-1;
    }
  }

  if(arrow === 'left'){
    if(page.current_page > 0){
      page.current_page --;
      if(page.current_page > 0){
        page.arrow = 'both';
      }else{
        page.arrow = 'right';
      }
      page.up = page.current_page * VALVE;
      page.down = page.current_page * VALVE + VALVE - 1;
    }
  }

  if(arrow === 'right'){
    if(page.current_page < sum - 1){
      page.current_page ++;
      if(page.current_page < sum - 1){
        page.arrow = 'both';
      }else{
        page.arrow = 'left';
      }
      page.up = page.current_page * VALVE;
      page.down = page.current_page * VALVE + (page.current_page === (sum - 1) ? ( (mod === 0) ? (VALVE - 1) : (mod - 1)) : VALVE - 1);
    }
  }
}


messageApp.controller('messageSenderController',['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {

    $scope.private_message_content = {
      'text':''
    }
    $scope.private_message_caption = {
      'text':''
    }
  //队长给队员发私信
  $scope.sendToAll = function(){
    var _url;
    var _data = {
      content : $scope.private_message_content.text,
      caption : $scope.private_message_caption.text
    };
    if($scope.role === 'LEADER'){
      var _team = {
        size : 1,
        own : {
          _id : $scope.teamId,
          name : $scope.teamName,
        }
      };
      _data.team = _team;
      _url = '/message/push/leader';
    }

    if($scope.role === 'HR'){
      _url = '/message/push/hr';
      _data.cid = $scope.cid;
      var _team = {
        size : 1,
        own : {
          _id : $scope.teamId,
          name : $scope.teamName,
        }
      };
      _data.team = _team;
    }
    
    try{
      $http({
          method: 'post',
          url: _url,
          data:_data
      }).success(function(data, status) {
          if(data.msg === 'SUCCESS'){
            alertify.alert('发送成功!');
            if($scope.role === 'LEADER'){
              $rootScope.o ++;
            }
            $scope.getSenderList();
          }
      }).error(function(data, status) {
          //TODO:更改对话框
          alertify.alert('DATA ERROR');
      });
    }
    catch(e){
        console.log(e);
    }
  }

  $scope.getSenderList = function(){
     try{
      $http({
          method: 'get',
          url: '/message/sendlist'
      }).success(function(data, status) {
          if(data.msg === 'SUCCESS'){
            $rootScope.send_messages = sendMessagesPre(data.message_contents);
            $rootScope.page_send_messages = pageHandle($rootScope.send_messages,$rootScope.page_send,'init');
          }
      }).error(function(data, status) {
          //TODO:更改对话框
          alertify.alert('DATA ERROR');
      });
    }
    catch(e){
        console.log(e);
    }
  }
  $scope.getSenderList();

  $scope.pageOperate = function(arrow){
    pageHandle($rootScope.send_messages,$rootScope.page_send,arrow);
  }
  $scope.deleteAll = function(){
    sendSet($http,'delete',$rootScope,null,'send',null,true);
  }
  $scope.setToDelete = function(index){
    sendSet($http,'delete',$rootScope,$rootScope.send_messages[index]._id,'send',index,false);
  }
}]);



var sendMessagesPre = function(messages){
  var send_messages = [];
  var message_type;
  var detail;
  var content;
  var direct_show;
  for(var i = 0; i < messages.length; i ++) {
    //小队
    if(messages[i].type == 'private'){
      if(messages[i].sender.length > 0){
        if(messages[i].campaign_id == null){
          message_type = 0;
          content = "您向 "+messages[i].team[0].name + "的队员发送了站内信";
          detail = messages[i].content;
          direct_show = true;
        }else{
          detail = messages[i].content;
          content = "您向参加 "+ messages[i].caption + " 的成员发送了站内信";
          if(messages[i].team[0].provoke_status == 0){
            message_type = 1;
          }else{
            message_type = 2;
          }
        }
      }
     send_messages.push({
        '_id':messages[i]._id,
        'caption':'Message From Campaign',
        'content':content,
        'status':messages[i].status,
        'date':messages[i].post_date,
        'detail':messages[i].content,
        'message_type':message_type,
        'campaign_id':messages[i].campaign_id,
        'campaign_name':messages[i].caption
      });
    }

    //公司
    if(messages[i].type == 'company'){
      message_type = 3;
      detail = messages[i].content;
      content = "您向全公司的员工发送了站内信";
      send_messages.push({
        '_id':messages[i]._id,
        'content':content,
        'caption':messages[i].caption,
        'status':messages[i].status,
        'date':messages[i].post_date,
        'detail':detail,
        'message_type':message_type
      });
    }
  }
  return send_messages;
}

//小队站内信
// messageApp.controller('messageTeamController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
//   //$rootScope.getMessageByHand('team');

//   $scope.pageOperate = function(arrow){
//     pageHandle($rootScope.team_messages,$rootScope.page_team,arrow);
//   }

//   $scope.private_message_content = {
//     'text':''
//   }
//   $scope.private_message_caption = {
//     'text':''
//   }


//   //队长给队员发私信
//   $scope.sendToAll = function(){
//     $rootScope.message_for_group = true;
//     var _team = {
//       size : 1,
//       own : {
//         _id : $rootScope.teamId,
//         name : $rootScope.teamName,
//       }
//     };
//     try{
//       $http({
//           method: 'post',
//           url: '/message/push/leader',
//           data:{
//               team : _team,
//               content : $scope.private_message_content.text,
//               caption : $scope.private_message_caption.text
//           }
//       }).success(function(data, status) {
//           if(data.msg === 'SUCCESS'){
//             $rootScope.team_length++;
//             $rootScope.o ++;
//           }
//       }).error(function(data, status) {
//           //TODO:更改对话框
//           alertify.alert('DATA ERROR');
//       });
//     }
//     catch(e){
//         console.log(e);
//     }
//   }

//   $scope.setAllStatus = function(_status){
//     sendSet($http,_status,$rootScope,null,'team',null,true);
//   }
//   $scope.setToDelete = function(index){
//     sendSet($http,'delete',$rootScope,$rootScope.team_messages[index]._id,'team',index,false);
//   }
//   $scope.showPop = function(index){
//     popOver(index,$rootScope.team_messages[index].detail);
//   }
//   $scope.setToRead = function(index){
//     if($rootScope.team_messages[index].status === 'unread'){
//       sendSet($http,'read',$rootScope,$rootScope.team_messages[index]._id,'team',index,false);
//     }
//   }
// }]);

//公司站内信
// messageApp.controller('messageCompanyController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
//   //$rootScope.getMessageByHand('company');

//   $scope.pageOperate = function(arrow){
//     pageHandle($rootScope.company_messages,$rootScope.page_company,arrow);
//   }

//   $scope.private_message_content = {
//     'text':''
//   }
//   $scope.private_message_caption = {
//     'text':''
//   }

//   //公司给员工发私信
//   $scope.sendToAll = function(){
//     try{
//       $http({
//           method: 'post',
//           url: '/message/push/hr',
//           data:{
//               cid : $rootScope.cid,
//               content : $scope.private_message_content.text,
//               caption : $scope.private_message_caption.text
//           }
//       }).success(function(data, status) {
//           if(data.msg === 'SUCCESS'){
//             $rootScope.company_length++;
//             $rootScope.o ++;
//             alertify.alert('发送成功!');
//             window.location.href = '/company/home';
//           }else{
//             alertify.alert('发送失败!');
//           }
//       }).error(function(data, status) {
//           //TODO:更改对话框
//           alertify.alert('DATA ERROR');
//       });
//     }
//     catch(e){
//         console.log(e);
//     }
//   }

//   $scope.setAllStatus = function(_status){
//     sendSet($http,_status,$rootScope,null,'company',null,true);
//   }
//   $scope.setToDelete = function(index){
//     sendSet($http,'delete',$rootScope,$rootScope.company_messages[index]._id,'company',index,false);
//   }

//   $scope.showPop = function(index){
//     popOver(index,$rootScope.company_messages[index].detail);
//   }
//   $scope.setToRead = function(index){
//     if($rootScope.company_messages[index].status === 'unread'){
//       sendSet($http,'read',$rootScope,$rootScope.company_messages[index]._id,'company',index,false);
//     }
//   }
// }]);

//获取系统公告
messageApp.controller('messageGlobalController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
  $rootScope.getMessageByHand('global');
}]);


messageApp.controller('messageHeaderController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
    $http.get('/message/header').success(function(data, status) {
        var messages = messagePreHandle(data.team,data.msg,false);
        $rootScope.o = messages.length;
        //以后站内信分类时会用到
        /*
        var messages = messagePreHandle(data.team,data.msg,true);
        $rootScope.private_length = messages[0].length;
        $rootScope.team_length = messages[1].length;
        $rootScope.company_length = messages[2].length;
        $rootScope.global_length = messages[3].length;
        $rootScope.o = $rootScope.private_length + $rootScope.team_length + $rootScope.company_length + $rootScope.global_length;
        */
    });
}]);