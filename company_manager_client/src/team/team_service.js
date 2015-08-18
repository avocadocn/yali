define(['./team'], function (team) {
  return team.factory('teamService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      /**
       * 活动单个小队的数据
       * @param  {String} id 小队的id
       * @return {HttpPromise}
       */
      get: function (id) {
        return $http.get(apiBaseUrl + '/groups/' + id);
      },

      /**
       * 获取小队成员
       * @param  {String} id 小队的id
       * @return {HttpPromise}
       */
      // getMembers: function(id) {
      //   return $http.get(apiBaseUrl + '/groups/' + id + '/members');
      // },
      /**
       * 获取公司的小队列表
       * @return {HttpPromise}
       */
      getList: function (type) {
        var params ={from:'admin'};
        if(type) params.type=type;
        return $http.get(apiBaseUrl + '/groups/list/company',{
          params:params
        });
      },
      /**
       * 更新小队的信息
       * @param  {String} id         小队的id
       * @param  {[type]} updateData 更新的数据
       * @return {HttpPromise}
       */
      update: function (id, updateData) {
        return $http.put(apiBaseUrl + '/groups/' +id, updateData);
      },
      /**
       * 编辑logo
       * @param  {String}   id       小队id
       * @param  {Object}   fd       更新的数据,包含logo
       * @param  {Function} callback [description]
       */
      editLogo: function (id, fd, callback) {
        $.ajax({
          url: apiBaseUrl + '/groups/' + id,
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
      create: function (fd,callback) {
        return $http.post(apiBaseUrl + '/groups',fd, {
          transformRequest: angular.identity,
          headers: {'Content-Type': undefined}
        });
      },
      /**
       * 关闭小队
       * @param  {String} tid 小队id
       * @return {HttpPromise}
       */
      close: function (tid) {
        return $http.delete(apiBaseUrl + '/groups/' +tid);
      },
      /**
       * 获取小队封面
       * @param  {String} tid 小队id
       * @return {HttpPromise}     [description]
       */
      // getFamilyPhotos: function (tid) {
      //   return $http.get(apiBaseUrl + '/teams/' +tid +'/family_photos');
      // },
      /**
       * 上传小队封面
       * @param  {String} id 小队id
       * @return {HttpPromise}     [description]
       */
      // uploadFamilyPhotos: function (id, fd, callback) {
      //   $.ajax({
      //     url: apiBaseUrl + '/teams/' + id+'/family_photos',
      //     type: 'POST',
      //     data: fd,
      //     processData: false,  // 告诉jQuery不要去处理发送的数据
      //     contentType: false,  // 告诉jQuery不要去设置Content-Type请求头
      //     headers: {
      //       'x-access-token': $http.defaults.headers.common['x-access-token']
      //     },
      //     success: function (data, status) {
      //       callback();
      //     },
      //     error: function (data, status) {
      //       callback(data.msg || 'error');
      //     }
      //   });
      // },
      /**
       * 升级/同意升级
       * @param  {string} tid     小队id
       * @param  {boolean} status 同意与否
       * @return {HttpPromise}    
       */
      upgrade: function(tid, status) {
        return $http.put(apiBaseUrl + '/groups/' +tid +'/update', {status:status});
      },
      /**
       * 任命管理员
       */
    }
  }]);
});