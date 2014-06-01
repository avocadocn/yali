'use strict';

angular.module('mean.main', ['ngRoute','ngAnimate','mgcrea.ngStrap.datepicker','mgcrea.ngStrap.timepicker','pascalprecht.translate']);


var app = angular.module('mean.main');

app.run(['$rootScope', function ($rootScope) {
    $rootScope.languages = [{'language':'中文','key':'zh'},{'language':'日本语','key':'jp'}];
}]);