angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, Authorize) {
  $scope.logout = Authorize.Logout;
})

.controller('LoginCtrl', function($scope, $http, $state, Authorize) {

  if (Authorize.Authorize() === true) {
    $state.go('app.campaignList');
  }

  $scope.data = {
    username: '',
    password: ''
  };

  $scope.login = Authorize.Login;
})

.controller('CampaignListCtrl', function($scope, $http, $state, Authorize) {
  Authorize.Authorize();

  $http.get('/users/getCampaigns').
    success(function(data, status, headers, config) {
      $scope.campaign_list = data.data;
    });

  $scope.join = function(id) {
    $http.post('/users/joinCampaign', { campaign_id: id }).
      success(function(data, status, headers, config) {
      });
  };
})

.controller('ScheduleListCtrl', function($scope, $http, $state, Authorize) {
  Authorize.Authorize();

  $http.get('/users/schedules').
    success(function(data, status, headers, config) {
      $scope.schedule_list = data.data;
    });

  $scope.quit = function(id) {
    $http.post('/users/quitCampaign', { campaign_id: id }).
      success(function(data, status, headers, config) {

      });
  };
})