// Ionic Starter App

angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'starter.filter'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'AppCtrl'
    })

    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl'
    })
    .state('app.index', {
      url: '/index',
      views: {
        'menuContent': {
          templateUrl: 'templates/index.html',
          controller: 'IndexCtrl'
        }
      }
    })
    .state('app.campaignList', {
      url: '/campaign_list',
      views: {
        'menuContent': {
          templateUrl: 'templates/campaign_list.html',
          controller: 'CampaignListCtrl'
        }
      }
    })

    .state('app.campaignDetail', {
      url: '/campaign_detail/:id',
      views: {
        'menuContent': {
          templateUrl: 'templates/campaign_detail.html',
          controller: 'CampaignDetailCtrl'
        }
      }
    })



    .state('app.scheduleList', {
      url: '/schedule_list',
      views: {
        'menuContent': {
          templateUrl: 'templates/schedule_list.html',
          controller: 'ScheduleListCtrl'
        }
      }
    })

    // .state('app.dynamicList', {
    //   url: "/dynamic_list",
    //   views: {
    //     'menuContent': {
    //       templateUrl: 'templates/dynamic_list.html',
    //       controller: 'DynamicListCtrl'
    //     }
    //   }
    // })

    // .state('app.groupJoinedList', {
    //   url: '/group_list/joined',
    //   views: {
    //     'menuContent': {
    //       templateUrl: 'templates/group_list.html',
    //       controller: 'GroupJoinedListCtrl'
    //     }
    //   }
    // })

    // .state('app.groupUnjoinList', {
    //   url: '/group_list/unjoin',
    //   views: {
    //     'menuContent': {
    //       templateUrl: 'templates/group_list.html',
    //       controller: 'GroupUnjoinListCtrl'
    //     }
    //   }
    // })

    // .state('app.groupInfo', {
    //   url: '/group/:id/info',
    //   views: {
    //     'menuContent': {
    //       templateUrl: 'templates/group_detail.html',
    //       controller: 'GroupInfoCtrl'
    //     }
    //   }
    // })

    // .state('app.groupCampaigns', {
    //   url: '/group/:id/campaigns',
    //   views: {
    //     'menuContent': {
    //       templateUrl: 'templates/group_detail.html',
    //       controller: 'GroupCampaignCtrl'
    //     }
    //   }
    // })

    // .state('app.groupDynamics', {
    //   url: '/group/:id/dynamics',
    //   views: {
    //     'menuContent': {
    //       templateUrl: 'templates/group_detail.html',
    //       controller: 'GroupDynamicCtrl'
    //     }
    //   }
    // })


    .state('app.timeline', {
      url: '/timeline',
      views: {
        'menuContent': {
          templateUrl: 'templates/timeline.html',
          controller: 'TimelineCtrl'
        }
      }
    })


    // .state('app.userInfo', {
    //   url: '/user_info',
    //   views: {
    //     'menuContent': {
    //       templateUrl: 'templates/user_info.html',
    //       controller: 'UserInfoCtrl'
    //     }
    //   }
    // })

    // .state('app.otherUserInfo', {
    //   url: '/other_user_info/:uid',
    //   views: {
    //     'menuContent': {
    //       templateUrl: 'templates/user_info.html',
    //       controller: 'OtherUserInfoCtrl'
    //     }
    //   }
    // });



  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');


});

function initPushwoosh() {
  
  var pushNotification = window.plugins.pushNotification;
//    console.log('Received Event: ');
//    console.warn(pushNotification);
  //set push notification callback before we initialize the plugin
  document.addEventListener('push-notification', function(event) {
                //get the notification payload
                var notification = event.notification;

                //display alert to the user for example
                alert(notification.aps.alert);
                
                //clear the app badge
                pushNotification.setApplicationIconBadgeNumber(0);
              });

  
    //initialize the plugin
    pushNotification.onDeviceReady({pw_appid:"B13D4-3532F"});

    //register for pushes
  pushNotification.registerDevice(function(status) {
                                        var deviceToken = status['deviceToken'];
                                        console.warn('registerDevice: ' + deviceToken);
                  },
                  function(status) {
                                        console.warn('failed to register : ' + JSON.stringify(status));
                                        navigator.notification.alert(JSON.stringify(['failed to register ', status]));
                  });
    
  pushNotification.setApplicationIconBadgeNumber(0);
    
  pushNotification.getTags(function(tags) {
                console.warn('tags for the device: ' + JSON.stringify(tags));
               },
               function(error) {
                console.warn('get tags error: ' + JSON.stringify(error));
               });

  pushNotification.getPushToken(function(token) {
                  console.warn('push token device: ' + token);
               });

  pushNotification.getPushwooshHWID(function(token) {
                  console.warn('Pushwoosh HWID: ' + token);
                });

  //start geo tracking.
    pushNotification.startLocationTracking(function() {
                                           console.warn('Location Tracking Started');
                                           });
}
initPushwoosh();
