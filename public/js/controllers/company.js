'use strict';

var companyApp = angular.module('donler');

//路由管理
companyApp.config(['$routeProvider',function ($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl:'/company/create_company_account',
      controller: 'DetailController',
      controllerAs: 'detail'
    })
    .when('/groupSelect',{
      templateUrl:'/company/select',
      controller: 'GroupsController',
      controllerAs: 'groupModel'
    })
    .when('/invite',{templateUrl:'/company/invite'})
    .otherwise({ redirectTo: '/' });

}]);

companyApp.directive('match', function($parse) {
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

//企业激活后注册企业用户名和密码
companyApp.controller('DetailController', ['$http','$scope','$rootScope', function($http,$scope,$rootScope) {
  var _this = this;
  this.create_detail = function() {
    try{
      $http({
        method: 'post',
        url: '/company/createDetail',
        data:{
          official_name : _this.official_name,
          username : _this.username,
          password : _this.password,
          child_industry: $scope.child_industry,
          parent_industry: {'_id':$scope.parent_industry._id, 'name':$scope.parent_industry.name}
        }
      }).success(function(data, status) {
        window.location.href = '#/groupSelect';

      }).error(function(data, status) {
        //TODO:更改对话框
        alertify.alert('DATA ERROR');
      });
    }
    catch(e){
      console.log(e);
    }
  };

  $http.get('/industries').success(function(data, status) {
    $scope.industries = data;
    $scope.parent_industry = data[0];
    $scope.child_industry = data[0].child_industry[0];
  });

  $scope.changeIndustry = function() {
    $scope.child_industry = $scope.parent_industry.child_industry[0];
  };
  var check_name = false;
  var check_username = false;
  var check_name_value = '正在检查公司名是否存在';
  var check_username_value = '正在检查用户名是否存在';
  this.officialNameCheck = function() {
    if(_this.official_name){
      $http({
        method: 'post',
        url: '/company/officialNameCheck',
        data:{
          official_name: _this.official_name
        }
      }).success(function(data, status) {
        if(data.result === 0) {
          _this.check_name_value = "";
          _this.check_name = true;
        } else {
          _this.check_name = false;
          _this.check_name_value = '该公司名已经存在!';
        }
      }).error(function(data, status) {
        //TODO:更改对话框
        alertify.alert('DATA ERROR');
      });
    }
  };
  this.usernameCheck = function() {
    if(_this.username){
      $http({
        method: 'post',
        url: '/company/usernameCheck',
        data:{
          username: _this.username
        }
      }).success(function(data, status) {
        if(data === "false") {
          _this.check_username_value = "";
          _this.check_username = true;
        } else {
          _this.check_username = false;
          _this.check_username_value = '该用户名已经存在!';
        }
      }).error(function(data, status) {
        //TODO:更改对话框
        alertify.alert('DATA ERROR');
      });
    }
  };

}]);

//企业选择组件
companyApp.controller('GroupsController',['$http',function($http) {
  var _this = this;
  $http.get('/group/getgroups').success(function(data,status){
    _this.groups = data;
  }).error(function(data,status) {
    //TODO:更改对话框
    alertify.alert('DATA ERROR');
  });
  this.selected_groups =[];
  this.group_next = function() {
    _this.selected_groups.length = 0;
    angular.forEach(_this.groups, function(value, key) {
      if(value.select === '1') {
        _this.selected_groups.push({
          '_id': value._id,
          'group_type': value.type,
          'entity_type': value.entity_type
        });
      }
    });
    try{
      $http({
        method : 'post',
        url : '/company/groupSelect',
        data : {
          'selected_groups' : _this.selected_groups
        }
      }).success(function(data, status) {
        //TODO:更改对话框
        window.location.href='#/invite';

      }).error(function(data, status) {
        //TODO:更改对话框
        alertify.alert('DATA ERROR');
      });
    }
    catch(e) {
      console.log(e);
    }
  };
}]);
companyApp.controller('inviteController',['$http','$scope',function($http,$scope){
  $scope.domains = [{'index':0,'domain':'','status':false},{'index':1,'domain':'','status':false}];
  $scope.addDomain = function(index){
    try{
      $http({
        method : 'post',
        url : '/company/addDomain',
        data : {
          'domain' : $scope.domains[index].domain,
          'companyId': $scope.companyId
        }
      }).success(function(data, status) {
        if(data.result===1){
          $scope.domains[index].status=true;
        }
        else{
          alertify.alert(data.msg);
        }
      }).error(function(data, status) {
        //TODO:更改对话框
        alertify.alert('DATA ERROR');
      });
    }
    catch(e) {
      console.log(e);
    }
  }
}]);
