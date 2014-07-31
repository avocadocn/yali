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
  $scope.user_id = Global.user._id;
  Campaign.getCampaignDetail( $stateParams.id,function(campaign) {
    $scope.campaign = campaign;
    $scope.photo_album_id = $scope.campaign.photo_album;
    var getPhotoList = function() {
      PhotoAlbum.getPhotoList($scope.photo_album_id, function(photos) {
        $scope.photos = photos;
      });
    };
    getPhotoList();
    $('#upload_form').ajaxForm(function() {
      getPhotoList();
    });
    $scope.deletePhoto = PhotoAlbum.deletePhoto($scope.photo_album_id, getPhotoList);
    $scope.commentPhoto = PhotoAlbum.commentPhoto($scope.photo_album_id, getPhotoList);
  });

  $scope.comment_content = {
    text:''
  };

  $scope.photos = [];

  Comment.getCampaignComments($stateParams.id, function(comments) {
    $scope.comments = comments;
  });

  var updateCampaign = function(id) {
    Campaign.getCampaign(id, function(campaign) {
      $scope.campaign = campaign;
    });
  }

  $scope.join = Campaign.join(updateCampaign);
  $scope.quit = Campaign.quit(updateCampaign);
  $scope.publishComment =  function(){
    if($scope.comment_content.text==''){
      return alert('评论不能为空');
    }
    Comment.publishCampaignComment($stateParams.id, $scope.comment_content.text, function(msg) {
      if(!msg){
        $scope.comment_content.text = '';
        Comment.getCampaignComments($stateParams.id, function(comments) {
          $scope.comments = comments;
        });
      }
      else{
        alert(msg);
      }
    });
  };

})



.controller('ScheduleListCtrl', function($scope, $ionicScrollDelegate, Campaign) {

  /**
   * 日历视图的状态，有年、月、日三种视图
   * 'year' or 'month' or 'day'
   * @type {String}
   */
  $scope.view = 'month';

  /**
   * 更新日历的月视图
   * @param  {Number} year  年
   * @param  {Number} month 月，0-11
   */
  var updateMonth = function(year, month) {
    moment.lang('zh-cn');
    var mdate = moment(new Date(year, month));
    $scope.current_year = year;
    $scope.current_month = mdate.format('MMMM');
    $scope.month = [];
    for (var i = 0; i < mdate.daysInMonth(); i++) {
      $scope.month[i] = {
        full_date: new Date(year, month, i + 1),
        date: i + 1,
        events: []
      };

      // 如果是本月第一天，计算是星期几，决定位移量
      if (i === 0) {
        $scope.month[i].first_day = 'offset_' + mdate.day(); // mdate.day(): Sunday as 0 and Saturday as 6
        $scope.current_month_offset = $scope.month[i].first_day;
      }

      // 是否是周末
      var thisDay = new Date(year, month, i + 1);
      if (thisDay.getDay() === 0 || thisDay.getDay() === 6) {
        $scope.month[i].is_weekend = true;
      }

      // 是否是今天
      var now = new Date();
      if (now.getDate() === i + 1 && now.getFullYear() === year && now.getMonth() === month) {
        $scope.month[i].is_today = true;
      }

      // 将活动及相关标记存入这一天
      $scope.campaigns.forEach(function(campaign) {
        var start = moment(campaign.start_time);
        var end = moment(campaign.end_time);
        var today_end = moment(new Date(year, month, i + 1, 24));
        if (start < today_end && today_end < end
          || start.year() === year && start.month() === month && start.date() === i + 1
          || end.year() === year && end.month() === month && end.date() === i + 1) {
          $scope.month[i].events.push(campaign);
          $scope.month[i].has_event = true;
          if (campaign.is_joined) {
            $scope.month[i].has_joined_event = true;
          }
        }

      });

    }
  };

  /**
   * 进入某一天的详情
   * @param  {Date} date
   */
  $scope.updateDay = function(date) {
    $scope.view = 'day';
    if (date.getMonth() !== current.month) {
      updateMonth(date.getFullYear(), date.getMonth());
      current.year = date.getFullYear();
      current.month = date.getMonth();
    }
    current.date = date.getDate();
    $scope.current_day = {
      date: date,
      campaigns: $scope.month[date.getDate() - 1].events
    };
  };

  var now = new Date();

  /**
   * 当前浏览的日期，用于更新视图
   * @type {Object}
   */
  var current = {
    year: now.getFullYear(),
    month: now.getMonth(),
    date: now.getDate()
  };

  Campaign.getUserCampaignsForCalendar(function(campaigns) {
    $scope.campaigns = campaigns;
    updateMonth(current.year, current.month);
  });


  $scope.back = function() {
    switch ($scope.view) {
    case 'month':
      break;
    case 'day':
      $scope.view = 'month';
      break;
    }
  };

  /**
   * 根据当前视图，向前一年、一个月、一天
   */
  $scope.pre = function() {
    switch ($scope.view) {
    case 'month':
      if (current.month === 0) {
        current.year--;
        current.month = 11;
      } else {
        current.month--;
      }
      updateMonth(current.year, current.month);
      break;
    case 'day':
      break;
    }

  }

  /**
   * 根据当前视图，向后一年、一个月、一天
   */
  $scope.next = function() {
    switch ($scope.view) {
    case 'month':
      if (current.month === 11) {
        current.year++;
        current.month = 0;
      } else {
        current.month++;
      }
      updateMonth(current.year, current.month);
      break;
    case 'day':
      break;
    }

  };

  /**
   * 回到今天，仅在月、日视图下起作用
   */
  $scope.today = function() {
    var now = new Date();
    current.year = now.getFullYear();
    current.month = now.getMonth();
    current.date = now.getDate();

    switch ($scope.view) {
    case 'month':
      updateMonth(current.year, current.month);
      break;
    case 'day':
      break;
    }

  };


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
    $rootScope.campaignReturnUri = '#/app/timeline';
  });

})


// .controller('UserInfoCtrl', function($scope, User, Global) {

//   $scope.base_url = Global.base_url;

//   User.getInfo(Global.user._id, function(user) {
//     $scope.user = user;
//   });

// })


// .controller('OtherUserInfoCtrl', function($scope, $stateParams, User, Global) {

//   $scope.base_url = Global.base_url;

//   User.getInfo($stateParams.uid, function(user) {
//     $scope.user = user;
//   });


// })


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








