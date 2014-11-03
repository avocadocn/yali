'use strict';

var donler = angular.module('donler');

donler.controller('TeamPageController', ['$scope', 'Team', function($scope, Team) {

  //todo 获取该页面小队的id
  var data = document.getElementById('data').dataset;
  var teamId = data.id;

  Team.getTeamInfo(teamId, function (err, data) {
    if (err) {
      alertify.alert('抱歉，获取数据失败，请刷新页面重试。');
    } else {
      $scope.team = data.team;
      console.log($scope.team)
    }
  });

}])

