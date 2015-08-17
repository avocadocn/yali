define(['angular', 'jQuery', 'cropit'], function (angular, $) {
  return angular.module('companyCtrls', []).controller('company.editCtrl', [
    '$rootScope',
    '$scope',
    'companyService',
    'imageService',
    function ($rootScope, $scope, companyService, imageService) {
      var company = $rootScope.company;
      $scope.formData = {
        name: company.shortName,
        address: company.address,
        tel: company.number,
        contacts: company.contacts
      };

      $scope.edit = function () {
        // 阻止提交，在这里不需要做提示，应该在页上使按钮不可用并作出错误提示。
        if ($scope.editInfoForm.$invalid) {
          return;
        }
        companyService.editInfo(company._id, $scope.formData)
          .success(function () {
            company.shortName = $scope.formData.name;
            company.address = $scope.formData.address;
            company.number = $scope.formData.tel;
            company.contacts = $scope.formData.contacts;
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
        fd.append('logo', blob);
        companyService.editLogo(company._id, fd, function (err) {
          if (err) {
            alert(err);
          } else {
            $scope.isUploading = false;
            alert('上传成功');
            window.location.reload();
          }
        });

      };
      var cropperFamily = $('#image_cropper_family').cropit({
        onFileChange: function () {
          $scope.familyIsUploading = true;
          $scope.$digest();
        },
        imageBackground: true
      });

      $scope.familyIsUploading = false;
      var cropitImageInputFamily = $('#cropit_image_input_family');
      $scope.selectFamily = function () {
        cropitImageInputFamily.click();
      };

      $scope.editFamily = function () {
        // var dataURI = cropperFamily.cropit('export', {
        //   type: 'image/jpeg',
        //   quality: 1
        // });
        var dataURI = cropperFamily.cropit('export');

        if (!dataURI || dataURI === '') {
          return;
        }
        var fd = new FormData();
        var blob = imageService.dataURItoBlob(dataURI);

        fd.append('cover', blob);
        companyService.editCover(company._id, fd, function (err) {
          if (err) {
            alert(err);
          } else {
            $scope.familyIsUploading = false;
            alert('上传成功');
            window.location.reload();
          }
        });

      };
    }
  ])
  .controller('company.homeCtrl', ['$scope', '$rootScope', 'companyService', 'campaignService', 'initData',
    function ($scope, $rootScope, companyService, campaignService, initData) {
      var company = initData.company;
      var cid = company._id;
      $scope.hasCompleteInfo = Boolean(company.shortName && company.address && company.number && company.contacts);
      $scope.hasTeam = (company.teamNumber > 0);
      $scope.hasMember = (company.memberNumber > 0);
      $scope.hasLeader = initData.hasLeader;

      var total = 4;
      var finishCount = Number($scope.hasCompleteInfo) + Number($scope.hasTeam) + Number($scope.hasMember) + Number($scope.hasLeader);
      $scope.unFinishCount = total - finishCount;

      $scope.hasFinishNewTask = companyService.hasFinishNewTask(company, initData.hasLeader);

      companyService.getUndisposed(cid, function(err, data) {
        if(!err) {
          $scope.noLeaderTeams = data.noLeaderTeams;
          $scope.unActivatedUsers = data.unActivatedUsers;
        }
      });

      companyService.getLatestMembers(cid).success(function(data) {
        $scope.latestUserList = data.users;
      }).error(function(data, status) {
        // todo
      });

      // campaignService.getTimeline('company', cid).success(function(data) {
      //   $scope.latestCampaignList = data.slice(0, 5);
      // }).error(function(data, status) {
      //   // todo
      // });

      // 是否需要显示时间
      $scope.needShowTime = function(index) {
        if (index === 0) {
          return true;
        } else {
          var preTime = new Date($scope.latestCampaignList[index - 1].start_time);
          var nowTime = new Date($scope.latestCampaignList[index].start_time);
          return nowTime.getDate() != preTime.getDate() || nowTime.getMonth() != preTime.getMonth() || nowTime.getFullYear() != preTime.getFullYear();
        }
      };

    }
  ])
});


