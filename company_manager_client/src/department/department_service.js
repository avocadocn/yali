define(['./department'], function (team) {
  return team.factory('departmentService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      getDepartment: function (id) {
        return $http.get(apiBaseUrl + '/departmentTree/' + id);
      }
    }
  }]);
});