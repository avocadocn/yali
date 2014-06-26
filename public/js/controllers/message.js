'use strict';



// rst.push({
//   'rec_id':messages[i].rec_id,
//   'status':messages[i].status,
//   'message_content':messages[i].MessageContent
// });
var messageApp = angular.module('mean.main');

messageApp.controller('messageController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {

    //一开始获取的是私信
    $http.get('/message/init').success(function(data, status) {
        $scope.messges = data;
        
    });
}]);