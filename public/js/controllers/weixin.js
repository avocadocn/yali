'use strict';

var weixinApp = angular.module('donler', [], function($locationProvider) {
  $locationProvider.html5Mode(true);
});
weixinApp
  .constant('CONFIG', {
    SOCKET_URL: 'http://192.168.2.102:3005',
  }).factory('Socket', ['$rootScope','CONFIG', function socket($rootScope, CONFIG) {
    var token = localStorage.accessToken;
    var socket;
    if(token){
      socket = io.connect(CONFIG.SOCKET_URL,{query:'token=' + token});
    }
    return {
      login: function() {
        token = localStorage.accessToken;
        if (socket) {
          // socket = io.connect(CONFIG.SOCKET_URL,{ query: 'token=' + token, forceNew: true });
          socket = io.connect(CONFIG.SOCKET_URL,{forceNew: true });
        } else {
          // socket = io.connect(CONFIG.SOCKET_URL,{query:'token=' + token});
          socket = io.connect(CONFIG.SOCKET_URL);
        }
      },
      logout: function() {
        socket.disconnect();
      },
      on: function (eventName, callback) {
        socket.on(eventName, function () {  
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      }
    };
  }])
.controller('ChatController', ['$http', '$scope', '$location','Socket', function ($http, $scope, $location, Socket) {
  Socket.login();
  Socket.emit('enterRoom',$location.search().chatRoom)
  $scope.msgs=[];
  Socket.on('message',function (message) {
    console.log(message);
    $scope.msgs.push(message);
  });
  $scope.send= function () {
      Socket.emit('talk',$scope.sendMsg)
  }
}]);


