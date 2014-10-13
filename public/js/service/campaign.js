'use strict';

angular.module('donler')

.factory('Campaign', ['$http', function($http) {
  //发起活动、挑战
  var sponsor = function(_url,_data,callback){
    try{
      $http({
        method: 'post',
        url: _url,
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

  //获取Tags
  var getTags =function(hostType,hostId,callback){
    $http.get('/'+hostType+'/getTags/'+hostId).success(function(data, status) {
      callback(null,data);
    }).error(function(data, status){
      callback('error');
    });
  };

  // var provoke = function(teamId,_data,callback){
  //   $http({
  //     method: 'post',
  //     url: '/group/provoke/'+teamId,
  //     data:_data
  //   }).success(function(data, status) {
  //     callback(null);
  //   }).error(function(data, status) {
  //     callback('error');
  //   });
  // };

  return {
    sponsor:sponsor,
    getTags:getTags
    // provoke:provoke
  };
}]);