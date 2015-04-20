define(['./controller', 'jQuery', 'cropit'], function (controllers, $) {
  return controllers.controller('company.editCtrl', [
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

    }
  ])
  .controller('company.homeCtrl', ['$scope', '$rootScope', 'companyService',
    function ($scope, $rootScope, companyService) {
      var cid = $rootScope.company._id;
      companyService.getUndisposed(cid, function(err, data) {
        if(!err) {
          $scope.noLeaderTeams = data.noLeaderTeams;
          $scope.unActivatedUsers = data.unActivatedUsers;
        }
      });

    }])
});

