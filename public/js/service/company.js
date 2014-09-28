'use strict';

angular.module('donler')

.factory('Company', ['$http', function($http) {

  var getTags = function(cid,callback){
    $http.get('/company/getTags/'+cid).success(function(data, status) {
      callback(null,data);
    }).error(function(data, status){
      callback('error');
    });
  };

  return {
    getTags: getTags
  };
}]);