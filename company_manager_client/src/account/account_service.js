define(['./account'], function (account) {
  return account.factory('UnAuthRedirectService', ['$q', function ($q) {
    var RedirectService = {
      requestError: function(config) {
        console.log(config)
      },
      response: function(res) {
        // todo
        if (res) {
          var data = res.data.toString();
          return -1 != data.search("isLogin") ? (console.log("u have lose ur session!"), location.href = "/login.html", res = {
            data: {
              data: ""
            }
          }) : -1 != data.search("needActive") ? (location.href = "/active.html", res = {
            data: {
              data: ""
            }
          }) : res
        }
        return res = {
          data: {
            data: ""
          }
        };
      },
      responseError: function(response) {
        console.log(response)
      }
    };
    return RedirectService;
  }]);
});