define(['./team'], function (team) {
  return team.factory('teamService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      /**
       * 活动单个小队的数据
       * @param  {String} id 小队的id
       * @return {HttpPromise}
       */
      get: function (id) {
        return $http.get(apiBaseUrl + '/teams/' + id);
      },
      /**
       * 获取公司的小队列表
       * @param  {String}   id      公司的id
       * @return {HttpPromise}            
       */
      getList: function (id) {
        return $http.get(apiBaseUrl + '/teams/',{
          params:{
            hostType:'company',
            hostId: id
          }
        });
      },
      /**
       * 更新小队的信息
       * @param  {String} id         小队id
       * @param  {[type]} updateData 更新的数据
       * @return {HttpPromise}            
       */
      update: function (id, updateData) {
          return $http.put(apiBaseUrl + '/teams/' +id, updateData);
        }
    }
  }]);
});