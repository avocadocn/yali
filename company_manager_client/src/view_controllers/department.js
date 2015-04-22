define(['angular', 'alertify'], function (angular, alertify) {
  return angular.module('departmentCtrls', []).controller('department.managerCtrl', [
    '$scope',
    '$rootScope',
    'searchService',
    'departmentService',
    function ($scope, $rootScope, searchService, departmentService) {


      var formatData = function(data) {
        $scope.node = {
          _id: data._id,
          name: data.name,
          level:data.level,
          is_company: true,
          department: data.department
        };
        if ($scope.node.department.length === 0) {
          $scope.node.department = null;
        }
      };

      var getDepartments = function() {
        var cid = $rootScope.company._id;
        departmentService.getDepartmentTreeDetail(cid)
          .success(function (data) {
            formatData(data);
          })
          .error(function () {
            alertify.alert('获取部门数据失败');
          });
      };
      getDepartments();

      $scope.toggleTree = function(node, $event) {
        if (!node.toggle || node.toggle === 'glyphicon-minus') {
          node.toggle = 'glyphicon-plus';
          node.hideChild = true;
        } else {
          node.toggle = 'glyphicon-minus';
          node.hideChild = false;
        }
        $event.stopPropagation();
      };

      $scope.getNode = function(node){
        $scope.did = node._id;
        $scope.current_node = node;
        departmentService.getDepartment(node._id).success(function (data, status) {
          $scope.getCompanyUser(data.department.team._id, function (){
            $('#managerAppointModel').modal();
          });
        }).error(function (data, status) {
          alertify.alert(data);
        });
      };

      $scope.hasChild = function(node) {
        if (node && node.department) {
          return 'parent_li';
        } else {
          return '';
        }
      };

      $scope.confirmCreate = function(node) {
        if (node.edit_name !== '' && node.edit_name != null) {
          departmentService.createDepartment({
            did: node.parent_id,
            name: node.edit_name,
            cid: $scope.node._id
          })
            .success(function() {
              getDepartments();
            });
        }
      };

      $scope.cancelCreate = function(node) {
        for (var i = 0; i < node.parent.department.length; i++) {
          if (node.parent.department[i].is_creating) {
            node.parent.department.splice(i, 1);
          }
        }
      };

      $scope.confirmEdit = function(node) {
        if (node.temp_name !== '' && node.temp_name != null) {
          departmentService.updateDepartment(node._id, {
            did: node._id,
            name: node.temp_name
          })
            .success(function() {
              getDepartments();
            });
        }
      };

      $scope.cancelEdit = function(node) {
        node.is_editing = false;
      };

      $scope.addNode = function(node) {
        node.toggle = 'glyphicon-minus';
        node.hideChild = false;
        if (!node.department) {
          node.department = [];
        }
        node.department.push({
          edit_name: '',
          parent_id: node._id,
          parent: node,
          level: node.level,
          is_creating: true
        });
      };

      $scope.editNode = function(node) {
        node.temp_name = node.name;
        node.is_editing = true;
      };

      $scope.deleteNode = function(node) {
        alertify.set({
          buttonFocus: "none",
          labels: {
            ok: '确认删除',
            cancel: '取消'
          }
        });
        alertify.confirm('删除后不可恢复，您确定要删除“' + node.name + '”吗？', function(e) {
          if (e) {
            departmentService.deleteDepartment(node._id)
              .success(function(data, status) {
                if (data.msg === 'DEPARTMENT_DELETE_SUCCESS') {
                  getDepartments();
                }
              });
          }
        });
      };


      // 任命管理员

      //获取该公司所有员工
      $scope.getCompanyUser = function (tid, callback) {

        searchService.searchUsers({ tid: tid })
          .success(function (data) {
            $scope.company_users = [];
            $scope.company_users = data.all_users;
            $scope.managers = data.leaders;
            $scope.origin_manager_id = data.leaders.length > 0 ? data.leaders[0]._id : null;
            $scope.department_users = data.users;
            // wait_for_join : 是否将该员工强制加入该部门的标志
            for (var i = 0; i < $scope.department_users.length; i++) {
              if ($scope.department_users[i] != null)
                $scope.department_users[i].wait_for_join = false;
            }

            // 找出没有加入任何部门的公司员工,成为部门管理员的候选人(如果选他成为管理员必须先让他加入该部门)
            if ($scope.company_users.length > 0) {
              for (var i = 0; i < $scope.company_users.length; i++) {
                if ($scope.company_users[i].department == undefined || $scope.company_users[i].department == null) {
                  $scope.company_users[i].wait_for_join = true;
                  $scope.department_users.push($scope.company_users[i]);
                }
              }
            }
            var manager_find = false;
            for (var i = 0; i < $scope.department_users.length && !manager_find; i++) {
              for (var j = 0; j < $scope.managers.length; j++) {
                //标记
                if ($scope.managers[j]._id.toString() === $scope.department_users[i]._id.toString()) {
                  //换到第一个
                  var temp = $scope.department_users[i];
                  $scope.department_users[i] = $scope.department_users[0];
                  $scope.department_users[0] = temp;
                  $scope.department_users[0].leader = true;
                  manager_find = true;
                  break;//目前一个小队只有一个组长
                }
              }
            }
            $scope.member_backup_department = $scope.department_users.slice(0);
            callback();
          })
          .error(function (data) {
            alertify.alert(data);
          });

      };
      //从员工中进一步搜索
      $scope.search = function () {
        //搜索前要重置
        for (var i = 0; i < $scope.member_backup_department.length; i++) {
          $scope.member_backup_department[i].leader = false;
        }
        var find = false;
        $scope.department_users = [];
        for (var i = 0; i < $scope.member_backup_department.length; i++) {
          if ($scope.member_backup_department[i].nickname.indexOf($scope.member_search_department) > -1) {
            $scope.department_users.push($scope.member_backup_department[i]);
            find = true;
          }
        }
        if (!find) {
          $scope.department_users = [];
          $scope.message = "未找到该员工!";
        } else {
          $scope.message = '';
        }

        $scope.search_flag = true;
        $scope.member_search_department = '';
      };

      $scope.showOriginalUser = function () {
        if ($scope.member_backup_department) {
          if ($scope.member_backup_department.length > 0) {
            $scope.department_users = $scope.member_backup_department;
          }
        }
        $scope.message = '';
        $scope.search_flag = false;
      };

      $scope.appointReady = function (index) {
        $scope.department_user = $scope.department_users[index];
        $scope.department_index = index;
        $scope.department_users[index].leader = true;

        for (var i = 0; i < $scope.department_users.length; i++) {
          if ($scope.department_users[i]._id != $scope.department_user._id) {
            $scope.department_users[i].leader = false;
          }
        }
        $scope.managers[0] = {
          '_id': $scope.department_user._id,
          'nickname': $scope.department_user.nickname,
          'photo': $scope.department_user.photo
        }

        //防止重复选择的bug
        if ($scope.origin_manager_id !== $scope.department_user._id) {
          $scope.appoint_permission_department = true;
        } else {
          $scope.appoint_permission_department = false;
        }
      };
      $scope.dismissManager = function (manager_id) {
        try {
          departmentService.appointManager($scope.did, {
            member: {
              '_id': manager_id
            },
            did: $scope.did,
            operate: 'dismiss'
          })
            .success(function (data, status) {

            }).error(function (data, status) {
              alertify.alert(data);
            });
        }
        catch (e) {
          console.log(e);
        }
      };
      //指定管理员
      $scope.appointManager = function () {
        if ($scope.appoint_permission_department != undefined && $scope.appoint_permission_department != null && $scope.appoint_permission_department != false) {
          try {
            departmentService.appointManager($scope.did, {
              member: {
                '_id': $scope.department_user._id,
                'nickname': $scope.department_user.nickname,
                'photo': $scope.department_user.photo,
                'wait_for_join': $scope.department_user.wait_for_join
              },
              did: $scope.did,
              operate: 'appoint'
            }).success(function (data, status) {
              //如果本部门原来有管理员的话就把他撤掉
              if ($scope.origin_manager_id != null && $scope.origin_manager_id != undefined) {
                $scope.dismissManager($scope.origin_manager_id);
                for (var i = 0; i < $scope.managers.length; i++) {
                  if ($scope.managers[i]._id == $scope.origin_manager_id) {
                    $scope.managers.splice(i, 1);
                  }
                }
              }
              $scope.origin_manager_id = $scope.department_user._id;
              $scope.managers.push({
                '_id': $scope.department_user._id,
                'nickname': $scope.department_user.nickname,
                'photo': $scope.department_user.photo
              });

              if ($scope.current_node != null && $scope.current_node != undefined) {
                $scope.current_node.manager = [];
                $scope.current_node.manager.push({
                  '_id': $scope.department_user._id,
                  'nickname': $scope.department_user.nickname,
                  'photo': $scope.department_user.photo
                });
                $scope.current_node = null;
              }
              alertify.alert('任命成功！');
            }).error(function (data, status) {
              alertify.alert('DATA ERROR');
            });
          }
          catch (e) {
            console.log(e);
          }
        }
      };

    }
  ]);
});