define(['./account', 'app'], function (account) {
  return account.factory('UnAuthRedirectService', [function () {
    var UnAuthRedirectService = {
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
    return UnAuthRedirectService;
  }])
    .factory('Account', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
      return {

        /**
         * 公司登录
         * @param {{username: String, password: String}} postData
         * @returns {HttpPromise}
         */
        login: function (postData) {
          return $http.post(apiBaseUrl + '/companies/login', postData);
        }

      }
    }]);
});