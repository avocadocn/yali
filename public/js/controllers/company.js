'use strict';

var companyApp = angular.module('company', ['ngRoute']);

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


companyApp.controller('AppointLeaderController', ['$scope', '$http', function($scope, $http) {
    $scope.appointLeader = function (gid) {
        alert(gid);
    }
}]);


//企业激活后注册企业用户名和密码
companyApp.controller('DetailController', ['$http', function($http) {
    var _this = this;
    this.create_detail = function() {
        try{
            $http({
                method: 'post',
                url: '/company/createDetail',
                data:{
                    official_name : _this.official_name,
                    username : _this.username,
                    password : _this.password
                }
            }).success(function(data, status) {
                window.location.href = '#/groupSelect';

            }).error(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e){
            console.log(e);
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
        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.FETCH_TYPE_FAILURE);
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
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
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
        console.log($scope.domains[index].domain);
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
                    $rootScope.donlerAlert(data.msg);
                }
            }).error(function(data, status) {
                //TODO:更改对话框
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    }
}]);