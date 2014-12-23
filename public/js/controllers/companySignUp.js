var companySignUpApp = angular.module('donler');

companySignUpApp.controller('signupController',['$http','$scope','$rootScope',function ($http,$scope,$rootScope) {
  var pattern =  /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
  $scope.reg = true;
  $scope.check = false;
  $scope.mail_ok = false;
  $scope.code_ok = false;
  $scope.check_value = '正在检查邮箱是否存在...';
  $scope.code_value = '正在检查邀请码有效性...';

  var selector = new LinkageSelector(document.getElementById('cities'));

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
                login_email: $scope.email,
                cid:$rootScope.cid//???
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
            $scope.code_check = false;
          } else {
            $scope.code_check = true;
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
}]);

companySignUpApp.controller('userSignupController',['$http','$scope','$rootScope',function ($http,$scope,$rootScope) {
  $scope.search=function(keyEvent){
    if(keyEvent&&keyEvent.which===13||!keyEvent){
      $http.post('/search/company',{regx:$scope.company_name}).success(function(data,status){
        $scope.companies=data;
        $rootScope.step=2;
      });
    }
  };
  var departments;
  $scope.select=function(index){
    $scope.cid=$scope.companies[index]._id;
    $rootScope.cid = $scope.companies[index]._id;
    $scope.cname = $scope.companies[index].name;
    $rootScope.step = 3;
    $scope.active =0;
    //-把部门搞进来...
    $http.get('/departmentTree/'+$scope.cid).success(function(data, status) {
      departments = data.department;
      $scope.main_departments = [];
      $scope.child_departments = [];
      $scope.grandchild_departments = [];
      $scope.department_exist = false;
      for(var i = 0; i < departments.length; i ++){
        $scope.main_departments.push({
          '_id':departments[i]._id,
          'name':departments[i].name,
          'department':departments[i].department
        });
      }
      if(departments.length > 0){
        $scope.department_exist = true;
        $scope.main_department = $scope.main_departments[0];
        $scope.main_department_id = $scope.main_department._id;
        $scope.main_department_name = $scope.main_department.name;
      }else{
        $scope.department_exist = false;
        $scope.main_department = {
          department:[]
        };
      }
      if($scope.main_department.department.length > 0){
        for(var i = 0 ; i < $scope.main_department.department.length; i ++){
          $scope.child_departments.push({
            '_id':$scope.main_department.department[i]._id,
            'name':$scope.main_department.department[i].name,
            'department':$scope.main_department.department[i].department
          });
        }
        $scope.child_department = $scope.child_departments[0];
        $scope.child_department_id = $scope.child_department._id;
        $scope.child_department_name = $scope.child_department.name;

        if($scope.child_departments[0].department.length > 0){
          for(var i = 0; i < $scope.child_departments[0].department.length; i ++){
            $scope.grandchild_departments.push({
              '_id':$scope.child_departments[0].department[i]._id,
              'name':$scope.child_departments[0].department[i].name
            });
          }
          $scope.grandchild_department = $scope.grandchild_departments[0];
          $scope.grandchild_department_id = $scope.grandchild_department._id;
          $scope.grandchild_department_name = $scope.grandchild_department.name;
        }
      }
    });
  };

  $scope.mailCheck = function() {
    if($scope.email){
      $scope.loading = true;
      try{
        $http({
          method: 'post',
          url: '/users/mailCheck',
          data:{
              login_email: $scope.email,
              cid:$scope.cid
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


  $scope.selectMainDepartment = function (value) {
    $scope.main_department = value;
    $scope.main_department_id = undefined;
    $scope.main_department_name = undefined;

    $scope.child_department = undefined;
    $scope.child_department_id = undefined;
    $scope.child_department_name = undefined;

    $scope.grandchild_department = undefined;
    $scope.grandchild_department_id = undefined;
    $scope.grandchild_department_name = undefined;

    for (var i = 0; i < departments.length; i++) {
      if (departments[i]._id === $scope.main_department._id) {
        $scope.child_departments = [];
        $scope.grandchild_departments = [];
        if (departments[i].department.length > 0) {


          for (var j = 0; j < departments[i].department.length; j++) {
            $scope.child_departments.push({
              '_id': departments[i].department[j]._id,
              'name': departments[i].department[j].name,
              'department': departments[i].department[j].department
            });
          }
        }
        break;
      }
    }

    $scope.main_department_id = $scope.main_department._id;
    $scope.main_department_name = $scope.main_department.name;

    if ($scope.child_departments.length > 0) {
      $scope.child_department = $scope.child_departments[0];
      $scope.child_department_id = $scope.child_department._id;
      $scope.child_department_name = $scope.child_department.name;
      if ($scope.child_departments[0].department.length > 0) {
        for (var i = 0; i < $scope.child_departments[0].department.length; i++) {
          $scope.grandchild_departments.push({
            '_id': $scope.child_departments[0].department[i]._id,
            'name': $scope.child_departments[0].department[i].name
          });
        }
        $scope.grandchild_department = $scope.grandchild_departments[0];
        $scope.grandchild_department_id = $scope.grandchild_department._id;
        $scope.grandchild_department_name = $scope.grandchild_department.name;
      }
    }
  }

  $scope.selectChildDepartment = function (value) {
    $scope.child_department = value;
    $scope.child_department_id = $scope.child_department._id;
    $scope.child_department_name = $scope.child_department.name;

    $scope.grandchild_department = undefined;
    $scope.grandchild_department_id = undefined;
    $scope.grandchild_department_name = undefined;

    for (var i = 0; i < $scope.child_departments.length; i++) {
      if ($scope.child_departments[i]._id.toString() === $scope.child_department_id) {
        $scope.grandchild_departments = [];
        for (var j = 0; j < $scope.child_departments[i].department.length; j++) {
          $scope.grandchild_departments.push({
            '_id': $scope.child_departments[i].department[j]._id,
            'name': $scope.child_departments[i].department[j].name
          });
        }
        if ($scope.grandchild_departments.length > 0) {
          $scope.grandchild_department = $scope.grandchild_departments[0];
          $scope.grandchild_department_id = $scope.grandchild_departments[0]._id;
          $scope.grandchild_department_name = $scope.grandchild_departments[0].name;
        }
        break;
      }
    }
  }

  $scope.selectGrandChildDepartment = function (value) {
    $scope.grandchild_department = value;
    $scope.grandchild_department_id = $scope.child_department._id;
    $scope.grandchild_department_name = $scope.child_department.name;
  };
}]);