angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, Authorize) {
  $scope.logout = Authorize.Logout;

  $scope.nickname = window.localStorage.getItem('nickname');
})

.controller('LoginCtrl', function($scope, $http, $state, Authorize) {

  if (Authorize.Authorize() === true) {
    $state.go('app.campaignList');
  }

  $scope.data = {
    username: '',
    password: ''
  };

  $scope.loginMsg = '';

  $scope.login = Authorize.Login($scope);
})

.controller('CampaignListCtrl', function($scope, $http, $state, Authorize) {
  Authorize.Authorize();

  var getCampaigns = function() {
    $http.get('/users/campaigns').
      success(function(data, status, headers, config) {
        $scope.campaignList = data.data;
      }
    );
  };

  $scope.$watch('campaignList', function(newValue, oldValue) {
    if (newValue === oldValue) {
      return;
    }

    for (var i = 0; i < $scope.campaignList.length; i++) {
      var startTime = new Date($scope.campaignList[i].startTime);
      var restTime = startTime - new Date();
      $scope.campaignList[i].restTime = restTime;
    }

  });

  getCampaigns();

  $scope.join = function(id) {
    $http.post('/users/joinCampaign', { campaign_id: id }).
      success(function(data, status, headers, config) {
        getCampaigns();
      }
    );
  };

  $scope.quit = function(id) {
    $http.post('/users/quitCampaign', { campaign_id: id }).
      success(function(data, status, headers, config) {
        getCampaigns();
      }
    );
  }

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