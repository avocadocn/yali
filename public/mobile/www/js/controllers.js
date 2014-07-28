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

  Campaign.getUserCampaigns($rootScope, function(campaign_list) {
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


.controller('GroupJoinedListCtrl', function($scope, Authorize, Group) {

  Authorize.authorize();

  $scope.show_list = [];

  var joined_list = Group.getJoinedGroups();
  if (joined_list === null) {
    Group.getGroups(function(joined_groups, unjoin_groups) {
      $scope.show_list = joined_groups;
    });
  } else {
    $scope.show_list = joined_list;
  }

})

.controller('GroupUnjoinListCtrl', function($scope, Authorize, Group) {

  Authorize.authorize();

  $scope.show_list = [];

  var unjoin_list = Group.getUnjoinGroups();
  if (unjoin_list === null) {
    Group.getGroups(function(joined_groups, unjoin_groups) {
      $scope.show_list = unjoin_groups;
    });
  } else {
    $scope.show_list = unjoin_list;
  }

})

.controller('GroupInfoCtrl', function($scope, $stateParams, Authorize, Group) {

  Authorize.authorize();

  $scope.template = 'templates/partials/group_info.html';
  $scope.group = Group.getGroup($stateParams.id);

})

.controller('GroupCampaignCtrl', function($scope, $rootScope, $stateParams, Authorize, Group, Campaign) {

  Authorize.authorize();

  $scope.template = 'templates/partials/campaigns.html';
  $rootScope.campaign_owner = 'group';
  $rootScope.campaignReturnUri = '#/app/group_detail/' + $stateParams.id;
  $scope.group = Group.getGroup($stateParams.id);

  var getGroupCampaigns = function() {
    Campaign.getGroupCampaigns($stateParams.id, function(campaign_list) {
      $scope.campaign_list = campaign_list;
    });
  };

  getGroupCampaigns();

  $scope.join = Campaign.join(getGroupCampaigns);
  $scope.quit = Campaign.quit(getGroupCampaigns);

})

.controller('GroupDynamicCtrl', function($scope, $stateParams, Authorize, Group, Dynamic) {

  Authorize.authorize();

  $scope.template = 'templates/partials/dynamics.html';
  $scope.group = Group.getGroup($stateParams.id);

  Dynamic.getGroupDynamics($scope.group._id, function(dynamics) {
    $scope.dynamic_list = dynamics;
  })
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







