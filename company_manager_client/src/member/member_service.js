define(['./member'], function (member) {
  return member.factory('memberService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      /**
       * 获取公司成员
       * @param  {String} 公司id
       * @return {HttpPromise}    
       */
      getMembers: function (id) {
       return $http.get(apiBaseUrl + '/users/list/' + id);
      }

    }
  }]);
});