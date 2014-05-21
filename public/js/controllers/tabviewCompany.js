'use strict';

var tabViewCompany = angular.module('tabViewCompany', ['ngRoute','ngAnimate','mgcrea.ngStrap.datepicker','mgcrea.ngStrap.timepicker']);
tabViewCompany.run(['$rootScope', function( $rootScope) {
    $rootScope.nowTab = window.location.hash.substr(2);
    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
    };
}]);
tabViewCompany.directive('match', function($parse) {
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
tabViewCompany.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/company_member', {
        templateUrl: '/company/member',
        controller: 'CompanyMemberController',
        controllerAs: 'members'
       })
      .when('/company_campaign', {
        templateUrl: '/company/campaigns',
        controller: 'CampaignListController',
        controllerAs: 'campaign'
      })
      .when('/company_info', {
        templateUrl: '/company/Info',
        controller: 'AccountFormController',
        controllerAs: 'account'
      })
      .when('/timeLine', {
        templateUrl: '/company/timeLine',
        //controller: 'AccountFormController',
        //controllerAs: 'account'
      })
      .when('/changePassword', {
        templateUrl: '/views/change_password.html',
        controller: 'PasswordFormController',
        controllerAs: 'password'
      })
      .when('/addGroup',{
        templateUrl: '/company/add_group',
        controller: 'CompanyGroupFormController',
        controllerAs:'group'
      }).
      otherwise({
        redirectTo: '/company_campaign'
      });
  }]);

tabViewCompany.controller('CompanyMemberController', ['$http', '$scope','$rootScope',
 function ($http, $scope,$rootScope) {
    $rootScope.nowTab ='company_member';
    $http.get('/search/member?' + Math.round(Math.random()*100)).success(function(data, status) {
      $scope.members = data;
      //按照员工真实姓名的拼音排序
      $scope.members = $scope.members.sort(function (e,f){return e.realname.localeCompare(f.realname);});
      $scope.company = true;
    });

    $scope.userDetail = function(index) {
        $scope.num = index;
    }

    $scope.changeUserInfo = function(_operate) {
        try{
            $http({
                method: 'post',
                url: '/company/changeUser',
                data:{
                    operate : _operate,
                    user : $scope.members[$scope.num]
                }
            }).success(function(data, status) {

            }).error(function(data, status) {
                //TODO:更改对话框
                alert('数据发生错误！');
            });
        }
        catch(e){
            console.log(e);
        }
    }
}]);

tabViewCompany.controller('CampaignListController', ['$http','$scope',
  function($http,$scope) {
    $http.get('/campaign/all?' + Math.round(Math.random()*100)).success(function(data, status) {
      $scope.campaigns = data.data;
      $scope.company = true;
    });

    $scope.selectCampaign = function (value) {
        var _url = "";
        var _selected = true;
        switch(value) {
            case 0:
                _url = "/campaign/company/getCampaigns";
                break;
            case 1:
                _url = "/campaign/user/getCampaigns";
                _selected = true;
                break;
            case 2:
                _url = "/campaign/user/getCampaigns";
                _selected = false;
                break;
            default:break;
        }
         try{
            $http({
                method: 'post',
                url: _url,
                data:{
                    team_selected : _selected
                }
            }).success(function(data, status) {
                $scope.campaigns = data.data;
            }).error(function(data, status) {
                //TODO:更改对话框
                alert('数据发生错误！');
            });
        }
        catch(e){
            console.log(e);
        }
    }
    $scope.getId = function(cid) {
        $scope.campaign_id = cid;
    };
    $scope.editCampaign = function() {
        try{
            $http({
                method: 'post',
                url: '/company/campaignEdit',
                data:{
                    campaign_id : $scope.campaign_id,
                    content : $scope.content,
                    start_time : $scope.start_time,
                    end_time : $scope.end_time
                }
            }).success(function(data, status) {
                //发布活动后跳转到显示活动列表页面
                window.location.reload();

            }).error(function(data, status) {
                //TODO:更改对话框
                alert('数据发生错误！');
            });
        }
        catch(e){
            console.log(e);
        }
    };

    $scope.join = function(campaign_id) {
      alert(campaign_id);
        try {
            $http({
                method: 'post',
                url: '/users/joinCampaign',
                data:{
                    campaign_id : campaign_id
                }
            }).success(function(data, status) {
                window.location.reload();
                alert('成功加入该活动!');
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $scope.quit = function(campaign_id) {
        try {
            $http({
                method: 'post',
                url: '/users/quitCampaign',
                data:{
                    campaign_id : campaign_id
                }
            }).success(function(data, status) {
                window.location.reload();
                alert('您已退出该活动!');
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $scope.sponsor = function() {
        try{
            $http({
                method: 'post',
                url: '/company/campaignSponsor',
                data:{
                    location: $scope.location,
                    content : $scope.content,
                    start_time : $scope.start_time,
                    end_time : $scope.end_time
                }
            }).success(function(data, status) {
                //发布活动后跳转到显示活动列表页面
                window.location.reload();

            }).error(function(data, status) {
                //TODO:更改对话框
                alert('数据发生错误！');
            });
        }
        catch(e){
            console.log(e);
        }
    };

    $scope.cancel = function (_id) {
        try {
            $http({
                method: 'post',
                url: '/company/campaignCancel',
                data:{
                    campaign_id : _id
                }
            }).success(function(data, status) {
                window.location.reload();
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);
tabViewCompany.controller('AccountFormController',['$scope','$http',function($scope, $http) {
    $http.get('/company/getAccount?' + Math.round(Math.random()*100)).success(function(data,status){
        $scope.company = data.company;
        $scope.info = data.info;
    }).error(function(data,status) {
        //TODO:更改对话框
        alert('企业账号信息获取失败！');
    });
    $scope.infoUnEdit = true;
    $scope.infoButtonStatus = '编辑';
    // $scope.groupInfoUnEdit = true;
    // $scope.groupInfoButtonStatus = '编辑队名'
    $scope.infoEditToggle = function() {
        $scope.infoUnEdit = !$scope.infoUnEdit;
        if($scope.infoUnEdit) {
            try{
                $http({
                    method : 'post',
                    url : '/company/saveAccount',
                    data : {
                        info : $scope.info
                    }
                }).success(function(data, status) {
                    //TODO:更改对话框
                    if(data.result === 1)
                        alert(data.msg);
                    else
                        alert(data.msg);
                    window.location.reload();
                }).error(function(data, status) {
                    //TODO:更改对话框
                    alert('数据发生错误！');
                });
            }
            catch(e) {
                console.log(e);
            }
            $scope.infoButtonStatus = '编辑';
        }
        else {
            $scope.infoButtonStatus = '保存';
        }
     };
    // $scope.groupEditToggle = function() {
    //     //$scope.groupInfoUnEdit = !$scope.groupInfoUnEdit;
    //     //if($scope.groupInfoUnEdit) {
    //         try{
    //             $http({
    //                 method : 'post',
    //                 url : '/company/saveGroupInfo',
    //                 data : {
    //                     info : $scope.info
    //                 }
    //             }).success(function(data, status) {
    //                 //TODO:更改对话框
    //                 if(data.result === 1)
    //                     alert(data.msg);
    //                 else
    //                     alert(data.msg);
    //                 window.location.reload();
    //             }).error(function(data, status) {
    //                 //TODO:更改对话框
    //                 alert('数据发生错误！');
    //             });
    //         }
    //         catch(e) {
    //             console.log(e);
    //         }
            //$scope.groupInfoButtonStatus = '编辑队名';
        //}
        // else {
        //     $scope.groupInfoButtonStatus = '保存队名';
        // }
    //};
    $http.get('/group/getCompanyGroups').success(function(data, status) {
        $scope.team_lists = data.teams;
        $scope.cid = data.cid;
        $scope.tname= data.name;
        $scope.role = data.role;
    });
    
    $scope.setGroupId = function (tid,gid) {
        $scope.tid = tid;
        $scope.gid = gid;
        try{
            $http({
                method: 'post',
                url: '/search/user',
                data:{
                    cid: $scope.cid,
                    gid: $scope.gid,
                    tid: $scope.tid
                }
            }).success(function(data, status) {
                //发布活动后跳转到显示活动列表页面
                $scope.users = data;
            }).error(function(data, status) {
                //TODO:更改对话框
                alert('数据发生错误！');
            });
        }
        catch(e){
            console.log(e);
        }
    };
    //指定队长
    $scope.appointLeader = function (uid) {
      try{
            $http({
                method: 'post',
                url: '/company/appointLeader',
                data:{
                    cid: $scope.cid,
                    gid: $scope.gid,
                    tid: $scope.tid,
                    uid: uid
                }
            }).success(function(data, status) {
                //指定完后不跳转，可继续编辑队名等
                //window.location.reload();
                alert('队长指定成功！');
            }).error(function(data, status) {
                //TODO:更改对话框
                alert('数据发生错误！');
            });
        }
        catch(e){
            console.log(e);
        }
    };

    $scope.saveGroupInfo =function (){
        try{
            $http({
                method:'post',
                url: '/group/saveInfo',
                data:{
                    'name': $scope.team.name
                }
            }).success(function(data, status) {
                    //TODO:更改对话框
                    if(data.result === 1) {
                        alert('信息修改成功！');
                        window.location.reload();
                    }
                    else
                        alert(data.msg);
            }).error(function(data, status) {
                //TODO:更改对话框
                alert('数据发生错误！');
            });
        } 
        catch(e){
            console.log(e);
        }
    };

}]);
tabViewCompany.controller('PasswordFormController', ['$http','$scope', function($http,$scope) {
    $scope.nowpassword = '';
    $scope.newpassword = '';
    $scope.confirmpassword = '';
    $scope.change_password = function(){
        $http({
            method : 'post',
            url : '/company/changePassword',
            data : {
                'nowpassword' : $scope.nowpassword,
                'newpassword' : $scope.newpassword
            }
        }).success(function(data, status) {
            console.log(data);
            //TODO:更改对话框
            if(data.result === 1){
                alert(data.msg);
                window.location.href = '#/company_info';
            }
            else
                alert(data.msg);
        }).error(function(data, status) {
            //TODO:更改对话框
            alert('数据发生错误！');
        });
    };
}]);

tabViewCompany.controller('CompanyGroupFormController',['$http','$scope', function($http, $scope){

    //$scope.
}]);
