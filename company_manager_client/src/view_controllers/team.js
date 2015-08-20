define(['angular', 'angulardatatables'], function (angular) {
  return angular.module('teamCtrls', ['datatables']).controller('team.listCtrl', [
    '$rootScope',
    '$scope',
    'teamService',
    '$modal',
    'DTOptionsBuilder',
    'DTColumnDefBuilder',
    function ($rootScope, $scope, teamService, $modal, DTOptionsBuilder, DTColumnDefBuilder) {
      $scope.dtOptions = DTOptionsBuilder.newOptions()
        .withOption('searching', false)
        // .withOption('paging', false)
        .withLanguage({
          'lengthMenu': '_MENU_',
          'zeroRecords': '无数据',
          'paginate': {
            'previous': '上一页',
            'next': '下一页'
          }
        })
        .withOption('info', false);

      $scope.dtColumnDefs = [
        DTColumnDefBuilder.newColumnDef(0).notSortable(),
        DTColumnDefBuilder.newColumnDef(1).notSortable(),
        DTColumnDefBuilder.newColumnDef(2),
        DTColumnDefBuilder.newColumnDef(3),
        DTColumnDefBuilder.newColumnDef(4).notSortable(),
        DTColumnDefBuilder.newColumnDef(5),
        DTColumnDefBuilder.newColumnDef(6).notSortable(),
        DTColumnDefBuilder.newColumnDef(7).notSortable(),
        DTColumnDefBuilder.newColumnDef(8).notSortable()
      ];
      $scope.Options = DTOptionsBuilder.newOptions()
        .withOption('searching', false)
        // .withOption('paging', false)
        .withLanguage({
          'lengthMenu': '_MENU_',
          'zeroRecords': '无数据',
          'paginate': {
            'previous': '上一页',
            'next': '下一页'
          }
        })
        .withOption('info', false);

      // var noLeaderFilter = function(team) {
      //   if((!team.leaders || team.leaders.length==0)&&team.active === true) {
      //     return true;
      //   }
      //   return false;
      // };

      teamService.getList().success(function (data) {
        // console.log(data);
        $scope.teams = data.groups;
        // $scope.unclosedTeams = data.groups.filter(unclosedFilter)
        // $scope.noLeaderTeams = data.groups.filter(noLeaderFilter);
        // $scope.leaderTeams = data.filter(haveLeaderFilter);
        // $scope.closedTeams = data.groups.filter(isClosedFilter);
      })
      .error(function (data) {
        alert(data.msg)
      });
      $scope.detail = function (type, index) {

        $scope.team = $scope[type][index];

        // teamService.get($scope[type][index]._id)
        // .success(function(status, data) {
        //   $scope.team = data;
        // })
        // .error(function(status, data) {
        //   console.log('获取资料失败');
        // })
        var modalInstance = $modal.open({
          templateUrl: 'teamDetailModal.html',
          scope: $scope
        });
        $scope.cancel = function () {
          modalInstance.dismiss('cancel');
        }
      }
    }
  ])
    .controller('team.createCtrl', [
      '$rootScope',
      '$scope',
      '$state',
      'teamService',
      function ($rootScope, $scope, $state, teamService) {
        $scope.newTeam = {
          name: '',
          hasValidate: true
        };
        $scope.save = function () {
          var fd = new FormData();
          var newTeam = $scope.newTeam;
          fd.append('name', newTeam.name);
          fd.append('hasValidate', newTeam.hasValidate);
          fd.append('open', true);
          fd.append('isAdmin', true);
          teamService.create(fd).success(function (data) {
            alert('成功创建群组');
            $scope.newTeam.name = '';
            // $state.go('manager.teamList');
          })
          .error(function (data) {
            alert(data.msg)
          })
        }
      }
    ])
    .controller('team.pointLeaderCtrl', [
      '$rootScope',
      '$scope',
      '$state',
      'teamService',
      'memberService',
      'team',
      function ($rootScope, $scope, $state, teamService, memberService, team) {
        $scope.team = team;
        $scope.formData = {name:""};
        $scope.search = function() {
          memberService.search($scope.formData).success(function(data) {
            $scope.members = data;
          })
          .error(function (data) {
            alert(data.msg)
          })
        }
        $scope.changeLeader = function (index) {
          $scope.newLeader = $scope.members[index];
        }
        $scope.save =function () {
          teamService.pointLeader($scope.team._id,{userId:$scope.newLeader._id}).success(function(data) {
            alert('修改队长成功');
            $state.reload();
          })
          .error(function (data) {
            alert(data.msg)
          })
        }
        $scope.cancel = function () {
          $scope.newLeader = null;
        }
      }
    ])
    .controller('team.editCtrl', [
      '$rootScope',
      '$scope',
      '$state',
      'teamService',
      'imageService',
      '$modal',
      '$timeout',
      function ($rootScope, $scope, $state, teamService,imageService,$modal,$timeout) {
        teamService.get($state.params.teamId).success(function (data) {
          if(!data.group)
            return alert("没有查找的该小队的信息！")
          $scope.team = data.group;
          $scope.formData = {
            name: data.group.name
          };
        })
        .error(function (data) {
          alert(data.msg);
        });
        $scope.closeTeam = function (tid) {
          teamService.close(tid).success(function (data) {
            alert('关闭小队成功');
            $scope.team.active = false;
          })
          .error(function (data) {
            alert(data.msg);
          });
        };
        $scope.openTeam = function (tid) {
          teamService.open(tid).success(function (data) {
            alert('打开小队成功');
            $scope.team.active = true;
          })
          .error(function (data) {
            alert(data.msg);
          });
        };

        $scope.edit = function () {
          // 阻止提交，在这里不需要做提示，应该在页上使按钮不可用并作出错误提示。
          if ($scope.editInfoForm.$invalid) {
            return;
          }
          teamService.update($scope.team._id, $scope.formData)
            .success(function () {
              alert('修改成功');
            })
            .error(function (data) {
              alert(data.msg);
            });
        };


        var cropper = $('#image_cropper').cropit({
          onFileChange: function () {
            $scope.isUploading = true;
            $scope.$digest();
          },
          imageBackground: true
        });

        $scope.isUploading = false;
        var cropitImageInput = $('#cropit_image_input');
        $scope.selectLogo = function () {
          cropitImageInput.click();
        };

        $scope.editLogo = function () {
          // var dataURI = cropper.cropit('export', {
          //   type: 'image/jpeg',
          //   quality: 1
          // });
          var dataURI = cropper.cropit('export');

          if (!dataURI || dataURI === '') {
            return;
          }
          var fd = new FormData();
          var blob = imageService.dataURItoBlob(dataURI);
          fd.append('photo', blob);
          teamService.editLogo($scope.team._id, fd, function (err) {
            if (err) {
              alert(err);
            } else {
              $scope.isUploading = false;
              alert('上传成功');
              window.location.reload();
            }
          });

        }
      }
    ]);
});