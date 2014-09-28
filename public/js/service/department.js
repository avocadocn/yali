'use strict';

angular.module('donler')

.factory('Department', ['$http', function($http) {

  var getTags = function(did,callback){
    $http.get('/department/getTags/'+did).success(function(data, status) {
      callback(null,data);
    }).error(function(data, status){
      callback('error');
    });
  };

  return {
    getTags: getTags
  };
}]);