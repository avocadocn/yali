define(['./member'], function (member) {
  // St: statistics
  return member
    .directive('editMember', ['memberService', '$modal', function (memberService, $modal) {
      return {
        restrict: 'A',
        scope: {
          nowUser: '='
        },
        link: function (scope, ele, attrs, ctrl) {
          //按按钮时请求数据
          scope.getMember = function() {
            scope.modalInstance = $modal.open({
              templateUrl: '/company/manager/templates/member/editMember.html',
              scope: scope
            });
            scope.close = function() {
              scope.modalInstance.dismiss('cancel');
            }
          }
           //激活
          scope.active = function () {
            var id = scope.nowUser;
            memberService.active(id).success(function (data) {
              alert('激活成功');
              scope.nowUser.active = true;
              scope.nowUser.mail_active = true;
            })
            .error(function (data) {
              alert(data.msg);
            });
          };
          //屏蔽
          scope.closeUser = function() {
            var id = scope.nowUser._id;
            memberService.close(id).success(function (data) {
              alert('屏蔽成功');
              scope.nowUser.active = false;
            })
            .error(function (data) {
              alert(data.msg);
            });
          };
          ele.on('click', scope.getMember);
        }
      }
    }])

});


