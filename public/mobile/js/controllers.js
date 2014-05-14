angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope) {

})

.controller('LoginCtrl', function($scope, $http, $rootScope, $state, Authorize) {

  if (Authorize.Authorize() === true) {
    $state.go('app.campaign_list');
  }

  $scope.data = {
    username: '',
    password: ''
  };

  $scope.login = function() {
    $http.post('/users/login', { username: $scope.data.username, password: $scope.data.password }).
      success(function(data, status, headers, config) {
        if (data.result === 1) {
          Authorize.Login();
          $state.go('app.campaign_list');
        }
      });
  };
})

.controller('CampaignListCtrl', function($scope, $http, Authorize, $state) {
  Authorize.Authorize();
  $http.get('/users/getCampaigns').
    success(function(data, status, headers, config) {
      $scope.campaign_list = data.data;
    });

  $scope.join = function(id) {
    $http.post('/users/joinCampaign', { campaign_id: id }).
      success(function(data, status, headers, config) {
      });
  }
})

.controller('ScheduleListCtrl', function($scope, $http, Authorize, $state) {
  Authorize.Authorize();
  $http.get('/users/schedules').
    success(function(data, status, headers, config) {
      $scope.schedule_list = data.data;
    });
})