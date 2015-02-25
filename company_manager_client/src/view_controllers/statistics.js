define(['./controller'], function (controller) {
  controller.controller('statistics.chartsCtrl', [
    '$scope',
    '$rootScope',
    'campaignService',
    function ($scope, $rootScope, campaignService) {

      campaignService.getChartsData($rootScope.company._id, 'bar')
        .success(function (data) {
          $scope.barData = data;
        })
        .error(function (data) {
          if (data && data.msg) {
            alert(data.msg);
          } else {
            alert('获取图表数据失败');
          }
        });

      campaignService.getChartsData($rootScope.company._id, 'pie')
        .success(function (data) {
          $scope.pieData = data;
        })
        .error(function (data) {
          if (data && data.msg) {
            alert(data.msg);
          } else {
            alert('获取图表数据失败');
          }
        });


    }
  ]);
});