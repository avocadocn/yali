define(['./controller', 'alertify'], function (controllers, alertify) {
  return controllers.controller('department.managerCtrl', [
    '$scope',
    '$rootScope',
    'departmentService',
    function ($scope, $rootScope, departmentService) {

      // todo copy from yali tabviewCompany.js

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
          });
        // todo handle error
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
        departmentService.getDepartment(node._id).success(function(data, status) {
          // todo
          //$scope.getCompanyUser(data.department.team._id,function(){$('#managerAppointModel').modal();});
        }).error(function(data, status) {
          //TODO:更改对话框
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
        alertify.confirm('删除后不可恢复，您确定要删除“' + node.name + '”部门吗？', function(e) {
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

      // end for todo

    }
  ]);
});