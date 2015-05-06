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

  // $scope.mailRegCheck = function() {
  //   $scope.reg = (pattern.test($scope.email));
  //   $scope.check = false;
  //   $("#submit").attr("disabled",true);
  //   if(!$scope.reg){
  //     $scope.mail_ok = false;
  //     $("#email").tooltip({
  //       "trigger":"hover",
  //       "title":'请输入正确的邮箱地址!',
  //       "placement" : "right"
  //     });
  //   } else {
  //     $("#email").tooltip('destroy');
  //   }
  // }
  $scope.mailCheck = function() {
    if($scope.email){
      $scope.mail_checked = true;
      $http({
        method: 'post',
        url: '/company/mailCheck',
        data:{
          login_email: $scope.email,
        }
      }).success(function(data, status) {
        if(data === "false") {
          $scope.mail_check_value = "";
          $scope.mail_check = true;
        } else {
          $scope.mail_check = false;
          $scope.mail_check_value = "该邮箱已经注册!";
        }
      }).error(function(data, status) {
        // alertify.alert('DATA ERROR');
      });
    }
  };

  $scope.companyNameCheck = function(){
    if($scope.name) {
      $scope.nameChecked = true;
      $http({
        method: 'post',
        url: '/company/officialNameCheck',
        data:{
          name: $scope.name,
        }
      }).success(function(data, status) {
        if(data.result === 0) {
          $scope.nameCheckValue = "";
          $scope.nameCheck = true;
        } else {
          //未通过验证
          $scope.nameCheck = false;
          $scope.nameCheckValue = "该公司名已经注册!";
        }
      }).error(function(data, status) {
        // alertify.alert('DATA ERROR');
      });
    }
  };


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
        // alertify.alert('DATA ERROR');
      });
    }
    catch(e){
      console.log(e);
    }
  }
}]);

companySignUpApp.controller('userSignupMobileController', ['$http','$scope','$rootScope',function ($http,$scope,$rootScope) {
  //- step 1
  $scope.step = 1;
  var pattern =  /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
  $scope.checkMail = function(keyEvent) {
    if((!keyEvent || keyEvent.which===13) && $scope.email){
      var reg = (pattern.test($scope.email))
      if(reg) {
        $scope.loading = true;
        $http.post('/users/mailCheck',{login_email: $scope.email})
          .success(function(data, status) {
            $scope.loading = false;
            if(data.active===1) {//未注册过
              $scope.step = 2;
              searchCompany();
            }
            else {
              //暂时没有重发邮件就直接告知已注册过
              $scope.step = 6;
            }
          });
      }
      else {
        $scope.email = '';
      }
    }
  };
  var searchCompany = function() {
    $http.post('/search/company', {email:$scope.email})
    .success(function(data, status) {
      $scope.page = 1;
      $scope.companies=data.companies;
      if($scope.page===data.pageCount) {$scope.hasNext = false;}
      $scope.hasPrevious = false;
    })
  };

  //-step 2
  $scope.nextPage = function() {
    if($scope.hasNext) {
      $http.post('/search/company',{email:$scope.email, page:$scope.page+1}).success(function (data,status){
        $scope.companies=data.companies;
        $scope.page++;
        if($scope.page===data.pageCount) {$scope.hasNext = false;}
        $scope.hasPrevious = true;
      });
    }
  };
  $scope.prePage = function() {
    if($scope.hasPrevious) {
      $http.post('/search/company',{email:$scope.email, page:$scope.page-1}).success(function (data,status){
        $scope.companies=data.companies;
        $scope.page--;
        if($scope.page===1) {$scope.hasPrevious = false;}
      });
    }
  };
  $scope.preStep = function() {
    $scope.step -- ;
  }
  $scope.select = function(company) {
    $scope.selectedCompany = company;
    $scope.step = 7;
  };
  $scope.organize = function() {
    $scope.step = 3;
    getRegions();
  };

  //- step 3
  var getRegions = function() {
    if(!$scope.provinces) {
      $http.get('/region').success(function(data, status) {
        $scope.provinces = data.data;
        $scope.province = $scope.provinces[0];
        changeProvince();
        $http.jsonp('http://api.map.baidu.com/location/ip?ak=krPnXlL3wNORRa1KYN1RAx3c&callback=JSON_CALLBACK')
        .success(function(data, status) {
          console.log(data);
          var detail = data.content.address_detail;
          var province = detail.province;
          var city = detail.city;
          var district = detail.district;
          // if(province && province.indexOf())
        });

      });
    }
  };
  var changeProvince = function() {
    $scope.cities = $scope.province.data;
    $scope.city = $scope.cities[0];
    changeCity();
  }
  var changeCity = function() {
    $scope.districts = $scope.city.data;
    $scope.district = $scope.districts[0];
  }
  $scope.selcetProvince = function() {
    changeProvince();
  };
  $scope.selectCity = function() {
    changeCity();
  };
  $scope.checkOfficeName = function() {
    if($scope.companyName) {
      $http.post('/company/officialNameCheck',{
        name: $scope.companyName,
        domain: $scope.email.split('@')[1]
      }).success(function(data, status) {
        if(data.result) {
          $scope.recommandCompany = {
            _id: data.cid,
            name: $scope.companyName
          };
          $scope.domain = data.domain;
        }
      });
    }
  };
  $scope.changeEmail = function() {
    $scope.step = 1;
    $scope.email = '';
  };
  $scope.selectPage = function() {
    $scope.step = 4;
  };
  $scope.ignoreRecommand = function() {
    $scope.recommandCompany = null;
  };


}]);

companySignUpApp.controller('userSignupController',['$http','$scope','$rootScope',function ($http,$scope,$rootScope) {
  //-验证个人邮箱
  var mailCheck = function(callback) {
    if($scope.email){
      $scope.loading = true;
      $http.post('/users/mailCheck',{login_email:$scope.email})
        .success(function (data, status){
          $scope.active=data.active;
          callback($scope.active);
        }).error(function (data, status) {
          callback(false);
        });
    }else{
      callback(false);
    }
  };
  //-若验证邮箱无问题，搜索公司
  $scope.search=function(keyEvent){
    if(keyEvent&&keyEvent.which===13||!keyEvent){
      mailCheck(function(active){
        if(active===1){
          $http.post('/search/company',{email:$scope.email}).success(function (data,status){
            $scope.page = 1;
            $scope.companies=data.companies;
            $rootScope.step=2;
            if($scope.page===data.pageCount) {$scope.hasNext = false;}
            $scope.hasPrevious = false;
          });
        }
      });
    }
  };

  $scope.nextPage = function() {
    if($scope.hasNext) {
      $http.post('/search/company',{email:$scope.email, page:$scope.page+1}).success(function (data,status){
        $scope.companies=data.companies;
        $scope.page++;
        if($scope.page===data.pageCount) {$scope.hasNext = false;}
        $scope.hasPrevious = true;
      });
    }
  };

  $scope.prePage = function() {
    if($scope.hasPrevious) {
      $http.post('/search/company',{email:$scope.email, page:$scope.page-1}).success(function (data,status){
        $scope.companies=data.companies;
        $scope.page--;
        if($scope.page===1) {$scope.hasPrevious = false;}
      });
    }
  };
  //-若邮箱有问题,可能需要的重发邮件
  // $scope.resendEmail = function() {
  //   $scope.sending = true;
  //   $http.post('/users/dealActive?notinvited=true',{email:$scope.email}).success(function (data,status) {
  //     $scope.resent = true;
  //     $scope.sending =false;
  //   });
  // }
  var departments;
  $scope.select=function(index){
    $scope.cid=$scope.companies[index]._id;
    $rootScope.cid = $scope.companies[index]._id;
    $scope.cname = $scope.companies[index].name;
    $rootScope.step = 3;
    // $scope.active =0;
    //-把部门搞进来...
    $http.get('/departmentTree/'+$scope.cid).success(function (data, status) {
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
      $http.post('/users/mailCheck',{login_email: $scope.email,cid:$scope.cid})
        .success(function(data, status) {
          $scope.loading = false;
          $scope.active=data.active;
        });
    }
  };

  $scope.checkInviteKey = function() {
    if($scope.inviteKey&&$scope.inviteKey.length===8) {
      $http.post('/users/inviteKeyCheck',{cid:$scope.cid, inviteKey: $scope.inviteKey})
        .success(function(data, status) {
          $scope.inviteKeyCorrect = data.invitekeyCheck;
        })
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