define(['./department'], function (team) {
  return team.factory('departmentService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      getDepartmentTree: function (cid) {
        return $http.get(apiBaseUrl + '/departmentTree/' + cid);
      },
      getDepartmentTreeDetail: function (cid) {
        return $http.get(apiBaseUrl + '/departmentTree/' + cid + '/detail');
      },
      getDepartment: function (did) {
        return $http.get(apiBaseUrl + '/departments/' + did);
      },
      createDepartment: function (data) {
        return $http.post(apiBaseUrl + '/departments', data);
      },
      updateDepartment: function (did, data) {
        return $http.put(apiBaseUrl + '/departments/' + did, data);
      },
      deleteDepartment: function (did) {
        return $http.delete(apiBaseUrl + '/departments/' + did);
      },
      appointManager: function (did, data) {
        return $http.post(apiBaseUrl + '/departments/' + did + '/actions/appointManager', data);
      }
    }
  }]);
});