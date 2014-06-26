'use strict';

var messageApp = angular.module('mean.main');

messageApp.controller('messageController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {

    $http.get('/message/init').success(function(data, status) {
        
    });
}]);