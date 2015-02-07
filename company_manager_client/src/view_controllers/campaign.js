define(['./controller'], function (controllers) {
  return controllers.controller('campaign.campaignCtrl', [
    '$scope',
    function ($scope) {
      $scope.sponsor = function() {
        console.log('...');
      };
    }
  ]);
});