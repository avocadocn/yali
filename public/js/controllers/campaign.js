'use strict';

var campaignApp = angular.module('campaignApp', []);

campaignApp.controller('campaignController', ['$scope', '$http', function($scope, $http) {
    $scope.joinCampaign = function (cid) {
        return 0;
    };
    $scope.quitCampaign = function (cid) {
        return 0;
    };
}]);