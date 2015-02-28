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

      $scope.email = '';
      $scope.invite = function () {
        memberService.invite($scope.email)
          .success(function (data) {
            alert(data.msg);
          })
          .error(function (data) {
            alert(data.msg);
          });
      };

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
      '$modal',
      function ($rootScope, $scope, $state, memberService, $modal) {
        memberService.getReportedMembers($rootScope.company._id).success(function (data) {
          $scope.companyReportedMembers = data;
        })
        .error(function (data) {
          alert(data.msg);
        });
        $scope.deal = function (id, dealFlag) {
          memberService.deal({host_type:'user',host_id:id,flag:dealFlag}).success(function (data) {
            $scope.modalInstance.dismiss('cancel');
            alert('处理成功');
          })
          .error(function (data) {
            $scope.modalInstance.dismiss('cancel');
            alert(data.msg);

          });
        }
        $scope.getDetail = function (id) {
          $scope.nowId = id;
          memberService.getMemberComments(id).success(function (data) {
            $scope.comments = data;
            $scope.modalInstance = $modal.open({
              templateUrl: 'getUserCommentModal.html',
              scope: $scope
            });
            $scope.close = function () {
              $scope.modalInstance.dismiss('cancel');
            }
          })
          .error(function (data) {
            alert(data.msg);
          });
        }
      }
    ])
    .controller('member.allCtrl', [
      '$rootScope',
      '$scope',
      '$state',
      'memberService',
      'departmentService',
      function ($rootScope, $scope, $state, memberService,departmentService) {
        memberService.getMembers($rootScope.company._id,{resultType:2}).success(function (data) {
          $scope.companyMembers = data;
        })
        .error(function (data) {
          alert(data.msg);
        });
        departmentService.getDepartment($rootScope.company._id).success(function (data) {
          // $scope.companyMembers = data;
        })
        .error(function (data) {
          alert(data.msg);
        });
      }
    ]);
});