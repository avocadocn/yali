define(['./company', 'jQuery', 'cropit'], function (company, $) {
  return company.controller('company.editCtrl', [
    '$rootScope',
    '$scope',
    'companyService',
    function ($rootScope, $scope, companyService) {
      var company = $rootScope.company;
      $scope.formData = {
        name: company.shortName,
        address: company.address,
        tel: company.number,
        contacts: company.contacts
      };

      $scope.edit = function () {
        companyService.editInfo(company._id, $scope.formData)
          .success(function (data) {
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

      // todo 以下为临时代码，先实现功能再考虑改进代码结构
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

      var dataURItoBlob = function(dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
          byteString = atob(dataURI.split(',')[1]);
        else
          byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ia], {
          type: mimeString
        });
      };

      $scope.editLogo = function () {
        var dataURI = cropper.cropit('export', {
          type: 'image/jpeg',
          quality: 1
        });
        var fd = new FormData();
        var blob = dataURItoBlob(dataURI);
        fd.append('logo', blob);
        companyService.editLogo(company._id, fd, function (err) {
          if (err) {
            alert(err);
          } else {
            $scope.isUploading = false;
            alert('上传成功');
          }
        });

      };

    }
  ]);
});