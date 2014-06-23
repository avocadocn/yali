'use strict';

var tabViewUser = angular.module('mean.main');


tabViewUser.directive('match', function($parse) {
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

tabViewUser.config(['$routeProvider', '$locationProvider',
  function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/group_message', {
        templateUrl: '/group/group_message_list',
        controller: 'GroupMessageController',
        controllerAs: 'messages'
      })
      .when('/campaign', {
        templateUrl: '/users/campaign',
        controller: 'CampaignListController',
        controllerAs: 'campaign'
      })
      .when('/personal', {
        templateUrl: '/users/editInfo',
        controller: 'AccountFormController',
        controllerAs: 'account'
      })
      .when('/timeLine', {
        templateUrl: '/users/timeline',
        //controller: 'timelineController',
       // controllerAs: 'timeline'
      })
      .when('/schedule', {
        templateUrl: '/users/getScheduleList',
        controller: 'ScheduleListController',
        controllerAs: 'schedule'
      })
      .when('/changePassword', {
        templateUrl: '/users/change_password',
        controller: 'PasswordFormController',
        controllerAs: 'password'
      }).
      otherwise({
        redirectTo: '/group_message'
      });
  }]);

tabViewUser.run(['$rootScope', function ($rootScope) {
    $rootScope.nowTab = window.location.hash.substr(2);
    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
    };
}]);

tabViewUser.controller('GroupMessageController', ['$http','$scope','$rootScope',
  function ($http, $scope,$rootScope) {
    $scope.message_role = "user";
    $rootScope.nowTab='group_message';
    $http.get('/users/getGroupMessages').success(function(data, status) {
        $scope.group_messages = data.group_messages;
        $scope.role = data.role;
        $scope.companyLogo = data.companyLogo;
    });
    var t = false;
    $scope.vote = function(provoke_message_id, status, index) {
        t = !t;
        console.log(t);
         try {
            $http({
                method: 'post',
                url: '/users/vote',
                data:{
                    provoke_message_id : provoke_message_id,
                    aOr : status,
                    tid : $scope.group_messages[index].my_team_id
                }
            }).success(function(data, status) {
                if(data.msg != undefined && data.msg != null) {
                    alert(data.msg);
                } else {
                    $scope.group_messages[index].positive = data.positive;
                    $scope.group_messages[index].negative = data.negative;
                }
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };
    //应战
    $scope.responseProvoke = function(tid,provoke_message_id) {
         try {
            $http({
                method: 'post',
                url: '/group/responseProvoke/'+tid,
                data:{
                    provoke_message_id : provoke_message_id
                }
            }).success(function(data, status) {
                window.location.reload();
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);

tabViewUser.controller('CampaignListController', ['$http','$scope','$rootScope',
  function ($http, $scope,$rootScope) {
    $scope.company = false;
    $http.get('/users/getCampaigns').success(function(data, status) {
      $scope.campaigns = data.data;
      $scope.company = false;
    });

    $scope.join = function(campaign_id,index) {
        try {
            $http({
                method: 'post',
                url: '/users/joinCampaign',
                data:{
                    campaign_id : campaign_id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN_CAMPAIGN_SUCCESS);
                    $scope.campaigns[index].join = true;
                    $scope.campaigns[index].member_length++;
                }
                else{
                    alert(data.msg);
                }
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $scope.quit = function(campaign_id,index) {
        try {
            $http({
                method: 'post',
                url: '/users/quitCampaign',
                data:{
                    campaign_id : campaign_id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT_CAMPAIGN_SUCCESS);
                    $scope.campaigns[index].join = false;
                    $scope.campaigns[index].member_length--;
                }
                else{
                    alert(data.msg);
                }
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);


tabViewUser.controller('ScheduleListController', ['$scope', '$http', '$rootScope', function($scope, $http, $rootScope) {

  $scope.isCalendar = true;
  $scope.prev = '上个月';
  $scope.next = '下个月';
  var btn_calendar = $('#btn_calendar');
  var btn_list = $('#btn_list');

  $scope.calendar = function(isCalendar) {
    $scope.isCalendar = isCalendar;
    if (isCalendar === true) {
      btn_calendar.addClass('active');
      btn_list.removeClass('active');
    } else {
      btn_calendar.removeClass('active');
      btn_list.addClass('active');
    }
  };

  $scope.setText = function(textType) {
    switch (textType) {
    case 'month':
      $scope.prev = '上个月';
      $scope.next = '下个月';
      break;
    case 'week':
      $scope.prev = '上一周';
      $scope.next = '下一周';
      break;
    case 'day':
      $scope.prev = '前一天';
      $scope.next = '后一天';
      break;
    default:
      $scope.prev = '上个月';
      $scope.next = '下个月';
      break;
    }
  }


  var options = {
    events_source: '/users/getScheduleCalendarData',
    view: 'month',
    time_end: '24:00',
    tmpl_path: '/tmpls/',
    tmpl_cache: false,
    language: 'zh-CN',
    onAfterEventsLoad: function(events) {
      if(!events) {
        return;
      }
    },
    onAfterViewLoad: function(view) {
      $('#calendar_title').text(this.getTitle());
      $('#calendar_operator button').removeClass('active');
      $('button[data-calendar-view="' + view + '"]').addClass('active');
    },
    classes: {
      months: {
        general: 'label'
      }
    }
  };

  var calendar = $('#calendar').calendar(options);

  $('#calendar_operator button[data-calendar-nav]').each(function() {
    var $this = $(this);
    $this.click(function() {
      calendar.navigate($this.data('calendar-nav'));
    });
  });

  $('#calendar_operator button[data-calendar-view]').each(function() {
    var $this = $(this);
    $this.click(function() {
      calendar.view($this.data('calendar-view'));
    });
  });


    $scope.company = false;
    $http.get('/users/getScheduleListData').success(function(data, status) {
      $scope.campaigns = data.data;
      $scope.company = false;
    });

    $scope.join = function(campaign_id,index) {
        try {
            $http({
                method: 'post',
                url: '/users/joinCampaign',
                data:{
                    campaign_id : campaign_id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.JOIN_CAMPAIGN_SUCCESS);
                    $scope.campaigns[index].join = true;
                    $scope.campaigns[index].member_length++;
                }
                else{
                    alert(data.msg);
                }
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $scope.quit = function(campaign_id,index) {
        try {
            $http({
                method: 'post',
                url: '/users/quitCampaign',
                data:{
                    campaign_id : campaign_id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.QUIT_CAMPAIGN_SUCCESS);
                    $scope.campaigns[index].join = false;
                    $scope.campaigns[index].member_length--;
                }
                else{
                    alert(data.msg);
                }
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };


}]);

tabViewUser.controller('AccountFormController',['$scope','$http','$rootScope',function($scope, $http,$rootScope) {
    $rootScope.nowTab ='personal';
    $http.get('/users/getAccount').success(function(data,status){
        if(data.result === 1){
            $scope.user = data.data;
        }
        else{
             console.log(data.msg);
        }
    }).error(function(data,status) {
        //TODO:更改对话框
        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.ACCOUNT_FAILURE);
    });
    $scope.baseUnEdit = true;
    $scope.baseButtonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.EDIT;
    $scope.linkUnEdit = true;
    $scope.linkButtonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.EDIT;
    $scope.baseEditToggle = function() {
        $scope.baseUnEdit = !$scope.baseUnEdit;
        if($scope.baseUnEdit) {
            try{
                var _info ={
                    email: $scope.user.email,
                    nickname: $scope.user.nickname,
                    realname: $scope.user.realname,
                    position: $scope.user.position,
                    sex: $scope.user.sex,
                    birthday: $scope.user.birthday,
                    bloodType: $scope.user.bloodType,
                    introduce: $scope.user.introduce,
                };
                $http({
                    method : 'post',
                    url : '/users/saveAccount',
                    data : {
                        user : _info
                    }
                }).success(function(data, status) {
                    //TODO:更改对话框
                    if(data.result === 1){
                        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.MSG_UPDATE_SUCCESS);
                        //重新刷新页面
                        window.location.reload();
                    }
                    else
                        $rootScope.donlerAlert(data.msg);
                }).error(function(data, status) {
                    //TODO:更改对话框
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                });
            }
            catch(e) {
                console.log(e);
            }
            $scope.baseButtonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.EDIT;
        }
        else {
            $scope.baseButtonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.SAVE;
        }
    };
    $scope.linkEditToggle = function() {
        $scope.linkUnEdit = !$scope.linkUnEdit;
        if($scope.linkUnEdit) {
            try{
                var _info ={
                    phone: $scope.user.phone,
                    email: $scope.user.email,
                    qq: $scope.user.qq
                };
                $http({
                    method : 'post',
                    url : '/users/saveAccount',
                    data : {
                        user : _info
                    }
                }).success(function(data, status) {
                    console.log(data);
                    //TODO:更改对话框
                    if(data.result === 1)
                        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.MSG_UPDATE_SUCCESS);
                    else
                        $rootScope.donlerAlert(data.msg);
                }).error(function(data, status) {
                    //TODO:更改对话框
                    $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
                });
            }
            catch(e) {
                console.log(e);
            }
            $scope.linkButtonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.EDIT;
        }
        else {
            $scope.linkButtonStatus = $rootScope.lang_for_msg[$rootScope.lang_key].value.SAVE;
        }
    };

}]);

tabViewUser.controller('PasswordFormController', ['$http','$scope','$rootScope', function($http, $scope, $rootScope) {
    $scope.nowpassword = '';
    $scope.newpassword = '';
    $scope.confirmpassword = '';
    $scope.change_password = function(){
        $http({
            method : 'post',
            url : '/users/changePassword',
            data : {
                'nowpassword' : $scope.nowpassword,
                'newpassword' : $scope.newpassword
            }
        }).success(function(data, status) {
            //TODO:更改对话框
            if(data.result === 1){
                $rootScope.donlerAlert(data.msg);
                window.location.href = '#/personal';
            }
            else
                $rootScope.donlerAlert(data.msg);
        }).error(function(data, status) {
            //TODO:更改对话框
            $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
        });
    };
}]);
