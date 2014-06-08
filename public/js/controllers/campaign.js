'use strict';

var campaignApp = angular.module('campaign', []);

campaignApp.controller('campaignController', ['$scope', '$http', function($scope, $http) {
    $scope.joinCampaign = function (cid) {
        console.log("!!!!!!");
        alert("!!!");
    };
    $scope.quitCampaign = function (cid) {
        return 0;
    };
}]);