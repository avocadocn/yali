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

  $scope.campaign_list = [];

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
      var start_time = new Date(newValue[i].start_time);
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
    $http.post('/users/vote', {
        provoke_message_id: provoke_dynamic_id,
        aOr: status,
        tid: $scope.dynamic_list[index].my_team_id
      }
    ).success(function(data, status) {
      if(data.msg != undefined && data.msg != null) {

      } else {
        $scope.dynamic_list[index].positive = data.positive;
        $scope.dynamic_list[index].negative = data.negative;
      }
    }).error(function(data, status) {

    });
  };

  getDynamics();

})

.controller('GroupListCtrl', function($scope, $rootScope, $http, $state, $stateParams, Authorize) {
  Authorize.Authorize();

  $rootScope.show_list = [];

  var getGroups = function() {
    $http.get('/users/groups').
      success(function(data, status, headers, config) {
        $scope.joined_list = data.joined_groups;
        $scope.unjoin_list = data.unjoin_groups;
        $rootScope.show_list = $scope.joined_list;
      }
    );
  };

  $scope.joinedList = function() {
    $rootScope.show_list = $scope.joined_list;
  };

  $scope.unjoinList = function() {
    $rootScope.show_list = $scope.unjoin_list;
  };

  getGroups();


})

.controller('GroupDetailCtrl', function($scope, $rootScope, $stateParams, $http, Authorize) {
  Authorize.Authorize();

  $scope.group = $rootScope.show_list[$stateParams.group_index];

  $scope.templates = ['templates/_group_info.html', 'templates/_campaigns.html'];

  $scope.template = $scope.templates[0];

  $scope.info = function() {
    $scope.template = $scope.templates[0];
  };

  $scope.campaign = function() {
    console.log('/group/' + $scope.group._id + '/campaigns');
    $http.get('/group/' + $scope.group._id + '/campaigns').
      success(function(data, status, headers, config) {
        $scope.campaign_list = data.data;
        $scope.template = $scope.templates[1];
      }
    );
  };

})
















