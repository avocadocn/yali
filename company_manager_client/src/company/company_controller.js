define(['./company'], function (company) {
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

    }
  ]);
});