angular.module('starter.controllers', [])

// html template get user info from $rootScope
.controller('AppCtrl', function($scope, $rootScope, Authorize) {
  $scope.logout = Authorize.logout;

})

.controller('LoginCtrl', function($scope, $rootScope, $http, $state, Authorize) {

  if (Authorize.authorize() === true) {
    $state.go('app.campaignList');
  }

  $scope.data = {
    username: '',
    password: ''
  };

  $scope.loginMsg = '';

  $scope.login = Authorize.login($scope, $rootScope);
})

.controller('CampaignListCtrl', function($scope, Authorize, Campaign) {
  Authorize.authorize();

  $scope.campaign_list = [];

  var getCampaigns = function() {
    Campaign.getCampaigns(function(campaign_list) {
      $scope.campaign_list = campaign_list;
    });
  };
  getCampaigns();

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

  $scope.join = Campaign.join(getCampaigns);
  $scope.quit = Campaign.quit(getCampaigns);

})

.controller('ScheduleListCtrl', function($scope, Authorize, Schedule) {
  Authorize.authorize();

  var getSchedules = function() {
    Schedule.getSchedules(function(schedule_list) {
      $scope.schedule_list = schedule_list;
    });
  };
  getSchedules();

  $scope.quit = Schedule.quit(getSchedules);
})


.controller('DynamicListCtrl', function($scope, Authorize, Dynamic) {
  Authorize.authorize();

  Dynamic.getDynamics(function(dynamic_list) {
    $scope.dynamic_list = dynamic_list;
  });


  $scope.vote = Dynamic.vote($scope.dynamic_list, function(positive, negative) {
    $scope.dynamic_list[index].positive = positive;
    $scope.dynamic_list[index].negative = negative;
  });

})

.controller('GroupListCtrl', function($scope, $rootScope, $http, Authorize, Group) {
  Authorize.authorize();

  $rootScope.show_list = [];

  Group.getGroups(function(joined_groups, unjoin_groups) {
    $scope.joined_list = joined_groups;
    $scope.unjoin_list = unjoin_groups;
    $rootScope.show_list = $scope.joined_list;
  });

  $scope.joinedList = function() {
    $rootScope.show_list = $scope.joined_list;
  };

  $scope.unjoinList = function() {
    $rootScope.show_list = $scope.unjoin_list;
  };

})

.controller('GroupDetailCtrl', function($scope, $rootScope, $stateParams, $http, Authorize) {
  Authorize.authorize();

  $scope.group = $rootScope.show_list[$stateParams.group_index];

  $scope.templates = [
    'templates/_group_info.html',
    'templates/_campaigns.html',
    'templates/_dynamics.html'
  ];

  $scope.template = $scope.templates[0];

  $scope.info = function() {
    $scope.template = $scope.templates[0];
  };

  $scope.campaign = function() {
    $http.get('/group/' + $scope.group._id + '/campaigns').
      success(function(data, status, headers, config) {
        $scope.campaign_list = data.data;
        $scope.template = $scope.templates[1];
      }
    );
  };

  $scope.dynamic = function() {
    $http.get('/group/getGroupMessages/' + $scope.group._id).
      success(function(data, status, headers, config) {
        $scope.dynamic_list = data.group_messages;
        $scope.template = $scope.templates[2];
      }
    );
  };

})

.controller('UserInfoCtrl', function($scope, $rootScope, Authorize, GetUserInfo) {
  Authorize.authorize();

  GetUserInfo($rootScope._id, function(user) {
    $scope.user = user;
  });

})
















