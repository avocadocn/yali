define(['./team'], function (team) {
  return team.controller('team.listCtrl', [
    '$rootScope',
    '$scope',
    'teamService',
    'storageService',
    '$modal',
    function ($rootScope, $scope, teamService, storageService, $modal) {
      teamService.getList($rootScope.company._id).success(function (data) {
        $scope.teams = data;
      })
      .error(function (data) {
        alert(data.msg)
      });

      $scope.noLeader = function(team) {
        if(!team.leaders || team.leaders.length==0)
        {
          return true;
        }
        return false;
      };
      $scope.haveLeader = function(team) {
        if(team.leaders.length>0)
        {
          return true;
        }
        return false;
      };
      $scope.editTeam = function (index) {
        $scope.team = $scope.teams[index];
        var modalInstance = $modal.open({
          templateUrl: 'editTeamModal.html',
          scope: $scope,
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
    'storageService',
    function ($rootScope, $scope, teamService, storageService) {
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
    'teamService',
    'storageService',
    function ($rootScope, $scope, teamService, storageService) {
      teamService.getList($rootScope.company._id).success(function (data) {
        $scope.teams = data;
      })
      .error(function (data) {
        alert(data.msg)
      })

    }
  ]);
});