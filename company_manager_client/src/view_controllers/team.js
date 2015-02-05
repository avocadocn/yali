define(['./controller'], function (controllers) {
  return controllers.controller('team.listCtrl', [
    '$rootScope',
    '$scope',
    'teamService',
    '$modal',
    function ($rootScope, $scope, teamService, $modal) {
      teamService.getList($rootScope.company._id).success(function (data) {
        $scope.teams = data;
      })
        .error(function (data) {
          alert(data.msg)
        });

      $scope.noLeader = function(team) {
        if(!team.leaders || team.leaders.length==0) {
          return true;
        }
        return false;
      };
      $scope.haveLeader = function(team) {
        if(team.leaders.length>0) {
          return true;
        }
        return false;
      };
      $scope.editTeam = function (index) {
        $scope.team = $scope.teams[index];
        var modalInstance = $modal.open({
          templateUrl: 'editTeamModal.html',
          scope: $scope
        });
        $scope.save = function () {
          modalInstance.dismiss('ok');
          teamService.update($scope.team._id,{name:$scope.team.name}).success(function (data) {
            alert('修改小队名成功')
          })
            .error(function (data) {
              alert(data.msg)
            });

        }
        $scope.cancel = function () {
          modalInstance.dismiss('cancel');
        }
      }
    }
  ])
    .controller('team.createCtrl', [
      '$rootScope',
      '$scope',
      'teamService',
      function ($rootScope, $scope, teamService) {
        teamService.getList($rootScope.company._id).success(function (data) {
          $scope.teams = data;
        })
          .error(function (data) {
            alert(data.msg)
          });

      }
    ])
    .controller('team.pointLeaderCtrl', [
      '$rootScope',
      '$scope',
      '$state',
      'teamService',
      'storageService',
      function ($rootScope, $scope, $state, teamService, storageService) {
        // $scope.toggleMemberShow ='显示公司成员';
        teamService.get($state.params.teamId).success(function (data) {
          $scope.team = data;
          $scope.teamMember = data.members;
        })
          .error(function (data) {
            alert(data.msg);
          });
        // $scope.toggleMember = function () {
        //   // body...
        // }
        $scope.changeLeader = function (index) {
          $scope.newLeader = $scope.team.members[index];
        }
        $scope.save =function () {
          if($scope.newLeader._id==$scope.team.leaders[0]._id){
            return;
          }
          teamService.update($scope.team._id,{leader:$scope.newLeader}).success(function(data) {
            alert('修改队长成功');
            $state.reload();
          })
            .error(function (data) {
              alert(data.msg)
            })
        }
        $scope.cancel = function () {
          $state.go('teamList');
        }
      }
    ]);
});