angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, Authorize) {
  $scope.logout = Authorize.Logout;

  $scope.nickname = window.localStorage.getItem('nickname');
  $scope._id = window.localStorage.getItem('_id');
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
        $scope.campaign_list = data.data;
      }
    );
  };

  $scope.$watch('campaign_list', function(newValue, oldValue) {
    if (newValue === oldValue) {
      return;
    }

    for (var i = 0; i < $scope.campaign_list.length; i++) {
      var start_time = new Date($scope.campaign_list[i].start_time);
      var rest_time = start_time - new Date();
      $scope.campaign_list[i].rest_time = rest_time;
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

  var getSchedules = function() {
    $http.get('/users/schedules').
      success(function(data, status, headers, config) {
        $scope.schedule_list = data.data;
      }
    );
  };

  getSchedules();


  $scope.quit = function(id) {
    $http.post('/users/quitCampaign', { campaign_id: id }).
      success(function(data, status, headers, config) {
        getSchedules();
      }
    );
  };
})


.controller('DynamicListCtrl', function($scope, $http, $state, Authorize) {
  Authorize.Authorize();

  var getDynamics = function () {
    $http.get('/users/getGroupMessages').
      success(function(data, status, headers, config) {
        $scope.dynamic_list = data.group_messages;
      }
    );
  };

  $scope.vote = function(provoke_dynamic_id, status, index) {
    try {
      $http({
        method: 'post',
        url: '/users/vote',
        data:{
          provoke_message_id : provoke_dynamic_id,
          aOr : status,
          tid : $scope.dynamic_list[index].my_team_id
        }
      }).success(function(data, status) {
        if(data.msg != undefined && data.msg != null) {

        } else {
          $scope.dynamic_list[index].positive = data.positive;
          $scope.dynamic_list[index].negative = data.negative;
        }
      }).error(function(data, status) {

      });
    }
    catch(e) {
      console.log(e);
    }
  };

  getDynamics();

})

