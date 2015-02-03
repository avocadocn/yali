define(['./account', 'app'], function (account) {
  return account.factory('unAuthRedirectService', [function () {
    return {
      requestError: function(config) {
        console.log(config)
      },
      response: function(res) {
        return res;
      },
      responseError: function(res) {
        if (res.status === 401) {
          location.href = '/company/manager/#/login';
        }
      }
    };
  }])
    .factory('accountService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
      return {

        /**
         * 公司登录
         * @param {{username: String, password: String}} postData
         * @returns {HttpPromise}
         */
        login: function (postData) {
          return $http.post(apiBaseUrl + '/companies/login', postData);
        },

        /**
         * 获取公司账号资料
         * @param {String} id 公司id
         * @returns {HttpPromise}
         */
        get: function (id) {
          return $http.get(apiBaseUrl + '/companies/' + id);
        }

      }
    }]);
});