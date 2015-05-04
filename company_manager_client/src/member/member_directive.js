define(['./member', 'jQuery', 'cropit'], function (member, $) {
  // St: statistics
  return member
    .directive('memberEdit', ['memberService', 'departmentService','imageService', '$rootScope','$modal', '$timeout', function (memberService, departmentService, imageService, $rootScope, $modal,$timeout) {
      return {
        restrict: 'A',
        scope: {
          nowUserId: '='
        },
        link: function (scope, ele, attrs, ctrl) {
          var markUserDepartment = function(user, department) {
            if (department && user.department._id) {
              for (var i = 0; i < department.length; i++) {
                if (department[i]._id.toString() === user.department._id.toString()) {
                  department[i].selected = true;
                  scope.last_selected_node = department[i];
                  scope.ori_selected_node = department[i];
                }
                else {
                  department[i].selected = false;
                }
                markUserDepartment(user, department[i].department);
              }
            }
          };
          var formatData = function(data) {
            scope.node = {
              _id: data._id,
              name: data.name,
              is_company: true,
              department: data.department
            };
            if (scope.node.department.length === 0) {
              scope.node.department = null;
            }
            markUserDepartment(scope.nowUser, scope.node.department);
          };
          //按按钮时请求数据
          scope.getMember = function() {
            memberService.getMember(scope.nowUserId).success(function (data) {
              scope.nowUser = data;
            })
            .error(function (data) {
              alert(data.msg);
            });
            scope.modalInstance = $modal.open({
              templateUrl: '/company/manager/templates/member/editMember.html',
              scope: scope
            });
            departmentService.getDepartmentTree($rootScope.company._id).success(function (data) {
              scope.department = data;
              formatData(scope.department);
            })
            .error(function (data) {
              alert(data.msg);
            });
            
            scope.selectNode = function(node) {
              if (node.is_company === true) {
                return;
              }
              if (scope.last_selected_node) {
                scope.last_selected_node.selected = false;
              }
              node.selected = true;
              scope.nowUser.did = node._id;
              scope.last_selected_node = node;
            };
            scope.close = function() {
              scope.modalInstance.dismiss('cancel');
            }
            var cropitImageInput,cropper;
            scope.isUploading = false;
            scope.selectLogo = function () {
              cropitImageInput.click();
            };
            scope.editLogo = function () {
              var dataURI = cropper.cropit('export', {
                type: 'image/jpeg',
                quality: 1
              });
              if (!dataURI || dataURI === '') {
                return;
              }
              var fd = new FormData();
              var blob = imageService.dataURItoBlob(dataURI);
              fd.append('photo', blob);
              var id = scope.nowUser._id;
              memberService.editLogo(id, fd, function (err) {
                if (err) {
                  alert(err);
                } else {
                  scope.isUploading = false;
                  alert('上传成功');
                  window.location.reload();
                }
              });

            };
            scope.modalInstance.opened.then(function () {
              $timeout(function() {
                cropitImageInput = $('#cropit_image_input');
                cropper =  $('#image_cropper').cropit({
                  onFileChange: function () {
                    scope.isUploading = true;
                  },
                  imageBackground: true
                });
              },300)
              
            })

            
          }
           //激活
          scope.active = function () {
            var id = scope.nowUser._id;
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
          scope.save = function() {
            var id = scope.nowUser._id;
            memberService.edit(id,scope.nowUser).success(function (data) {
              alert('修改成功');
              scope.modalInstance.dismiss('cancel');
            })
            .error(function (data) {
              alert(data.msg);
            });
          };
          ele.on('click', scope.getMember);
        }
      }
    }])
    .directive('memberDetail', ['memberService', '$modal', function (memberService, $modal) {
      return {
        restrict: 'A',
        scope: {
          nowUserId: '='
        },
        link: function (scope, ele, attrs, ctrl) {
          //按按钮时请求数据
          scope.getMember = function() {
            memberService.getMember(scope.nowUserId).success(function (data) {
              scope.nowUser = data;
            })
            .error(function (data) {
              alert(data.msg);
            });
            scope.modalInstance = $modal.open({
              templateUrl: '/company/manager/templates/member/memberDetail.html',
              scope: scope
            });
            scope.close = function() {
              scope.modalInstance.dismiss('cancel');
            }
          }
          ele.on('click', scope.getMember);
          scope.showAll = false;
          scope.showAllMember = function() {
            scope.showAll = true;
          }
        }
      }
    }])
});


