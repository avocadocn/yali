define(['angular'], function (angular) {
  return angular.module('teamCtrls', []).controller('team.listCtrl', [
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
            $state.go('manager.teamList');
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
    ])
    .controller('team.editCtrl', [
      '$rootScope',
      '$scope',
      '$state',
      'teamService',
      'memberService',
      'imageService',
      '$modal',
      '$timeout',
      function ($rootScope, $scope, $state, teamService, memberService,imageService,$modal,$timeout) {
        teamService.get($state.params.teamId).success(function (data) {
          $scope.team = data;
          $scope.formData = {
            name: data.name
          };
          $scope.homeCourts = [{
            name: '',
            loc: { coordinates: [] }
          }, {
            name: '',
            loc: { coordinates: [] }
          }];
          $scope.showMaps = [false, false];
          for (var i = 0; i < $scope.team.homeCourts.length; i++) {
            var homeCourt = $scope.team.homeCourts[i];
            if (homeCourt.name) {
              $scope.homeCourts[i] = homeCourt;
            }
            if (homeCourt.loc && homeCourt.loc.coordinates && homeCourt.loc.coordinates.length === 2) {
              $scope.showMaps[i] = true;
            }
          }
        })
        .error(function (data) {
          alert(data.msg);
        });


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
          var dataURI = cropper.cropit('export', {
            type: 'image/jpeg',
            quality: 1
          });
          if (!dataURI || dataURI === '') {
            return;
          }
          var fd = new FormData();
          var blob = imageService.dataURItoBlob(dataURI);
          fd.append('logo', blob);
          console.log(FormData, fd);
          teamService.editLogo($scope.team._id, fd, function (err) {
            if (err) {
              alert(err);
            } else {
              $scope.isUploading = false;
              alert('上传成功');
              window.location.reload();
            }
          });

        };

        $scope.showMapModal = function () {
          $scope.modalInstance = $modal.open({
            templateUrl: 'homeCourtModal.html',
            scope: $scope
          });
          //关闭modal
          $scope.close = function () {
            $scope.modalInstance.dismiss('cancel');
          }
          window.court_map_initialize = function() {
            $scope.initialize();
          };
          var script = document.createElement("script");
          script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=court_map_initialize";
          document.body.appendChild(script);
          $scope.MSearches = new Array(2);
          $scope.locationMaps = new Array(2);
          $scope.city = '';
          var courtEleIds = ['courtMap1', 'courtMap2'];
          var placeSearchCallBack = function(bindMap, index) {
            return function(data) {
              bindMap.clearMap();
              var lngX = data.poiList.pois[0].location.getLng();
              var latY = data.poiList.pois[0].location.getLat();
              $scope.homeCourts[index].loc.coordinates = [lngX, latY];
              var nowPoint = new AMap.LngLat(lngX, latY);
              var markerOption = {
                map: bindMap,
                position: nowPoint,
                draggable: true
              };
              var mar = new AMap.Marker(markerOption);
              bindMap.setFitView();
              var changePoint = function(e) {
                var p = e.lnglat;
                $scope.homeCourts[index].loc.coordinates = [p.getLng(), p.getLat()];
              };
              AMap.event.addListener(mar, "dragend", changePoint);
            }
          };

          var bindPlaceSearch = function(bindMap, index, forbiddenCity) {
            var placeSearchOptions = { //构造地点查询类
              pageSize: 1,
              pageIndex: 1,
              city: $scope.city
            };
            if (forbiddenCity) {
              delete placeSearchOptions.city;
            }
            bindMap.plugin(["AMap.PlaceSearch"], function() {
              $scope.MSearches[index] = new AMap.PlaceSearch(placeSearchOptions);
              AMap.event.addListener($scope.MSearches[index], "complete", placeSearchCallBack(bindMap, index)); //返回地点查询结果
            });
          };

          $scope.initialize = function() {
            var points = new Array(2);
            for (var i = 0; i < 2; i++) {
              $scope.locationMaps[i] = new AMap.Map(courtEleIds[i]);
              if ($scope.homeCourts[i].name !== '') {
                var loc = $scope.homeCourts[i].loc;
                points[i] = new AMap.LngLat(loc.coordinates[0], loc.coordinates[1]);
                $scope.locationMaps[i].setZoomAndCenter(15, points[i]);
                var markerOption = {
                  map: $scope.locationMaps[i],
                  position: points[i],
                  draggable: true
                };
                var mar = new AMap.Marker(markerOption);
                var changePoint = function(e) {
                  var p = e.lnglat;
                  $scope.homeCourts[i].loc.coordinates = [p.getLng(), p.getLat()];
                };
                AMap.event.addListener(mar, "dragend", changePoint);
              };
            }

            if ($scope.city != '') {
              bindPlaceSearch($scope.locationMaps[0], 0);
              bindPlaceSearch($scope.locationMaps[1], 1);
            } else {

              $scope.locationMaps[0].plugin(["AMap.CitySearch"], function() {
                bindPlaceSearch($scope.locationMaps[0], 0, true);
                bindPlaceSearch($scope.locationMaps[1], 1, true);
                var citysearch = new AMap.CitySearch();
                AMap.event.addListener(citysearch, "complete", function(result) {
                  if (result && result.city && result.bounds) {
                    var citybounds = result.bounds;
                    $scope.city = result.city;
                    bindPlaceSearch($scope.locationMaps[0], 0);
                    bindPlaceSearch($scope.locationMaps[1], 1);
                  }
                });
                AMap.event.addListener(citysearch, "error", function(result) {
                  alert(result.info);
                });
                citysearch.getLocalCity();
              });
            }
          };

          $scope.changeLocation = function (index) {
            $scope.showMaps[index] = true;
            if ($scope.MSearches[index]) {
              $scope.MSearches[index].search($scope.homeCourts[index].name);
            } else {
              $timeout(function() {
                $scope.MSearches[index].search($scope.homeCourts[index].name);
              }, 0);
            }
          }

          $scope.saveHomeCourt = function () {
            teamService.update($scope.team._id, {
              homeCourts: $scope.homeCourts
            }).success(function () {
              alert('修改成功');
              $scope.team.homeCourts = $scope.homeCourts;
              $scope.close()
            })
            .error(function (data) {
              alert(data.msg);
            });
          };
        }
      }
    ]);
});