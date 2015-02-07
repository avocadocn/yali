define(['./member'], function (member) {
  return member.factory('memberService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      /**
       * 获取公司成员
       * @param  {String} 公司id
       * @param {Object} 参数 resultType :1 任命队长时获取，2 统计成员时获取， 3待激活用户
       * @return {HttpPromise}    
       */
      getMembers: function (id,params) {

       return $http.get(apiBaseUrl + '/users/list/' + id,{params:params});
      },
      /**
       * 激活用户
       * @param  {String} id 用户id
       * @return {HttpPromise}    
       */
      active: function (id) {
        return $http.post(apiBaseUrl + '/users/'+id+'/active');
      }

    }
  }]);
});