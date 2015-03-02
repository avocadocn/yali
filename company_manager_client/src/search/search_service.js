define(['./search'], function (search) {
  return search.factory('searchService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      searchUsers: function (data) {
        return $http.post(apiBaseUrl + '/search/users', data);
      }
    };
  }]);
});