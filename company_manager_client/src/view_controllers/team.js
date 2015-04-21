define(['./controller'], function (controllers) {
  return controllers.controller('team.listCtrl', [
    '$rootScope',
    '$scope',
    'teamService',
    '$modal',
    function ($rootScope, $scope, teamService, $modal) {
      var noLeaderFilter = function(team) {
        if((!team.leaders || team.leaders.length==0)&&team.active === true) {
          return true;
        }
        return false;
      };
      var haveLeaderFilter = function(team) {
        if(team.leaders.length>0 && team.active === true) {
          return true;
        }
        return false;
      };
      var isClosedFilter = function(team) {
        if(team.active===false) {
          return true;
        }
        return false;
      }
      teamService.getList($rootScope.company._id).success(function (data) {
        $scope.teams = data;
        $scope.noLeaderTeams = data.filter(noLeaderFilter);
        $scope.leaderTeams = data.filter(haveLeaderFilter);
        $scope.closedTeams = data.filter(isClosedFilter);
      })
      .error(function (data) {
        alert(data.msg)
      });
      $scope.closeTeam = function (tid) {
        teamService.close(tid).success(function (data) {
          alert('关闭小队成功');
        })
        .error(function (data) {
          alert(data.msg);
        });
      };
      $scope.openTeam = function (tid) {
        teamService.open(tid).success(function (data) {
          alert('打开小队成功');
        })
        .error(function (data) {
          alert(data.msg);
        });
      };
      $scope.editTeam = function (type, index) {
        $scope.team = $scope[type][index];
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
      '$state',
      'teamService',
      function ($rootScope, $scope, $state, teamService) {
        $scope.newTeam = {
          _id: '',
          teamName: ''
        }
        teamService.getGroups().success(function (data) {
          $scope.groups = data;
        })
        .error(function (data) {
          alert(data.msg)
        });
        $scope.changeType = function (index) {
          $scope.newTeam._id = $scope.groups[index]._id;
          $scope.newTeam.teamName = $rootScope.company.shortName + '-' + $scope.groups[index].groupType + '队';
        }
        $scope.save = function () {
          teamService.create({selectedGroups:[$scope.newTeam]}).success(function (data) {
            alert('成功创建小队');
            $state.go('teamList');
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
      function ($rootScope, $scope, $state, teamService, memberService) {
        $scope.showTeamMember = true;
        $scope.memberTitle =['显示公司成员','显示小队成员'];
        $scope.memberBoxTitle = ['小队成员', '公司成员'];
        $scope.showTeamMemberTitle = $scope.memberTitle[0];
        $scope.showMemberBoxTitle = $scope.memberBoxTitle[0];
        teamService.get($state.params.teamId).success(function (data) {
          $scope.team = data;
          $scope.teamMembers = data.members;
          $scope.members = data.members;
        })
        .error(function (data) {
          alert(data.msg);
        });
        memberService.getMembers($rootScope.company._id).success(function (data) {
          $scope.companyMembers = data;
        })
        .error(function (data) {
          alert(data.msg);
        });
        $scope.toggleMember = function () {
          $scope.showTeamMember =!$scope.showTeamMember;
          $scope.showTeamMemberTitle = $scope.memberTitle[$scope.showTeamMember ? 0 : 1];
          $scope.showMemberBoxTitle = $scope.memberBoxTitle[$scope.showTeamMember ? 0 : 1];
          $scope.members = $scope.showTeamMember ? $scope.teamMembers : $scope.companyMembers;
        }
        $scope.changeLeader = function (index) {
          $scope.newLeader = $scope.members[index];
        }
        $scope.save =function () {
          teamService.update($scope.team._id,{leader:$scope.newLeader}).success(function(data) {
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
    ]);
});