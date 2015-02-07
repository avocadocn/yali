define(['./controller'], function (controller) {
  controller.controller('statistics.chartsCtrl', [
    '$scope',
    '$rootScope',
    'campaignService',
    function ($scope, $rootScope, campaignService) {

      campaignService.getChartsData($rootScope.company._id)
        .success(function (data) {
          $scope.chartsData = data.chartsData;
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