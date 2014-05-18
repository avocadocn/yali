'use strict';

var userApp = angular.module('user', []);

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
userApp.controller('GroupsController', ['$scope','$http', function($scope, $http) {
    $http.get('/group/getCompanyGroups').success(function(data, status) {
        $scope.cid = data.cid;
        $scope.groups = data.teams;

        $scope.teams = [];

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
        alert('组件获取失败');
    });
    $scope.selected = [];


    $scope.group_next = function() {
        $scope.selected.length = 0;

        var tick = 0;
        var gid = '';
        for(var i = 0; i < $scope.teams.length; i ++) {
            if($scope.teams[i].select == '1') {
                if($scope.teams[i].gid != gid) {
                    var team = [{
                        'logo' : $scope.teams[i].logo,
                        'id' : $scope.teams[i].id,
                        'name' : $scope.teams[i].name,
                        'leader' : false
                    }];
                    $scope.selected.push({
                        'gid': $scope.teams[i].gid,
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
            }
        }

        var team_default = [{
            'logo' : 'default',
            'id' : $scope.cid,
            'name' : 'virtual',
            'leader' : false
        }];

        $scope.selected.push({
            'gid': '0',
            'group_type':'virtual',
            'entity_type': 'virtual',
            'team': team_default
        });
        try {
            $http({
                method: 'post',
                url: '/users/dealSelectGroup',
                data:{
                    selected : $scope.selected
                }
            }).success(function(data, status) {
                alert('选择组件成功！');
                window.location.href = "/users/finishRegister";
            }).error(function(data, status) {
                alert('数据发生错误！');
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);


