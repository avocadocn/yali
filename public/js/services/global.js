'use strict';

//Global service for global variables
angular.module('mean.system').factory('Global', ['$http',
    function ($http) {
      var _this = this;
      $http.get('/index/header/'+tid+'?' + (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
        _this._data = {
          nav_name: data.nav_name,
          nav_logo: data.nav_logo,
          authenticated: data.authenticated,
          role:data.role
        };
      });
      return _this._data;
    }
]);
