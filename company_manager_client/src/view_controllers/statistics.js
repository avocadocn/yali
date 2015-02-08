define(['./controller'], function (controller) {
  controller.controller('statistics.chartsCtrl', [
    '$scope',
    '$rootScope',
    'campaignService',
    function ($scope, $rootScope, campaignService) {

      campaignService.getChartsData($rootScope.company._id, 'bar')
        .success(function (data) {
          $scope.barData = data.chartsData;
        })
        .error(function (data) {
          if (data && data.msg) {
            alert(data.msg);
          } else {
            alert('获取图表数据失败');
          }
        });

      $scope.pieLabels = [
        '1',
        '2',
        '3',
        '上周',
        '本周'
      ];

      campaignService.getChartsData($rootScope.company._id, 'pie')
        .success(function (data) {
          $scope.pieData = data.chartsData;
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