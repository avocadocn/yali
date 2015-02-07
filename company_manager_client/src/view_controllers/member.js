define(['./controller','qrcode'], function (controllers) {
  return controllers.controller('member.inviteCtrl', [
    '$rootScope',
    '$scope',
    'memberService',
    function ($rootScope, $scope, memberService) {
      var qrcode = new QRCode("inviteKeyQrCode", {
        text: $rootScope.company.inviteUrl,
        width: 128,
        height: 128
      });
      var img = $('#inviteKeyQrCode').find('img')[0];
      var link = document.getElementById('saveInviteKeyQrCode');
      link.href = img.src;
      link.download = "inviteCode.jpg";
    }
  ])
    .controller('member.activeCtrl', [
      '$rootScope',
      '$scope',
      '$state',
      'memberService',
      function ($rootScope, $scope, $state, memberService) {
        memberService.getMembers($rootScope.company._id,{resultType:3}).success(function (data) {
          $scope.companyMembers = data;
        })
        .error(function (data) {
          alert(data.msg);
        });
        $scope.active = function (id) {
          memberService.active(id).success(function (data) {
            alert('激活成功');
            $state.reload();
          })
          .error(function (data) {
            alert(data.msg);
          });
        }
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
        memberService.getMembers($rootScope.company._id,{resultType:2}).success(function (data) {
          $scope.companyMembers = data;
        })
        .error(function (data) {
          alert(data.msg);
        });
      }
    ]);
});