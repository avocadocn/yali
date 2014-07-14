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
//员工注册后在公司组件列表里选择组件
userApp.controller('GroupsController', ['$scope','$http','$rootScope', function($scope, $http,$rootScope) {
    $http.get('/group/getCompanyGroups/'+$scope.cid).success(function(data, status) {
        $scope.teams = data.teams;

        //显示在员工选小队的界面供其选择
        for(var i = 0, length = $scope.groups.length; i < length; i++) {
            $scope.teams[i].select='0';
        }
    }).error(function(data,status) {
        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.FETCH +
                                                        $rootScope.lang_for_msg[$rootScope.lang_key].value.TEAM +
                                                            $rootScope.lang_for_msg[$rootScope.lang_key].value.FAILURE);
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
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.SELECT +
                                                        $rootScope.lang_for_msg[$rootScope.lang_key].value.TEAM +
                                                            $rootScope.lang_for_msg[$rootScope.lang_key].value.SUCCESS);
                window.location.href = "/users/finishRegister";
            }).error(function(data, status) {
                $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);


