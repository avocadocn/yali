'use strict';

var userApp = angular.module('donler');

userApp.directive('match', function($parse) {
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

userApp.controller('ActiveController',['$http','$scope',function($http,$scope){
    $scope.active = 0;
    $scope.loading = false;
    $scope.mailCheck = function() {
        $scope.loading = true;
        var now_email = $scope.email+'@'+$scope.currentDomain;
        try{
            $http({
                method: 'post',
                url: '/users/mailCheck',
                data:{
                    login_email: now_email
                }
            }).success(function(data, status) {
                $scope.loading = false;
                $scope.active=data.active;
            }).error(function(data, status) {
                //TODO:更改对话框
                alertify.alert('DATA ERROR');
            });
        }
        catch(e){
            console.log(e);
        }
    };
}]);


userApp.controller('signupController',['$http','$scope','$rootScope',function ($http,$scope,$rootScope) {
    var departments;
  $http.get('/departmentTree/0').success(function(data, status) {
        $scope.main_department_id = 'null';
        $scope.main_department_name = 'null';
        $scope.child_department_id = 'null';
        $scope.child_department_name = 'null';

        departments = data.department;
        $scope.main_departments = [];
        $scope.child_departments = [];
        for(var i = 0; i < departments.length; i ++){
            $scope.main_departments.push({
                '_id':departments[i]._id,
                'name':departments[i].name
            });
        }

        if(departments.length > 0){
            $scope.main_department = $scope.main_departments[0];
            $scope.main_department_id = $scope.main_department._id;
            $scope.main_department_name = $scope.main_department.name;
        }
        if(departments[0].department.length > 0){
            for(var i = 0 ; i < departments[0].department.length; i ++){
                $scope.child_departments.push({
                    '_id':departments[0].department[i]._id,
                    'name':departments[0].department[i].name
                });
            }
            $scope.child_department = $scope.child_departments[0];
            $scope.child_department_id = $scope.child_department._id;
            $scope.child_department_name = $scope.child_department.name;
        }
    }).error(function(data,status) {
        alertify.alert('DATA ERROR');
    });

    $scope.selectMainDepartment = function(){
        $scope.main_department_id = 'null';
        $scope.main_department_name = 'null';
        $scope.child_department_id = 'null';
        $scope.child_department_name = 'null';
        for(var i = 0; i < departments.length; i ++){
            if(departments[i]._id === $scope.main_department._id){
                $scope.child_departments = [];
                for(var j = 0 ; j < departments[i].department.length; j ++){
                    $scope.child_departments.push({
                        '_id':departments[i].department[j]._id,
                        'name':departments[i].department[j].name
                    });
                }
                break;
            }
        }
        $scope.main_department_id = $scope.main_department._id;
        $scope.main_department_name = $scope.main_department.name;

        if(departments[0].department.length > 0){
            $scope.child_department = $scope.child_departments[0];
            $scope.child_department_id = $scope.child_department._id;
            $scope.child_department_name = $scope.child_department.name;
        }
    }

    $scope.selectChildDepartment = function(){
        $scope.child_department_id = 'null';
        $scope.child_department_name = 'null';
        $scope.child_department_id = $scope.child_department._id;
        $scope.child_department_name = $scope.child_department.name;
    }

}]);

//员工注册后在公司组件列表里选择组件
userApp.controller('GroupsController', ['$scope','$http','$rootScope', function($scope, $http,$rootScope) {
    $http.get('/group/getCompanyGroups/'+$scope.cid).success(function(data, status) {
        $scope.teams = data.teams;

        //显示在员工选小队的界面供其选择
        for(var i = 0, length = $scope.groups.length; i < length; i++) {
            $scope.teams[i].select='0';
        }
    }).error(function(data,status) {
        alertify.alert('DATA ERROR');
    });
    $scope.selected = [];


    $scope.group_next = function() {
        $scope.selected.length = 0;
        //挑选出员工已经选择的小队
        for(var i = 0; i < $scope.teams.length; i ++) {
            if($scope.teams[i].select == '1') {
                $scope.selected.push({
                    'gid' : $scope.teams[i].gid,
                    '_id' : $scope.teams[i].id,
                    'group_type' : $scope.teams[i].group_type,
                    'entity_type' : $scope.teams[i].entity_type,
                    'name' : $scope.teams[i].name,
                    'logo' : $scope.teams[i].logo
                });
            }
        }
        try {
            $http({
                method: 'post',
                url: '/users/dealSelectGroup',
                data:{
                    selected : $scope.selected
                }
            }).success(function(data, status) {
                window.location.href = "/users/finishRegister";
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);


