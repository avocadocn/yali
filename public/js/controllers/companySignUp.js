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
        if(!data.hasCompany) {
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

companySignUpApp.controller('userSignupMobileController', ['$http','$scope','$location',function ($http,$scope,$location) {
  //判断浏览器
  var ua = navigator.userAgent.toLowerCase();
  var isQQBrowser = function(){
    return (/micromessenger/.test(ua)) ? true : (/mqqbrowser/.test(ua)) ;
  }
  var isAndroidBrowser = function() {
    return (/android/.test(ua)) && (/safari/.test(ua));
  }
  $scope.isQQBrowser = isQQBrowser();
  $scope.isAndroidBrowser = isAndroidBrowser();
  // alert($scope.isAndroidBrowser);

  //- step 1
  $scope.step = 1;
  $location.hash('1');

  $scope.$on('$locationChangeSuccess', function(event) {
    $scope.step = parseInt($location.$$hash);
  });
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
              checkCompany();
              $scope.hideInviteKey = data.hideInviteKey;
            }
            else {
              //暂时没有重发邮件就直接告知已注册过
              $scope.step = 6;
              $location.hash('6');
              if(data.active===2) {
                $scope.notVerified = true;
              }
            }
          });
      }
      else {
        $scope.email = '';
      }
    }
  };
  var checkCompany = function() {
    $http.post('/company/mailCheck',{login_email:$scope.email})
    .success(function(data,status) {
      if(!data.hasCompany) {
        searchCompany();
      }else {

        if(data.company.status.active===true) {
          $scope.step = 2;
          $scope.companies = [data.company];
          $location.hash('2');
        }
        else {
          $scope.step = 6;
          $scope.emailDomain = $scope.email.split('@')[1];
          $location.hash('6');
        }
      }
    })
  }
  var searchCompany = function() {
    $http.post('/search/company', {email:$scope.email, limit:4})
    .success(function(data, status) {
      if(data.companies.length === 0) {
        $scope.step = 8;
        $location.hash('8');
        getRegions();
      }
      else {
        $scope.step = 2;
        $location.hash('2');
        $scope.page = 1;
        $scope.companies=data.companies;
        if($scope.page===data.pageCount) {$scope.hasNext = false;}
        else {$scope.hasNext = true;}
        $scope.hasPrevious = false;
      }
    });
  };

  //-step 2
  $scope.nextPage = function() {
    if($scope.hasNext) {
      $http.post('/search/company',{email:$scope.email, page:$scope.page+1, limit:4}).success(function (data,status){
        $scope.companies=data.companies;
        $scope.page++;
        if($scope.page===data.pageCount) {$scope.hasNext = false;}
        $scope.hasPrevious = true;
      });
    }
  };
  $scope.prePage = function() {
    if($scope.hasPrevious) {
      $http.post('/search/company',{email:$scope.email, page:$scope.page-1, limit:4}).success(function (data,status){
        $scope.companies=data.companies;
        $scope.hasNext = true;
        $scope.page--;
        if($scope.page===1) {$scope.hasPrevious = false;}
      });
    }
  };
  $scope.preStep = function() {
    $scope.step = 1 ;
    $location.hash('1');
  }
  $scope.select = function(company) {
    $scope.selectedCompany = company;
    $scope.userInfo = {
      cid: company._id,
      email: $scope.email,
      inviteKey: '',
      nickname: '',
      password: '',
      passconf: '',
      realname: '',
      quick: true
    };
    $scope.step = 7;
    $location.hash('7');
  };
  $scope.organize = function() {
    $scope.step = 3;
    $location.hash('3');
    getRegions();
  };

  //- step 3
  //
  var arrayObjectIndexOf = function (myArray, searchTerm, property) {
    var _property = property.split('.');
    for(var i = 0, len = myArray.length; i < len; i++) {
      var item = myArray[i];
      _property.forEach( function (_pro) {
        item = item[_pro];
      });
      if (item.toString() === searchTerm.toString()) return i;
    }
    return -1;
  }
  var getRegions = function() {
    if(!$scope.provinces) {
      $http.get('/region').success(function(data, status) {
        $scope.provinces = data.data;
        $scope.province = $scope.provinces[0];
        changeProvince();
        $http.jsonp('http://api.map.baidu.com/location/ip?ak=krPnXlL3wNORRa1KYN1RAx3c&callback=JSON_CALLBACK')
        .success(function(data, status) {
          var detail = data.content.address_detail;
          var province = detail.province;
          var city = detail.city;
          var district = detail.district;
          if(province) {
            var provinceIndex =  arrayObjectIndexOf($scope.provinces, province, 'value');
            if(provinceIndex>-1) {
              $scope.province = $scope.provinces[provinceIndex];
              changeProvince();
              if(city) {
                var cityIndex =  arrayObjectIndexOf($scope.cities, city, 'value');
                if(cityIndex>-1) {
                  $scope.city = $scope.cities[cityIndex];
                  changeCity();
                  if(district) {
                    var districtIndex =  arrayObjectIndexOf($scope.districts, district, 'value');
                    $scope.district = $scope.districts[districtIndex];
                  }
                }
              }
            }
          }
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
  $scope.selcetProvince = function(province) {
    $scope.province = province;
    changeProvince();
  };
  $scope.selectCity = function(city) {
    $scope.city = city;
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
    $location.hash('1');
    $scope.email = '';
  };
  var uid = '';
  $scope.selectPage = function() {
    $http.post('/company/quickCreateUserAndCompany', {
      email: $scope.email,
      name: $scope.companyName,
      password: $scope.password,
      province: $scope.province.value,
      city: $scope.city.value,
      district: $scope.district.value
    }).success(function(data, status){
      uid = data.uid;
      $scope.step = 4;
      $location.hash('4');
      getGroups();
    }).error(function(data, status) {
      console.log(data);
      alert('注册失败');
    })    
  };
  $scope.ignoreRecommand = function() {
    $scope.recommandCompany = null;
  };

  //- step 4
  var getGroups = function() {
    if(!$scope.groups) {
      $http.get('/group/getgroups').success(function(data, status) {
        $scope.groups = data.splice(0, 16);
      });
    }
  };
  $scope.selectType = function(index) {
    $scope.groups[index].selected = !$scope.groups[index].selected;
  };

  $scope.createTeams = function() {
    var selectedGroups = $scope.groups.filter(function(group) {
      return group.selected === true;
    });
    $http.post('/company/quickCreateTeams',{
      groups: selectedGroups,
      uid: uid
    }).success(function(data, status) {
      // console.log(data);
      $scope.step = 5;
      $location.hash('5');
      if(data.result){
        $scope.emailDomain = $scope.email.split('@')[1];
      }
    })
    .error(function(data, status) {
      alert('创建失败');
    })
  }

  //- step 6
  $scope.resend = function() {
    $http.post('/users/resend/activeEmail',{email:$scope.email})
    .success(function(data,status){
      $scope.step = 5;
      $location.hash('5');
    })
    .error(function(data, status) {
      alert(data.msg);
    })
  };
  //- step 7

  $scope.checkInviteKey = function() {
    if($scope.userInfo.inviteKey&&$scope.userInfo.inviteKey.length===8 && $scope.selectedCompany) {
      $http.post('/users/inviteKeyCheck',{cid:$scope.selectedCompany._id, inviteKey: $scope.userInfo.inviteKey})
        .success(function(data, status) {
          $scope.inviteKeyCorrect = data.invitekeyCheck;
        })
    }
  };
  $scope.signupUser = function() {
    $http.post('/users/dealActive?notinvited=true', $scope.userInfo)
      .success(function(data, status) {
        if(data.result === 1) {
          $scope.step = 5;
          $location.hash('5');
          $scope.emailDomain = $scope.email.split('@')[1];
        } else {
          alert('注册失败');
        }
      })
  };
}]);

companySignUpApp.controller('quickSignupWebsiteController', ['$scope', '$rootScope', '$http', '$q', function($scope, $rootScope, $http, $q) {

  /**
   * 注册步骤，可以是:
   * 'search' - 搜索
   * 'select' - 找到公司
   * 'company' - 快速注册公司（填写表单）
   * 'personal' - 个人注册（找到公司并选择个人注册的情况）
   * 'selectGroup' - 选择感兴趣项目
   * 'success' - 注册成功
   * 'hasRegister' - 已注册
   * @type {String}
   */
  $scope.step = 'search';

  // 每一步的初始化数据的方法
  $scope.init = {};

  $scope.go = function(step, opts) {
    $scope.step = step;
    if ($scope.init[step]) {
      $scope.init[step](opts);
    }
  };

  // 错误消息
  $scope.errMsg = {};

  $scope.validEmail = '';

  // step search =====================================================
  $scope.init.search = function() {
    $scope.validEmail = '';
    $scope.errMsg.search = null;
  };
  $scope.init.search();

  $scope.searchFormData = {email: ''};

  var emailPattern =  /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
  $scope.search = function(keyEvent) {
    if (keyEvent && keyEvent.which !== 13) return;
    if (!$scope.searchFormData.email || $scope.searchFormData.email === '') return;
    var isEmail = emailPattern.test($scope.searchFormData.email);
    if (!isEmail) return;

    checkUserEmail($scope.searchFormData.email);
  };

  function checkUserEmail(email) {
    $http.post('/users/mailCheck', {login_email: email})
      .then(function(res) {
        var data = res.data;
        $scope.validEmail = email;
        if (data.active === 1) {
          $scope.hideInviteKey = data.hideInviteKey;
          return checkCompanyEmail(email);
        }
        else {
          if (data.active === 2) {
            $scope.notVerified = true;
          }
          $scope.go('hasRegister');
        }
      })
      .then(null, function(res) {
        var data = res.data;
        $scope.errMsg.search = (data && data.msg) || '搜索失败，这可能是网络问题或服务器错误造成的。';
      });
  }

  function checkCompanyEmail(email) {
    return $http.post('/company/mailCheck', {login_email: email}).then(function(res) {
      var data = res.data;
      if (data && data.hasCompany) {
        if (data.company.status.active === true) {
          var company = data.company;
          company.name = company.info.name;
          $scope.searchResCompanies = [company];
          $scope.go('select');
        }
        else {
          $scope.emailDomain = email.split('@')[1];
          $scope.go('hasRegister');
        }
      }
      else {
        searchCompany(email);
      }
    });
  }

  function searchCompany(email) {
    return $http.post('/search/company', {email: email}).then(function(res) {
      var data = res.data;
      if (data && data.companies.length > 0) {
        $scope.searchResCompanies = data.companies;
        $scope.page = 1;
        if ($scope.page === data.pageCount) {
          $scope.hasNext = false;
          $scope.isTooMuchRes = false;
        }
        else {
          $scope.hasNext = true;
          $scope.isTooMuchRes = true;
        }
        $scope.hasPrevious = false;
        $scope.go('select');
      }
      else {
        $scope.go('company', {title: '你比同事先到，快来注册'});
      }
    });
  }
  // the end of step search =====================================================


  // step select ================================================================
  $scope.init.select = function() {
    $scope.selectedCompany = null;
    $scope.reSearchFormData = {
      email: $scope.validEmail,
      key: ''
    };
    $scope.errMsg.reSearch = null;
  };

  $scope.nextPage = function() {
    if ($scope.hasNext) {
      $http.post('/search/company', {
        email: $scope.validEmail,
        page: $scope.page + 1
      }).success(function(data, status) {
        $scope.searchResCompanies = data.companies;
        $scope.page++;
        if ($scope.page === data.pageCount) {
          $scope.hasNext = false;
        }
        $scope.hasPrevious = true;
      });
    }
  };

  $scope.prePage = function() {
    if ($scope.hasPrevious) {
      $http.post('/search/company', {
        email: $scope.validEmail,
        page: $scope.page - 1
      }).success(function(data, status) {
        $scope.searchResCompanies = data.companies;
        $scope.hasNext = true;
        $scope.page--;
        if ($scope.page === 1) {
          $scope.hasPrevious = false;
        }
      });
    }
  };

  $scope.reSearch = function(keyEvent) {
    if (keyEvent && keyEvent.which !== 13) return;
    if (!$scope.reSearchFormData.key || $scope.reSearchFormData.key === '') return;

    $http.post('/search/company', $scope.reSearchFormData).success(function(data) {
      $scope.searchResCompanies = data.companies;

      $scope.hasPrevious = false;
      $scope.hasNext = false;
    }).error(function(data) {
      $scope.errMsg.reSearch = (data && data.msg) || '搜索失败，这可能是网络问题或服务器错误造成的。';
    });
  };

  // 在未搜索到公司进行快速注册时也用到
  $scope.select = function(company) {
    $scope.selectedCompany = company;
    $scope.go('personal');
  };
  // the end of step select =====================================================


  // step personal ==============================================================
  $scope.init.personal = function() {
    $scope.personalRegisterFormData = {
      cid: $scope.selectedCompany._id,
      email: $scope.validEmail,
      inviteKey: '',
      nickname: '',
      password: '',
      realname: '',
      quick: true
    };
  };

  $scope.checkInviteKey = function() {
    if ($scope.personalRegisterFormData.inviteKey && $scope.personalRegisterFormData.inviteKey.length === 8 && $scope.selectedCompany) {
      $http.post('/users/inviteKeyCheck',{
        cid: $scope.selectedCompany._id,
        inviteKey: $scope.personalRegisterFormData.inviteKey
      }).success(function(data) {
        $scope.isInviteKeyCorrect = (data.invitekeyCheck === 1);
      }).error(function(data) {
        // 这里不必处理了，即使请求失败，也不应该影响用户输入
      });
    }
  };

  $scope.registerUser = function() {
    $http.post('/users/dealActive?notinvited=true', $scope.personalRegisterFormData)
      .success(function(data) {
        if (data.result === 1) {
          $scope.go('success');
        }
        else {
          // 注册失败，这里弹框并不友好，但正常情况下不会到这里
          // 如果注册到了这一步，也不能直接知道原因
          alertify.alert('注册失败');
        }
      })
      .error(function(data) {
        alertify.alert((data && data.msg) || '注册失败，这可能是网络问题或服务器错误造成的。');
      });
  };

  // the end of step personal ===================================================


  // step company ===============================================================
  $scope.init.company = function(opts) {
    if (opts && opts.title) {
      $scope.stepCompanyTitle = opts.title;
    }
    else {
      $scope.stepCompanyTitle = '请填写企业信息';
    }

    $scope.domain = null;
    $scope.recommandCompany = null;

    $scope.companyRegisterFormData = {
      email: $scope.validEmail,
      name: '',
      province: '',
      city: '',
      district: '',
      password: ''
    };
    initProvince();
  };

  function getLocation() {
    var deferred = $q.defer();
    if ($scope.location) {
      deferred.resolve($scope.location);
    }
    else {
      $http.jsonp('http://api.map.baidu.com/location/ip?ak=krPnXlL3wNORRa1KYN1RAx3c&callback=JSON_CALLBACK')
        .success(function(data) {
          var detail = data.content.address_detail;
          $scope.location = {
            province: detail.province,
            city: detail.city,
            district: detail.district
          };
          deferred.resolve($scope.location);
        })
        .error(function() {
          deferred.resolve(null);
        });
    }

    return deferred.promise;
  }

  function getRegions() {
    var deferred = $q.defer();

    if ($scope.provinces) {
      deferred.resolve($scope.provinces);
    }
    else {
      $http.get('/region').success(function(data) {
        $scope.provinces = data.data;
        deferred.resolve($scope.provinces);
      }).error(function(data) {
        deferred.reject(new Error(data && data.msg || '获取省市区数据失败'));
      });
    }

    return deferred.promise;
  }

  function initProvince() {
    getLocation().then(function() {
      return getRegions();
    }).then(function() {
      if ($scope.location) {
        var provinceIndex = getIndexOfLocation($scope.location.province, $scope.provinces);
        if (provinceIndex !== -1) {
          $scope.companyRegisterFormData.province = $scope.provinces[provinceIndex];
          changeCity();

          var cityIndex = getIndexOfLocation($scope.location.city, $scope.cities);
          if (cityIndex !== -1) {
            $scope.companyRegisterFormData.city = $scope.cities[cityIndex];
            changeDistrict();

            var districtIndex = getIndexOfLocation($scope.location.district, $scope.districts);
            if (districtIndex !== -1) {
              $scope.companyRegisterFormData.district = $scope.districts[districtIndex];
            }
            else {
              setDefaultOptions('district');
            }
          }
          else {
            setDefaultOptions('city');
          }
        }
        else {
          setDefaultOptions('province');
        }
      }
      else {
        setDefaultOptions('province');
      }
    }).then(null, function(err) {
      alertify.alert(err || '获取数据失败，这可能是网络问题或服务器错误造成的。');
    });
  }

  function getIndexOfLocation(location, array) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (location === array[i].value) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 设置默认选项
   * @param {String} startDefaultOption 'province', 'city', 'district'
   */
  function setDefaultOptions(startDefaultOption) {
    if (startDefaultOption === 'province') {
      $scope.companyRegisterFormData.province = $scope.provinces[0];
      $scope.companyRegisterFormData.city = $scope.companyRegisterFormData.province.data[0];
      $scope.companyRegisterFormData.district = $scope.companyRegisterFormData.city.data[0];
    }
    else if (startDefaultOption === 'city') {
      $scope.companyRegisterFormData.city = $scope.companyRegisterFormData.province.data[0];
      $scope.companyRegisterFormData.district = $scope.companyRegisterFormData.city.data[0];
    }
    else if (startDefaultOption === 'district') {
      $scope.companyRegisterFormData.district = $scope.companyRegisterFormData.city.data[0];
    }
  }

  function changeCity() {
    $scope.cities = $scope.companyRegisterFormData.province.data;
    $scope.companyRegisterFormData.city = $scope.cities[0];
    changeDistrict();
  }
  function changeDistrict() {
    $scope.districts = $scope.companyRegisterFormData.city.data;
    $scope.companyRegisterFormData.district = $scope.districts[0];
  }
  $scope.selcetProvince = function() {
    changeCity();
  };
  $scope.selectCity = function() {
    changeDistrict();
  };

  $scope.checkOfficeName = function() {
    if ($scope.companyRegisterFormData.name && $scope.companyRegisterFormData.name !== '') {
      $http.post('/company/officialNameCheck',{
        name: $scope.companyRegisterFormData.name,
        domain: $scope.validEmail.split('@')[1]
      }).success(function(data, status) {
        if (data.result) {
          $scope.recommandCompany = {
            _id: data.cid,
            name: $scope.companyRegisterFormData.name
          };
          $scope.domain = data.domain;
        }
      });
    }
  };

  $scope.ignoreRecommand = function() {
    $scope.recommandCompany = null;
  };

  $scope.registerCompany = function() {
    $http.post('/company/quickCreateUserAndCompany', {
      email: $scope.companyRegisterFormData.email,
      name: $scope.companyRegisterFormData.name,
      password: $scope.companyRegisterFormData.password,
      province: $scope.companyRegisterFormData.province.value,
      city: $scope.companyRegisterFormData.city.value,
      district: $scope.companyRegisterFormData.district.value
    }).success(function(data) {
      $scope.uid = data.uid;
      $scope.go('selectGroup');
    }).error(function(data) {
      alertify.alert((data && data.msg) || '注册失败，这可能是网络问题或服务器错误造成的。');
    });
  };
  // the end of step company ===================================================


  // step selectGroup ==============================================================
  $scope.init.selectGroup = function() {
    getGroups();
  };

  function getGroups() {
    if ($scope.groups) return;

    $http.get('/group/getgroups').success(function(data) {
      $scope.groups = data.splice(0, 16);
    }).error(function(data) {
      alertify.alert((data && data.msg) || '获取数据失败，这可能是网络问题或服务器错误造成的。');
    });
  }

  $scope.selectType = function(index) {
    $scope.groups[index].selected = !$scope.groups[index].selected;
  };

  $scope.createTeams = function() {
    var selectedGroups = $scope.groups.filter(function(group) {
      return group.selected === true;
    });
    $http.post('/company/quickCreateTeams',{
      groups: selectedGroups,
      uid: $scope.uid
    }).success(function(data) {
      $scope.go('success');
      if (data.result) {
        $scope.emailDomain = $scope.validEmail.split('@')[1];
      }
    })
    .error(function(data) {
      alertify.alert((data && data.msg) || '操作失败，这可能是网络问题或服务器错误造成的。');
    });
  };
  // the end of step selectGroup ===================================================


  // step hasRegister
  $scope.resend = function() {
    $http.post('/users/resend/activeEmail',{email: $scope.validEmail})
      .success(function(data,status){
        $scope.go('success');
      })
      .error(function(data, status) {
        alertify.alert((data && data.msg) || '操作失败，这可能是网络问题或服务器错误造成的。');
      });
  };
  // the end of step hasRegister

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
        $scope.hasNext = true;
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

companySignUpApp.controller('activeFailController', ['$scope', '$http', function($scope, $http) {
  var resendEmail = document.getElementById('resend_email');

  $scope.resend = function() {
    $http.post('/users/resend/activeEmail',{email: resendEmail.value})
      .success(function(data,status){
        $scope.isFinishResend = true;
      })
      .error(function(data, status) {
        $scope.resendErrorMsg = (data && data.msg) || '操作失败，这可能是网络问题或服务器错误造成的。'
      });
  };

}]);

