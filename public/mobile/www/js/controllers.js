angular.module('starter.controllers', [])


.controller('AppCtrl', function($state, $scope, Authorize, Global) {
  if (Authorize.authorize() === true) {
    $state.go('app.campaignList');
  }

  $scope.logout = Authorize.logout;
  $scope.base_url = Global.base_url;
  $scope.user = Global.user;
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



.controller('CampaignListCtrl', function($scope, $rootScope, Campaign, Global) {

  $scope.base_url = Global.base_url;

  $rootScope.campaignReturnUri = '#/app/campaign_list';

  Campaign.getUserCampaignsForList(function(campaign_list) {
    $scope.campaign_list = campaign_list;
  });


  $scope.join = Campaign.join(Campaign.getCampaign);
  $scope.quit = Campaign.quit(Campaign.getCampaign);

})


.controller('CampaignDetailCtrl', function($scope, $rootScope, $state, $stateParams, Campaign, PhotoAlbum, Comment, Map, Global) {

  $scope.base_url = Global.base_url;

  var campaigns = Campaign.getCampaignList();

  for (var i = 0; i < campaigns.length; i++) {
    if (campaigns[i]._id === $stateParams.id) {
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

  Comment.getCampaignComments($scope.campaign._id, function(comments) {
    $scope.comments = comments;
  });

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



.controller('ScheduleListCtrl', function($scope, Schedule) {

  var getSchedules = function() {
    Schedule.getSchedules(function(schedule_list) {
      $scope.schedule_list = schedule_list;
    });
  };
  getSchedules();

  $scope.quit = Schedule.quit(getSchedules);
})


// .controller('DynamicListCtrl', function($scope, Dynamic) {

//   Dynamic.getDynamics(function(dynamic_list) {
//     $scope.dynamic_list = dynamic_list;
//   });


//   $scope.vote = Dynamic.vote($scope.dynamic_list, function(positive, negative) {
//     $scope.dynamic_list[index].positive = positive;
//     $scope.dynamic_list[index].negative = negative;
//   });

// })


// .controller('GroupJoinedListCtrl', function($scope, Group) {

//   $scope.show_list = [];

//   var joined_list = Group.getJoinedGroups();
//   if (joined_list === null) {
//     Group.getGroups(function(joined_groups, unjoin_groups) {
//       $scope.show_list = joined_groups;
//     });
//   } else {
//     $scope.show_list = joined_list;
//   }

// })

// .controller('GroupUnjoinListCtrl', function($scope, Group) {

//   $scope.show_list = [];

//   var unjoin_list = Group.getUnjoinGroups();
//   if (unjoin_list === null) {
//     Group.getGroups(function(joined_groups, unjoin_groups) {
//       $scope.show_list = unjoin_groups;
//     });
//   } else {
//     $scope.show_list = unjoin_list;
//   }

// })

// .controller('GroupInfoCtrl', function($scope, $stateParams, Group) {

//   $scope.template = 'templates/partials/group_info.html';
//   $scope.group = Group.getGroup($stateParams.id);

// })

// .controller('GroupCampaignCtrl', function($scope, $rootScope, $stateParams, Group, Campaign) {

//   $scope.template = 'templates/partials/campaigns.html';
//   $rootScope.campaign_owner = 'group';
//   $rootScope.campaignReturnUri = '#/app/group_detail/' + $stateParams.id;
//   $scope.group = Group.getGroup($stateParams.id);

//   var getGroupCampaigns = function() {
//     Campaign.getGroupCampaigns($stateParams.id, function(campaign_list) {
//       $scope.campaign_list = campaign_list;
//     });
//   };

//   getGroupCampaigns();

//   $scope.join = Campaign.join(getGroupCampaigns);
//   $scope.quit = Campaign.quit(getGroupCampaigns);

// })

// .controller('GroupDynamicCtrl', function($scope, $stateParams, Group, Dynamic) {

//   $scope.template = 'templates/partials/dynamics.html';
//   $scope.group = Group.getGroup($stateParams.id);

//   Dynamic.getGroupDynamics($scope.group._id, function(dynamics) {
//     $scope.dynamic_list = dynamics;
//   })
// })



.controller('TimelineCtrl', function($scope, $rootScope, Timeline) {

  Timeline.getUserTimeline(function(time_lines) {
    $rootScope.time_lines = time_lines;
  });

})


.controller('UserInfoCtrl', function($scope, User, Global) {

  $scope.base_url = Global.base_url;

  User.getInfo(Global.user._id, function(user) {
    $scope.user = user;
  });

})


.controller('OtherUserInfoCtrl', function($scope, $stateParams, User, Global) {

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







