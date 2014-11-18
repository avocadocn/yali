var companySignUpApp = angular.module('donler');

companySignUpApp.controller('signupController',['$http','$scope','$rootScope',function ($http,$scope,$rootScope) {
  var pattern =  /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
  $scope.reg = true;
  $scope.check = false;
  $scope.mail_ok = false;
  $scope.code_ok = false;
  $scope.check_value = '正在检查邮箱是否存在...';
  $scope.code_value = '正在检查邀请码有效性...';

  $scope.mailRegCheck = function() {
    $scope.reg = (pattern.test($scope.email));
    $scope.check = false;
    $("#submit").attr("disabled",true);
    if(!$scope.reg){
      $scope.mail_ok = false;
      $("#email").tooltip({
        "trigger":"hover",
        "title":'请输入正确的邮箱地址!',
        "placement" : "right"
      });
    } else {
      $("#email").tooltip('destroy');
    }
  }
  $scope.mailCheck = function() {
    if($scope.reg&&$scope.email){
      $scope.mail_ok = true;
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
              $scope.check_value = "该邮箱已经注册!";
            }

        }).error(function(data, status) {
            //TODO:更改对话框
            alertify.alert('DATA ERROR');
        });
      }
      catch(e){
          console.log(e);
      }
    }
  }

  $scope.codeCheck = function() {
    $scope.code_ok = true;
    try{
      $http({
          method: 'post',
          url: '/company/codeCheck',
          data:{
              invite_code : $scope.invite_code
          }
      }).success(function(data, status) {
          if(data === "false") {
            $scope.code_value = "该邀请码不存在或者已经被使用!";
            $scope.check = false;
          } else {
            $scope.check = true;
            $scope.code_value = "";
          }
      }).error(function(data, status) {
          //TODO:更改对话框
          alertify.alert('DATA ERROR');
      });
    }
    catch(e){
        console.log(e);
    }
  }

  $scope.search=function(keyEvent){
    if(keyEvent&&keyEvent.which===13||!keyEvent){
      $http.post('/search/company',{regx:$scope.company_name}).success(function(data,status){
        $scope.companies=data;
        $scope.step=2;
      });
    }
  };

  $scope.select=function(index){
    $scope.cid = $scope.companies[index]._id;
    $scope.step = 3;
    $scope.active =0;
  };

  $scope.mailCheck = function() {
    if($scope.email){
      $scope.loading = true;
      try{
        $http({
          method: 'post',
          url: '/users/mailCheck',
          data:{
              login_email: $scope.email
          }
        }).success(function(data, status) {
          $scope.loading = false;
          $scope.active=data.active;
        });
      }
      catch(e){
        console.log(e);
      }
    }
  };

}]);
