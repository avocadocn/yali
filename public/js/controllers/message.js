'use strict';

var messageApp = angular.module('donler');

messageApp.config(['$routeProvider', '$locationProvider',
  function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/message_all', {
        templateUrl: '/message/all',
        controller: 'messageAllController',
        controllerAs: 'all'
      })
      .when('/send', {
        templateUrl: '/message/send',
        controller: 'messageSenderController',
        controllerAs: 'team'
      }).
      otherwise({
        redirectTo: '/message/all'
      });
}]);

messageApp.run(['$http','$rootScope','$location', function ($http, $rootScope,$location) {
    $rootScope.multi_send = false;
    $rootScope.company_send_selects = [];
    $rootScope.company_send_select = {
      '_id':0,
      'value':'发往全公司'
    };
    $rootScope.company_send_selects.push($rootScope.company_send_select);
    $rootScope.company_send_selects.push({
      '_id':1,
      'value':'发往小队'
    });
    // $rootScope.company_send_selects.push({
    //   '_id':2,
    //   'value':'发往部门'
    // });

    if($location.hash()!=='')
        $rootScope.nowTab = window.location.hash.substr(2);
    else if($location.path()!=='')
        $rootScope.nowTab = $location.path().substr(1);

    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
    };

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

    $rootScope.page_all_messages = [];
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
          $rootScope.receive_message_sum = 0;
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

            if($rootScope.all_messages != undefined && $rootScope.all_messages != null){
              $rootScope.receive_message_sum = $rootScope.all_messages.length;
              if($rootScope.all_messages.length > 0){
                sendSet($http,'read',$rootScope,null,'all',null,true);
              }
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
}]);

var messagePreHandle = function(teams,msg,divide){
  //message_type
  //0: 队长给小队成员发消息/公司给某小队队员发消息
  //1: 来自活动的消息
  //2: 来自比赛的消息
  //3: 公司给所有人发的消息
  //4: 和比赛确认相关的消息(队长发送和接收)
  //5: 一对一的私人消息(暂不可用)
  //6: 系统消息
  //7: 和挑战相关的消息(队长发送和接收)
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
          detail = msg[i].message_content.content;
          direct_show = true;
        }else{
          detail = msg[i].message_content.content;
          if(msg[i].message_content.team.length > 0){
            if(msg[i].message_content.team[0].status == 0){
              message_type = 1;
            }else{
              message_type = 2;
            }
          }else{
            message_type = 1;
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
          'team': msg[i].message_content.team.length > 0 ? msg[i].message_content.team[0] : [],
          'photo': msg[i].message_content.team.length > 0 ? msg[i].message_content.team[0].logo : msg[i].message_content.sender[0].photo,
          'sender':msg[i].message_content.sender[0],
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
          'team': msg[i].message_content.team.length > 0 ? msg[i].message_content.team[0] : [],
          'photo': msg[i].message_content.team.length > 0 ? msg[i].message_content.team[0].logo : msg[i].message_content.sender[0].photo,
          'sender':msg[i].message_content.sender[0],
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
            'status':msg[i].status,
            'date':msg[i].message_content.post_date,
            'photo':msg[i].message_content.sender[0].photo,
            'detail':detail,
            'sender':msg[i].message_content.sender[0],
            'message_type':message_type
          });
        }else{
          all_messages.push({
            '_id':msg[i]._id,
            'status':msg[i].status,
            'date':msg[i].message_content.post_date,
            'photo':msg[i].message_content.sender[0].photo,
            'detail':detail,
            'sender':msg[i].message_content.sender[0],
            'message_type':message_type
          });
        }
      }
    }

    //私人(队长接收)
    if(msg[i].type == 'private'){
      if(msg[i].message_content.team.length > 0){
        if([2,3].indexOf(msg[i].message_content.team[0].status) > -1){


          message_type = 4;
          sender = {
            'name': msg[i].message_content.team[0].name
          }
          content = msg[i].message_content.team[0].status == 3 ? "接受了您的比赛结果" : "向您发出了一个新的比赛确认";
          if(divide){
            private_messages.push({
              '_id':msg[i]._id,
              'content':content,
              'detail':msg[i].message_content.caption,
              'status':msg[i].status,
              'sender':sender,
              'date':msg[i].message_content.post_date,
              'photo':msg[i].message_content.team[0].logo,
              'message_type':message_type,
              'campaign_id':msg[i].message_content.campaign_id
            });
          }else{
            all_messages.push({
              '_id':msg[i]._id,
              'content':content,
              'detail':msg[i].message_content.caption,
              'status':msg[i].status,
              'date':msg[i].message_content.post_date,
              'sender':sender,
              'photo':msg[i].message_content.team[0].logo,
              'message_type':message_type,
              'campaign_id':msg[i].message_content.campaign_id
            });
          }
        }
        if([0,1,4,5].indexOf(msg[i].message_content.team[0].status) > -1){
          message_type = 7;
          sender = {
            'name': msg[i].message_content.team[0].name
          }
          switch(msg[i].message_content.team[0].status){
            case 0:
              content = "向您发出了一个新的挑战";
              break;
            case 1:
              content = "接受了您的挑战";
              break;
            case 4:
              content = "拒绝了您发起的挑战";
              break;
            case 5:
              content = "取消了挑战";
              break;
            default:break;
          }
          if(divide){
            private_messages.push({
              '_id':msg[i]._id,
              'content':content,
              'status':msg[i].status,
              'detail':msg[i].message_content.caption,
              'sender':sender,
              'date':msg[i].message_content.post_date,
              'photo':msg[i].message_content.team[0].logo,
              'message_type':message_type,
              'team_id':msg[i].message_content.team[1]._id,
              'campaign_id':msg[i].message_content.campaign_id
            });
          }else{
            all_messages.push({
              '_id':msg[i]._id,
              'content':content,
              'status':msg[i].status,
              'detail':msg[i].message_content.caption,
              'sender':sender,
              'date':msg[i].message_content.post_date,
              'photo':msg[i].message_content.team[0].logo,
              'message_type':message_type,
              'team_id':msg[i].message_content.team[1]._id,
              'campaign_id':msg[i].message_content.campaign_id
            });
          }
        }
      }else{
        // p2p
        message_type = 5;
        detail = msg[i].message_content.content;
        if(divide){
          private_messages.push({
            '_id':msg[i]._id,
            'status':msg[i].status,
            'date':msg[i].message_content.post_date,
            'detail':detail,
            'sender':msg[i].message_content.sender[0].nickname,
            'photo':msg[i].message_content.sender[0].photo,
            'message_type':message_type
          });
        }else{
          all_messages.push({
            '_id':msg[i]._id,
            'status':msg[i].status,
            'date':msg[i].message_content.post_date,
            'detail':detail,
            'sender':msg[i].message_content.sender[0].nickname,
            'photo':msg[i].message_content.sender[0].photo,
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
          'status':msg[i].status,
          'date':msg[i].message_content.post_date,
          'detail':msg[i].message_content.content,
          'message_type':message_type
        });
      }else{
        all_messages.push({
          '_id':msg[i]._id,
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
              rootScope.page_send.down --;
              if(rootScope.page_send.down == rootScope.page_send.up - 1){
                pageHandle(rootScope.send_messages,rootScope.page_send,'left');
                rootScope.page_send.arrow = 'left';
              }
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
                rootScope.page_all.down --;
                if(rootScope.page_all.down == rootScope.page_all.up - 1){
                  pageHandle(rootScope.all_messages,rootScope.page_all,'left');
                  rootScope.page_all.arrow = 'left';
                }
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
  $rootScope.nowTab = 'message_all';
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
// messageApp.controller('messagePrivateController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
//   $rootScope.getMessageByHand('private');

//   $scope.pageOperate = function(arrow){
//     pageHandle($rootScope.private_messages,$rootScope.page_private,arrow);
//   }

//   $scope.setAllStatus = function(_status){
//     sendSet($http,_status,$rootScope,null,'private',null,true);
//   }
//   $scope.setToDelete = function(index){
//     sendSet($http,'delete',$rootScope,$rootScope.private_messages[index]._id,'private',index,false);
//   }
//   $scope.showPop = function(index){
//     popOver(index,$rootScope.private_messages[index].detail);
//   }
//   $scope.setToRead = function(index){
//     if($rootScope.private_messages[index].status === 'unread'){
//       sendSet($http,'read',$rootScope,$rootScope.private_messages[index]._id,'private',index,false);
//     }
//   }
// }]);



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

var hrSendToMulti = function(url,value,http,scope){
  if(scope.select_dOts.length > scope.dOt_send_success -1){
    var _team = {
      size : 1,
      own : {
        _id : scope.dOt ? scope.select_dOts[scope.dOt_send_success].team._id : scope.select_dOts[scope.dOt_send_success]._id,
        name : scope.dOt ? scope.select_dOts[scope.dOt_send_success].team.name : scope.select_dOts[scope.dOt_send_success].name,
        logo : scope.dOt ? scope.select_dOts[scope.dOt_send_success].team.logo : scope.select_dOts[scope.dOt_send_success].logo
      }
    };
    value.team = _team;
    try{
      http({
          method: 'post',
          url: url,
          data:value
      }).success(function(data, status) {
          if(data.msg === 'SUCCESS'){
            if(scope.select_dOts.length > scope.dOt_send_success -1){
              scope.dOt_send_success = scope.dOt_send_success + 1;
              //递归发送
              try{
                hrSendToMulti(url,value,http,scope);
              }catch(e){
                if(scope.select_dOts.length == scope.dOt_send_success){
                  scope.private_message_content.text='';
                  scope.getSenderList();
                  scope.message_form.$setPristine();
                  alertify.alert('发送成功!');
                }else{
                  console.log(e);
                }
              }
            }else{
              scope.private_message_content.text='';
              comment_form.$setPristine();
              scope.getSenderList();
              $scope.message_form.$setPristine();
              alertify.alert('发送成功!');
            }
          }else{
            alertify.alert('DATA ERROR');
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
}

messageApp.controller('messageSenderController',['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {

  $rootScope.nowTab = 'send';
  $scope.dOt_select_num = 0;
    $scope.private_message_content = {
      'text':''
    }
    $scope.private_message_caption = {
      'text':''
    }

    $scope.dOt = false;
    // $http.get('/company/getCompanyTeamsInfo/'+cid+'/'+type+'?'+ (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
    //     $rootScope.team_lists = data.teams;//公司的所有team
    //     $scope.dOts = $rootScope.team_lists;
    //     $scope.main_dOt = $scope.dOts[0];
    // });

    // .get('/department/detail/multi/' + $rootScope.cid)
    //         .success(function(data, status) {
    //             $scope.dOtFormat(data.departments);
    //         });

  var url_team;
  var url_department;
  $scope.dOts = [];
  $scope.$watch('cid',function(cid){
    url_team = '/company/getCompanyTeamsInfo/'+cid+'/'+'team';
    url_department = '/department/detail/multi/' + cid;
  });
  $scope.getMessageSendType = function(_id){
    $scope.dOt_select_num = 0;
    if(_id > 0){
      $rootScope.multi_send = true;
      switch(_id){
        case 1:
        $scope.dOt = false;
          $http.get(url_team).success(function(data, status) {
              $scope.dOts = data.teams;;
              for(var i = 0 ; i < $scope.dOts.length; i ++){
                $scope.dOts[i].selected = false;
              }
              $scope.main_dOt = $scope.dOts[0];
          });
        break;
        case 2:
        $scope.dOt = true;
          $http.get(url_department).success(function(data, status) {
              $scope.dOts = [];
              for(var i = 0; i < data.departments.length; i ++){
                $scope.dOts.push({
                  selected:false,
                  _id:data.departments[i]._id,
                  name:data.departments[i].name,
                  team:data.departments[i].team
                });
              }
          });
        break;
        default:break;
      }
    }else{
      $rootScope.multi_send = false;
      $scope.dOts = [];
    }
  }

  //$scope.getMessageSendType(1);
  $scope.selectReady = function(index){
    $scope.dOt_select_num += $scope.dOts[index].selected ? 1 : -1;
  }


  //队长给队员  公司给所有员工/小队员工 发送私信
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
          logo : $scope.teamLogo
        }
      };
      _data.team = _team;
      _url = '/message/push/leader';

      try{
        $http({
            method: 'post',
            url: _url,
            data:_data
        }).success(function(data, status) {
          //console.log('1:',$scope.message_form);
          if(data.msg === 'SUCCESS'){
            if($scope.role === 'LEADER'){
              $rootScope.o ++;
              $rootScope.receive_message_sum ++;
            }
            $scope.private_message_content.text='';
            $scope.message_form.$setPristine();
            $scope.getSenderList($scope.teamId);
            //alertify.alert('发送成功!');
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


    if($scope.role === 'HR'){
      _url = '/message/push/hr';
      _data.cid = $scope.cid;
      //给多部门/多小队 发送站内信
      if($rootScope.multi_send){
        $scope.dOt_send_success = 0;
        $scope.select_dOts = [];
        for(var i = 0 ; i < $scope.dOts.length; i ++){
          if($scope.dOts[i].selected){
            $scope.select_dOts.push($scope.dOts[i]);
          }
        }
        hrSendToMulti(_url,_data,$http,$scope);
      }else{
        var _team = {
        size : 1,
        own : {
            _id : $scope.teamId,
            name : $scope.teamName,
            logo : $scope.teamLogo
          }
        };
        _data.team = _team;
        try{
          $http({
              method: 'post',
              url: _url,
              data:_data
          }).success(function(data, status) {
              if(data.msg === 'SUCCESS'){
                alertify.alert('发送成功!');
                $scope.private_message_content.text='';
                $scope.message_form.$setPristine();
                $scope.getSenderList($scope.teamId);
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
    }
  }

  //获取已经发送的站内信
  $scope.getSenderList = function(teamId){
    var url = ((teamId == null || teamId == 'null' || teamId == undefined) ? '/message/sendlist/private/0' : '/message/sendlist/team/'+teamId);
     try{
      $http({
          method: 'get',
          url: url
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

  $scope.$watch('teamId+role+leader',function(){
    if($scope.role == 'HR' || $scope.leader == 'true'){
      ;
    }else{
      window.location.href = '/message/home#/message_all';
    }
    $scope.getSenderList($scope.teamId);
  });

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


//预处理已经发送的站内信
var sendMessagesPre = function(messages){
  var send_messages = [];
  var message_type;
  var detail;
  var content;
  var direct_show;
  for(var i = 0; i < messages.length; i ++) {
    //小队
    if(messages[i].auto == false || messages[i].auto == 'false'){
      if(messages[i].type == 'private'){
        if(messages[i].sender.length > 0){
          if(messages[i].campaign_id == null){
            message_type = 0;
            detail = messages[i].content;
            direct_show = true;
          }else{
            detail = messages[i].content;
            if(messages[i].team.length > 0){
              if(messages[i].team[0].status == 0){
                message_type = 1;//活动
              }else{
                message_type = 2;//比赛
              }
            }else{
              message_type = 1;//活动
            }
          }
        }
        send_messages.push({
          '_id':messages[i]._id,
          'status':messages[i].status,
          'date':messages[i].post_date,
          'detail':messages[i].content,
          'team':messages[i].team[0],
          'sender':messages[i].sender[0],
          'message_type':message_type,
          'campaign_id':messages[i].campaign_id,
          'campaign_name':messages[i].caption
        });
      }

      //公司
      if(messages[i].type == 'company'){
        message_type = 3;
        detail = messages[i].content;
        send_messages.push({
          '_id':messages[i]._id,
          'content':content,
          'caption':messages[i].caption,
          'status':messages[i].status,
          'date':messages[i].post_date,
          'sender':messages[i].sender[0],
          'detail':detail,
          'message_type':message_type
        });
      }
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
// messageApp.controller('messageGlobalController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
//   $rootScope.getMessageByHand('global');
// }]);