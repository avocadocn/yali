angular.module('starter.controllers', [])

// html template get user info from $rootScope
.controller('AppCtrl', function($scope, $rootScope, Authorize) {
  $scope.logout = Authorize.logout;
  $rootScope.base_url = 'http://www.donler.cn:3000';
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

  $rootScope.campaign_owner = 'user';
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






















.controller('CampaignDetailCtrl', function($scope, $rootScope, $state, $stateParams, Authorize, Campaign, PhotoAlbum, Map) {

  Authorize.authorize();

  $scope.campaign = $rootScope.campaign_list[$stateParams.campaign_index];

  $scope.photo_album_id = $scope.campaign.photo_album.pid;

  $scope.comment = '';

  $scope.photos = [];

  var getPhotoList = function() {
    PhotoAlbum.getPhotoList($scope.photo_album_id, function(photos) {
      $scope.photos = photos;
    });
  };
  getPhotoList();

  $('#upload_form').ajaxForm(function() {
    getPhotoList();
  });

  var getCampaigns = function() {
    if ($rootScope.campaign_owner === 'user') {
      Campaign.getUserCampaigns(function(campaign_list) {
        $rootScope.campaign_list = campaign_list;
        $scope.campaign = $rootScope.campaign_list[$stateParams.campaign_index];
      });
    } else if ($rootScope.campaign_owner === 'group') {
      Campaign.getGroupCampaigns($rootScope.group_id ,function(campaign_list) {
        $rootScope.campaign_list = campaign_list;
        $scope.campaign = $rootScope.campaign_list[$stateParams.campaign_index];
      });
    }

  };


  $scope.join = Campaign.join(getCampaigns);
  $scope.quit = Campaign.quit(getCampaigns);

  $scope.deletePhoto = PhotoAlbum.deletePhoto($scope.photo_album_id, getPhotoList);
  $scope.commentPhoto = PhotoAlbum.commentPhoto($scope.photo_album_id, getPhotoList);


  //Map.map('location', $scope.campaign.location);



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

  $rootScope.campaign_owner = 'group';

  $scope.group = $rootScope.show_list[$stateParams.group_index];

  $rootScope.group_id = $scope.group._id;

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
      $rootScope.campaign_list = campaign_list;
      $scope.template = $scope.templates[1];
    });
  };

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

  $scope.dynamic = function() {
    $http.get('http://www.donler.com:3000/group/getGroupMessages/' + $scope.group._id).
      success(function(data, status, headers, config) {
        $scope.dynamic_list = data.group_messages;
        $scope.template = $scope.templates[2];
      }
    );
  };

})











.controller('TimelineCtrl', function($scope, $rootScope, Authorize, Timeline) {

  Authorize.authorize();

  Timeline.getUserTimeline(function(time_lines) {
    $rootScope.time_lines = time_lines;
  });

})












.controller('UserInfoCtrl', function($scope, $rootScope, Authorize, User) {

  Authorize.authorize();

  User.getInfo($rootScope._id, function(user) {
    $scope.user = user;
  });

})












.controller('OtherUserInfoCtrl', function($scope, $stateParams, Authorize, User) {

  Authorize.authorize();

  User.getInfo($stateParams.uid, function(user) {
    $scope.user = user;
  });


})







.directive('thumbnailPhotoDirective', function() {
  return function(scope, element, attrs) {

    var thumbnail = function(img) {
      if (img.width * 110 > img.height * 138) {
        element[0].style.height = '100%';
      } else {
        element[0].style.width = '100%';
      }
    };

    var img = new Image();
    img.src = attrs.ngSrc;

    if (img.complete) {
      thumbnail(img);
      img = null;
    } else {
      img.onload = function() {
        thumbnail(img);
        img = null;
      };
    }


  };
})







