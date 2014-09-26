'use strict';

angular.module('donler')

.factory('Group', ['$http', function($http) {

  var sponsor = function(teamId,_data,callback){
    try{
      $http({
        method: 'post',
        url: '/group/campaignSponsor/'+ teamId,
        data:_data
      }).success(function(data, status) {
        callback(null);
      }).error(function(data, status) {
        callback('error');
      });
    }
    catch(e){
      console.log(e);
    }
  };

  var getTags = function(teamId,callback){
    $http.get('/group/getTags/'+teamId).success(function(data, status) {
      callback(null,data);
    }).error(function(data, status){
      callback('error');
    });
  };

  var provoke = function(teamId,_data,callback){
    $http({
      method: 'post',
      url: '/group/provoke/'+teamId,
      data:_data
    }).success(function(data, status) {
      callback(null);
    }).error(function(data, status) {
      callback('error');
    });
  };

  return {
    sponsor:sponsor,
    getTags:getTags,
    provoke:provoke
  };
}]);