'use strict';

var userApp = angular.module('user', []);

userApp.controller('GroupsController', ['$scope','$http', function($scope, $http) {
    $http.get('/group/getCompanyGroups').success(function(data, status) {
        $scope.groups = data;
        for(var i = 0, length = $scope.groups.length; i < length; i++) {
            $scope.groups[i].select = '0';
        }
        console.log($scope.groups);
    }).error(function(data,status) {
        alert('组件获取失败！');
    });
    $scope.selected = [];
    $scope.group_next = function() {
        $scope.selected.length = 0;
        angular.forEach($scope.groups, function(value, key) {
            if(value.select === '1') {
                $scope.selected.push(value.group.group_type);
            }
        });
        try {
            $http({
                method: 'post',
                url: '/users/dealSelectGroup',
                data:{
                    selected : $scope.selected
                }
            }).success(function(data, status) {
                alert("选择组件成功！");
                window.location.href = "/users/finishRegister";
            }).error(function(data, status) {
                alert("数据发生错误！");
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);