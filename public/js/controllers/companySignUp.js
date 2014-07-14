var companySignUpApp = angular.module('donler');

companySignUpApp.controller('signupController',['$http','$scope','$rootScope',function ($http,$scope,$rootScope) {
  var pattern =  /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
  $scope.reg = true;
  $scope.check = false;
  $scope.ok = false;
  $scope.check_value = $rootScope.lang_for_msg[$rootScope.lang_key].value.MAIL_EXIST_CHECK;

  $scope.mailRegCheck = function() {
     $scope.reg = (pattern.test($scope.email));
     $scope.check = false;
     $("#submit").attr("disabled",true);
      if(!$scope.reg){
        $scope.ok = false;
        $("#email").tooltip({
          "trigger":"hover",
          "title":$rootScope.lang_for_msg[$rootScope.lang_key].value.MAIL_REGEX,
          "placement" : "right"
        });
      } else {
        $("#email").tooltip('destroy');
      }
  }
  $scope.mailCheck = function() {
    if($scope.reg){
      $scope.ok = true;
      try{
        $http({
            method: 'post',
            url: '/company/mailCheck',
            data:{
                login_email: $scope.email
            }
        }).success(function(data, status) {
            if(data === "false") {
              $scope.check_value = "";
              $scope.check = true;
            } else {
              $scope.check = false;
              $scope.check_value = $rootScope.lang_for_msg[$rootScope.lang_key].value.THIS
                                      + $rootScope.lang_for_msg[$rootScope.lang_key].value.MAIL
                                          + $rootScope.lang_for_msg[$rootScope.lang_key].value.ALREADY
                                              + $rootScope.lang_for_msg[$rootScope.lang_key].value.SIGNUP;
            }

        }).error(function(data, status) {
            //TODO:更改对话框
            $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
        });
      }
      catch(e){
          console.log(e);
      }
    }
  }
}]);
