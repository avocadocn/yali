define(['./controller'], function (controllers) {
  return controllers.controller('member.inviteCtrl', [
    '$rootScope',
    '$scope',
    'memberService',
    '$modal',
    function ($rootScope, $scope, memberService, $modal) {

    }
  ])
    .controller('member.activeCtrl', [
      '$rootScope',
      '$scope',
      'memberService',
      function ($rootScope, $scope, teamService) {

      }
    ])
    .controller('member.inactiveCtrl', [
      '$rootScope',
      '$scope',
      '$state',
      'memberService',
      function ($rootScope, $scope, $state, memberService) {
      }
    ])
    .controller('member.allCtrl', [
      '$rootScope',
      '$scope',
      '$state',
      'memberService',
      function ($rootScope, $scope, $state, memberService) {
        memberService.getMembers($rootScope.company._id).success(function (data) {
          $scope.companyMembers = data;
        })
        .error(function (data) {
          alert(data.msg);
        });
      }
    ]);
});