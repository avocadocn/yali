define(['./member'], function (member) {
  return member.factory('memberService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      /**
       * 获取公司成员
       * @param  {String} 公司id
       * @param {Object} 参数 resultType :1 任命队长时获取，2 统计成员时获取， 3待激活用户，4在成员页显示多少未激活用户
       * @return {HttpPromise}    
       */
      getMembers: function (id, params) {
       return $http.get(apiBaseUrl + '/users/list/' + id,{params:params});
      },
      /**
       * 获取公司被举报的员工
       * @param  {String} id     公司id
       * @return {HttpPromise}    
       */
      getReportedMembers: function (id) {

       return $http.get(apiBaseUrl + '/companies/' + id +'/reportedMembers');
      },
      /**
       * 获取员工的评论
       * @param  {String} id     员工id
       * @return {HttpPromise}    
       */
      getMemberComments: function (id) {

       return $http.get(apiBaseUrl + '/users/' + id +'/comments');
      },
      /**
       * 激活用户
       * @param  {String} id 用户id
       * @return {HttpPromise}    
       */
      active: function (id) {
        return $http.post(apiBaseUrl + '/users/'+id+'/active');
      },

      /**
       * 屏蔽用户
       * @param  {String} id 用户id
       * @return {HttpPromise}    
       */
      close: function (id) {
        return $http.post(apiBaseUrl + '/users/'+id+'/close');
      },

      /**
       * 处理用户举报
       * @param  {Object} dealData 处理数据
       * @return {HttpPromise}    
       */
      deal: function (dealData) {
        return $http.put(apiBaseUrl + '/report', dealData);
      },

      /**
       * 邀请用户注册
       * @param {String} email 邮箱
       * @returns {HttpPromise}
       */
      invite: function (email) {
        return $http.post(apiBaseUrl + '/users/actions/invite', { email: email });
      },
      batchInviteCheck: function (members) {
        return $http.post(apiBaseUrl + '/users/actions/batchinvite', { members: members });
      },
      /**
       * 批量邀请用户注册
       * @param {String} email 邮箱
       * @returns {HttpPromise}
       */
      batchInvite: function (members) {
        return $http.post(apiBaseUrl + '/users/actions/batchinvite', { members: members,operate:true });
      },
      edit: function (uid,user) {
        return $http.put(apiBaseUrl + '/users/'+uid, user);
      }

    };
  }]);
});