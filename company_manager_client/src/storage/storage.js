define(['angular'], function (angular) {
  return angular.module('storage', [])
    .factory('storageService', ['$window', function ($window) {
      return {
        local: {
          set: function (key, value) {
            $window.localStorage.setItem(key, value);
          },
          get: function (key) {
            return $window.localStorage.getItem(key);
          },
          remove: function (key) {
            $window.localStorage.removeItem(key);
          },
          clear: function () {
            $window.localStorage.clear();
          }
        },
        session: {
          set: function (key, value) {
            $window.sessionStorage.setItem(key, value);
          },
          get: function (key) {
            return $window.sessionStorage.getItem(key);
          },
          remove: function (key) {
            $window.sessionStorage.removeItem(key);
          },
          clear: function () {
            $window.sessionStorage.clear();
          }
        }
      };
    }]);
});