define(['./account', 'app'], function (account) {
  return account.factory('unAuthRedirectService', ['$q', '$location', function ($q, $location) {
    return {
      requestError: function(config) {
        console.log(config)
      },
      response: function(res) {
        return res|| $q.when(res);
      },
      responseError: function(res) {
        if (res.status === 401) {
          $location.path('/login');
          // location.href = '/company/manager/#/login';
        }
        return $q.reject(res);
      }
    };
  }])
    .factory('accountService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
      return {

        /**
         * 登录
         * @param {{username: String, password: String}} postData
         * @returns {HttpPromise}
         */
        login: function (postData) {
          return $http.post(apiBaseUrl + '/companies/login', postData);
        },

        /**
         * 注销
         * @returns {HttpPromise}
         */
        logout: function () {
          return $http.post(apiBaseUrl + '/companies/logout');
        },

        /**
         * 获取公司账号资料
         * @param {String} id 公司id
         * @returns {HttpPromise}
         */
        get: function (id) {
          return $http.get(apiBaseUrl + '/companies/' + id);
        },

        /**
         * 更新公司信息
         * @param  {String} id         公司id
         * @param  {Object} updateData 需要更新的公司数据
         * @return {HttpPromise}            
         */
        update: function (id, updateData) {
          return $http.put(apiBaseUrl + '/companies/' +id, updateData);
        }
      }
    }]);
});