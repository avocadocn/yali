define(['./company', 'jQuery'], function (company, $) {
  return company.factory('companyService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      editInfo: function (id, info) {
        return $http.put(apiBaseUrl + '/companies/' + id, info);
      },

      editLogo: function (id, fd, callback) {
        $.ajax({
          url: apiBaseUrl + '/companies/' + id,
          type: 'PUT',
          data: fd,
          processData: false,  // 告诉jQuery不要去处理发送的数据
          contentType: false,  // 告诉jQuery不要去设置Content-Type请求头
          headers: {
            'x-access-token': $http.defaults.headers.common['x-access-token']
          },
          success: function (data, status) {
            if (data.result === 1) {
              callback();
            } else {
              callback(data.msg);
            }
          },
          error: function (data, status) {
            callback(data.msg || 'error');
          }
        });
      },

      getUndisposed: function(id, callback) {
        $http.get(apiBaseUrl + '/companies/' + id + '/undisposed')
        .success(function (data, status) {
          callback(null, data);
        })
        .error(function (data, status) {
          callback('获取失败');
        });
      },

      getLatestMembers: function(id) {
        return $http.get(apiBaseUrl + '/companies/' + id + '/latestMembers');
      }
    }
  }]);
});