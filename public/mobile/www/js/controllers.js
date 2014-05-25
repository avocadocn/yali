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








.controller('CampaignListCtrl', function($scope, $rootScope, Authorize, Campaign) {
  Authorize.authorize();

  $rootScope.campaign_list = [];

  var getUserCampaigns = function() {
    Campaign.getUserCampaigns(function(campaign_list) {
      $rootScope.campaign_list = campaign_list;
    });
  };
  getUserCampaigns();

  $rootScope.$watch('campaign_list', function(newValue, oldValue) {
    if (newValue === oldValue) {
      return;
    }

    for (var i = 0; i < $rootScope.campaign_list.length; i++) {
      var start_time = new Date(newValue[i].start_time);
      var rest_time = start_time - new Date();
      if (rest_time >= 0) {
        $rootScope.campaign_list[i].rest_time = rest_time;
      } else {
        $rootScope.campaign_list[i].beyond_time = 0 - rest_time;
      }

    }


  });

  $scope.join = Campaign.join(getUserCampaigns);
  $scope.quit = Campaign.quit(getUserCampaigns);

})





.controller('CampaignDetailCtrl', function($scope, $rootScope, $stateParams, Authorize, Campaign, PhotoAlbum) {
  Authorize.authorize();

  $scope.campaign = $rootScope.campaign_list[$stateParams.campaign_index];

  $scope.photo_album_id = $scope.campaign.photo_album.pid;

  $scope.photos = [];

  var getPhotoList = function() {
    PhotoAlbum.getPhotoList($scope.photo_album_id, function(photos) {
      $scope.photos = photos;
    });
  };
  $rootScope.getPhotoList = getPhotoList;
  getPhotoList();

  $('#upload_form').ajaxForm(function() {
    getPhotoList();
  });


})






.controller('OpponentDetailCtrl', function($scope, $rootScope, $stateParams, Authorize, Campaign) {
  Authorize.authorize();


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











.controller('GroupDetailCtrl', function($scope, $rootScope, $stateParams, $http, Authorize, Campaign) {
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
    Campaign.getGroupCampaigns($scope.group._id, function(campaign_list) {
      $scope.campaign_list = campaign_list;
      $scope.template = $scope.templates[1];
    });
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










.directive('finishRepeatDirective', function($rootScope) {
  return function(scope, element, attrs) {
    $(element).find('.js_delete_form').ajaxForm(function() {
      $rootScope.getPhotoList();
    });
  };
})











