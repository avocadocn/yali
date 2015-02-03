define(['./company'], function (company) {
  return company.factory('companyService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      editInfo: function (id, info) {
        return $http.put(apiBaseUrl + '/companies/' + id, info);
      }
    }
  }]);
});