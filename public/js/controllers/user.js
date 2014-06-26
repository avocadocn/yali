'use strict';

var userApp = angular.module('mean.main');

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
    $http.get('/group/getCompanyGroups').success(function(data, status) {
        $scope.cid = data.cid;
        $scope.groups = data.teams;
        $scope.teams = [];

        //显示在员工选小队的界面供其选择
        for(var i = 0, length = $scope.groups.length; i < length; i++) {
            $scope.teams.push({
                'gid':$scope.groups[i].gid,
                'group_type':$scope.groups[i].group_type,
                'entity_type':$scope.groups[i].entity_type,
                'name':$scope.groups[i].name,
                'logo':$scope.groups[i].logo,
                'id':$scope.groups[i]._id,
                'select':'0'
            });
        }
    }).error(function(data,status) {
        $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.FETCH +
                                                        $rootScope.lang_for_msg[$rootScope.lang_key].value.TEAM +
                                                            $rootScope.lang_for_msg[$rootScope.lang_key].value.FAILURE);
    });
    $scope.selected = [];


    $scope.group_next = function() {
        $scope.selected.length = 0;

        var tick = 0;
        var gid = '';

        //挑选出员工已经选择的小队
        for(var i = 0; i < $scope.teams.length; i ++) {
            if($scope.teams[i].select == '1') {
                $scope.selected.push({
                    'gid' : $scope.teams[i].gid,
                    '_id' : $scope.teams[i].id,
                    'group_type' : $scope.teams[i].group_type,
                    'entity_type' : $scope.teams[i].entity_type,
                    'name' : $scope.teams[i].name,
                    'leader' : false,
                    'logo' : $scope.teams[i].logo
                });
                /*
                if($scope.teams[i].gid != gid) {
                    var team = [{
                        'logo' : $scope.teams[i].logo,
                        'id' : $scope.teams[i].id,
                        'name' : $scope.teams[i].name,
                        'leader' : false
                    }];
                    $scope.selected.push({
                        '_id': $scope.teams[i].gid,
                        'group_type': $scope.teams[i].group_type,
                        'entity_type': $scope.teams[i].entity_type,
                        'team': team
                    });
                    tick = i;
                    gid = $scope.teams[i].gid;
                } else {
                    $scope.teams[tick].team.push({
                        'logo' : $scope.teams[i].logo,
                        'id' : $scope.teams[i].id,
                        'name' : $scope.teams[i].name,
                        'leader' : false
                    });
                }
                */
            }
        }

        //置入虚拟小队
        $scope.selected.push({
            'gid' : '0',
            '_id' : $scope.cid,
            'group_type' : 'virtual',
            'entity_type' : 'virtual',
            'name' : 'virtual',
            'leader' : false,
            'logo' : 'null'   //TODO 记得给虚拟小队弄一个默认logo啊!
        });
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


