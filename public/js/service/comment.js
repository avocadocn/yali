'use strict';

angular.module('donler')

  .factory('Comment', ['$http', function ($http) {

    var get = function (type, id, callback, create_date, num) {
      $http.post('/comment/pull/' + type + '/' + id, { create_date: create_date ,num: num})
        .success(function (data, status) {
          callback(null, data.comments, data.nextStartDate);
        })
        .error(function (data, status) {
          callback('error');
        });
    };

    var publish = function (data, callback) {
      $http.post('/comment/push/'+data.host_type+'/'+data.host_id, data)
        .success(function (data) {
          // ugly api
          if (data.msg === 'SUCCESS') {
            callback(null, data.comment);
          } else {
            callback('error');
          }
        })
        .error(function () {
          callback('error');
        });
    };

    var remove = function (comment_id, callback) {
      $http.delete('/comment/' + comment_id)
        .success(function (data) {
          if (data.result === 1) {
            callback();
          } else {
            callback('error');
          }
        })
        .error(function () {
          callback('error');
        });
    };

    var reply = function (comment_id, to, content, callback) {
      $http.post('/comment/' + comment_id + '/reply', {
        to: to,
        content: content
      }).success(function (data, status) {
        if (data.result === 1) {
          callback(null, data.reply);
        } else {
          callback('error');
        }
      }).error(function (data, status) {
        callback('error');
      });
    };

    var getReplies = function (comment_id, callback) {
      $http.get('/comment/' + comment_id + '/replies')
        .success(function (data, status) {
          if (data.result === 1) {
            callback(null, data.replies);
          } else {
            callback('error');
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    };

    return {
      get: get,
      publish: publish,
      reply: reply,
      remove: remove,
      getReplies: getReplies
    };

  }]);