define(['./controller'], function (controllers) {
  return controllers.controller('campaign.campaignCtrl', [
    '$scope', '$rootScope', 'storageService', 'teamService',
    function ($scope, $rootScope, storageService, teamService) {
      var cid = $rootScope.company._id;
      //获取小队
      teamService.getList(cid).success(function (data) {
        $scope.data = {cid: cid, teams: data};
      })
      .error(function (data) {
        console.log(data.msg);
      });
    }
  ]);
});