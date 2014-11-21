'use strict';

angular.module('donler.components.report', [])

  .controller('ReportCtrl', ['$scope', 'Report', function ($scope, Report) {
    this.pushReport = function() {
      Report.publish($scope.reportContent, function(err, msg) {
        alertify.alert(msg);
      });
    };
    this.getReport = function (hostType,hostId,hostContent) {
      var _hostContent;
      if(hostType=='user'){
        _hostContent={
          poster: {
            nickname:hostContent.name,
            _id:hostId,
            cid:hostContent.cid
          },
          _id:hostId
        }
      }
      else {
        _hostContent ={
          poster: hostContent.poster,
          content:hostContent.content
        }
      }
      $scope.reportContent = {
        hostType: hostType,
        hostId:hostId,
        hostContent: _hostContent,
        reportType: ''
      }
      angular.element('#report_modal').modal('show');
    };
  }])

  .directive('reportButton',function () {
    return {
      restrict: 'E',
      replace: true,
      scope:{
        hostType:'@',
        hostId:'@',
        hostContent:'='
      },
      template: '<a ng-click="getReport(hostType,hostId,hostContent)"> 举报</a>',
      require: '^reportContain',
      link: function (scope, ele, attrs, ctrl) {
        scope.getReport = function (hostType,hostId,hostContent) {
          ctrl.getReport(hostType,hostId,hostContent)
        }
      }
    };

  })
  .directive('reportModal',function () {
    var reportModalLoad = true;
    return {
      restrict: 'E',
      replace: true,
      scope:true,
      templateUrl: '/components/reportModal/template',
      require: '^reportContain',
      link: function (scope, ele, attrs, ctrl) {
        scope.pushReport = function () {
          ctrl.pushReport();
        };
        scope.reportModalLoad =reportModalLoad;
        if(reportModalLoad){
          reportModalLoad = false;
        }
      }
    };

  })
  .directive('reportContain',function () {
    return {
      restrict: 'A',
      controller: 'ReportCtrl',
      link: function (scope, ele, attrs, ctrl) {
      }
    };

  })