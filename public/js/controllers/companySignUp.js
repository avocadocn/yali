var companySignUpApp = angular.module('companySignUp',['ui.bootstrap','ngRoute']);

companySignUpApp.controller('signupController',['$http','$scope',function($http,$scope) {
  var pattern =  /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
  $scope.reg = false;
  $scope.check = false;
  $scope.ok = false;
  $scope.check_value = "正在检查邮箱是否存在...";

  $scope.mailRegCheck = function() {
     $scope.reg = (pattern.test($scope.email));
     $scope.check = false;
     $("#submit").attr("disabled",true);
      if(!$scope.reg){
        $scope.ok = false;
        $("#email").tooltip({
          "trigger":"hover",
          "title":"请输入正确的邮箱地址!",
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
              $scope.check_value = "该邮箱尚未注册!";
              $scope.check = true;
            } else {
              $scope.check = false;
              $scope.check_value = "该邮箱已经注册!";
            }

        }).error(function(data, status) {
            //TODO:更改对话框
            alert('数据发生错误！');
        });
      }
      catch(e){
          console.log(e);
      }
    }
  }
}]);
