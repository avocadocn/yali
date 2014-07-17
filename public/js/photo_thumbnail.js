'use strict';


var app = angular.module('donler');
var photo_album_id = $('#photo_album_id').val();
app.controller('PhotoListCtrl', ['$scope', '$http', function($scope, $http) {
  $scope.photos = [];
  $http.get('/photoAlbum/' + photo_album_id + '/photolist')
  .success(function(data, status) {
    $scope.photos = data.data;
  });

}]);

//angular.bootstrap($('#photo_list'), ['photo_list']);