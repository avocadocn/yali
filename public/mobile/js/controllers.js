angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope) {
})

.controller('LoginCtrl', function($scope, $http, $rootScope) {
  $scope.data = {
    username: '',
    password: ''
  };

  $scope.login = function() {
    $http.post('/users/login', { username: $scope.data.username, password: $scope.data.password }).
      success(function(data, status, headers, config) {
        if (data.result === 1) {
          $rootScope.authorize = true;
          window.location = '#/app/playlists';
        } else {

        }
      });
  };
})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
})
