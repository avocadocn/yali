angular.module('starter.controllers', [])

// html template get user info from $rootScope
.controller('AppCtrl', function($scope, Authorize, Global) {
  $scope.logout = Authorize.logout;
  $scope.base_url = Global.base_url;
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



.controller('CampaignListCtrl', function($scope, $rootScope, Authorize, Campaign, Global) {

  Authorize.authorize();

  $scope.base_url = Global.base_url;

  $rootScope.campaignReturnUri = '#/app/campaign_list';

  Campaign.getUserCampaigns(function(campaign_list) {
    $scope.campaign_list = campaign_list;
  });


  $scope.join = Campaign.join(Campaign.getCampaign);
  $scope.quit = Campaign.quit(Campaign.getCampaign);

})


.controller('CampaignDetailCtrl', function($scope, $rootScope, $state, $stateParams, Authorize, Campaign, PhotoAlbum, Map, Global) {

  Authorize.authorize();

  $scope.base_url = Global.base_url;

  var campaigns = Campaign.getCampaignList();

  var index;
  for (var i = 0; i < campaigns.length; i++) {
    if (campaigns[i]._id === $stateParams.id) {
      index = i;
      $scope.campaign = campaigns[i];
      break;
    }
  }

  $scope.photo_album_id = $scope.campaign.photo_album;

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

  var updateCampaign = function(id) {
    Campaign.getCampaign(id, function(campaign) {
      $scope.campaign = campaign;
    });
  }

  $scope.join = Campaign.join(updateCampaign);
  $scope.quit = Campaign.quit(updateCampaign);

  $scope.deletePhoto = PhotoAlbum.deletePhoto($scope.photo_album_id, getPhotoList);
  $scope.commentPhoto = PhotoAlbum.commentPhoto($scope.photo_album_id, getPhotoList);


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


.controller('GroupDetailCtrl', function($scope, $rootScope, $stateParams, Authorize, Campaign, Dynamic, Global) {

  Authorize.authorize();

  $scope.base_url = Global.base_url;

  $rootScope.campaign_owner = 'group';

  for (var i = 0; i < $rootScope.show_list.length; i++) {
    if ($rootScope.show_list[i]._id === $stateParams.id) {
      var index = i;
      break;
    }
  }
  $scope.group = $rootScope.show_list[index];

  $rootScope.group_id = $scope.group._id;

  $rootScope.campaignReturnUri = '#/app/group_detail/' + $stateParams.group_index;

  $scope.templates = [
    'templates/partials/group_info.html',
    'templates/partials/campaigns.html',
    'templates/partials/dynamics.html'
  ];

  $scope.template = $scope.templates[0];

  $scope.info = function() {
    $scope.template = $scope.templates[0];
  };

  var getGroupCampaigns = function() {
    Campaign.getGroupCampaigns($scope.group._id, function(campaign_list) {
      $scope.campaign_list = campaign_list;
      $scope.template = $scope.templates[1];
    });
  }

  $scope.campaign = function() {
    getGroupCampaigns();
  };


  $scope.dynamic = function() {
    Dynamic.getGroupDynamics($scope.group._id, function(dynamics) {
      $scope.dynamic_list = dynamics;
      $scope.template = $scope.templates[2];
    })
  };

  $scope.join = Campaign.join(getGroupCampaigns);
  $scope.quit = Campaign.quit(getGroupCampaigns);

})


.controller('TimelineCtrl', function($scope, $rootScope, Authorize, Timeline) {

  Authorize.authorize();

  Timeline.getUserTimeline(function(time_lines) {
    $rootScope.time_lines = time_lines;
  });

})


.controller('UserInfoCtrl', function($scope, $rootScope, Authorize, User, Global) {

  Authorize.authorize();

  $scope.base_url = Global.base_url;

  User.getInfo($rootScope._id, function(user) {
    $scope.user = user;
  });

})


.controller('OtherUserInfoCtrl', function($scope, $stateParams, Authorize, User, Global) {

  Authorize.authorize();

  $scope.base_url = Global.base_url;

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

.directive('mapDirective', function(Map) {
  return function(scope, element, attrs) {
    Map.init(attrs.id, attrs.location);
  };
})







