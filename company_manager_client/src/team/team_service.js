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
      getGroups: function () {
        return $http.get(apiBaseUrl + '/groups');
      },
      /**
       * 更新小队的信息
       * @param  {String} id         小队id
       * @param  {[type]} updateData 更新的数据
       * @return {HttpPromise}
       */
      update: function (id, updateData) {
        return $http.put(apiBaseUrl + '/teams/' +id, updateData);
      },
      /**
       * 编辑logo
       * @param  {String}   id       小队id
       * @param  {Object}   fd       更新的数据,包含logo
       * @param  {Function} callback [description]
       */
      editLogo: function (id, fd, callback) {
        $.ajax({
          url: apiBaseUrl + '/teams/' + id,
          type: 'PUT',
          data: fd,
          processData: false,  // 告诉jQuery不要去处理发送的数据
          contentType: false,  // 告诉jQuery不要去设置Content-Type请求头
          headers: {
            'x-access-token': $http.defaults.headers.common['x-access-token']
          },
          success: function (data, status) {
            callback();
          },
          error: function (data, status) {
            callback(data.msg || 'error');
          }
        });
      },
      /**
       * 创建小队
       * @param  {Object} postData 小队信息
       * @return {HttpPromise}
       */
      create: function (postData) {
        return $http.post(apiBaseUrl + '/teams',postData);
      },
      /**
       * 关闭小队
       * @param  {String} tid 小队id
       * @return {HttpPromise}
       */
      close: function (tid) {
        return $http.delete(apiBaseUrl + '/teams/' +tid);
      },
      /**
       * 打开小队
       * @param  {String} tid 小队id
       * @return {HttpPromise}
       */
      open: function (tid) {
        return $http.post(apiBaseUrl + '/teams/' +tid +'/actions/open');
      },
      /**
       * 获取小队封面
       * @param  {String} tid 小队id
       * @return {HttpPromise}     [description]
       */
      getFamilyPhotos: function (tid) {
        return $http.get(apiBaseUrl + '/teams/' +tid +'/family_photos');
      },
      /**
       * 上传小队封面
       * @param  {String} id 小队id
       * @return {HttpPromise}     [description]
       */
      uploadFamilyPhotos: function (id, fd, callback) {
        $.ajax({
          url: apiBaseUrl + '/teams/' + id+'/family_photos',
          type: 'POST',
          data: fd,
          processData: false,  // 告诉jQuery不要去处理发送的数据
          contentType: false,  // 告诉jQuery不要去设置Content-Type请求头
          headers: {
            'x-access-token': $http.defaults.headers.common['x-access-token']
          },
          success: function (data, status) {
            callback();
          },
          error: function (data, status) {
            callback(data.msg || 'error');
          }
        });
      }
    }
  }]);
});