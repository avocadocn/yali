'use strict';

angular.module('donler')

.factory('Report', ['$http', function ($http) {

  // var get = function (type, id, callback, create_date) {
  //   $http.post('/report/pull/', { host_type : host_type, id : id})
  //   .success(function (data, status) {
  //     callback(null, data.comments, data.has_next);
  //   })
  //   .error(function (data, status) {
  //     callback('error');
  //   });
  // };

  var publish = function (data, callback) {
    $http.post('/report/push/', data)
    .success(function (data, status) {
      if (data.result === 1) {
        callback(null,data.msg);
      } else {
        callback('error',data.msg);
      }
    })
    .error(function (data, status) {
      callback('error','数据发送错误');
    });
  };

  return {
    // get: get,
    publish: publish
  };

}]);