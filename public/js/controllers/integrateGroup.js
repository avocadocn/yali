'use strict';

var integrateGroup = angular.module('donler');


function tirm(arraies,str) {
    var rst = [];
    for(var i = 0; i < arraies.length; i++) {
        if(arraies[i].name.indexOf(str) > -1) {
            console.log(arraies[i].name,str);
            rst.push(arraies[i])
        } else {
            console.log('no',arraies[i].name,str);
        }
    }
    return rst;
}
integrateGroup.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider
      .when('/teampage', {
        templateUrl: '/team_integrate_page',
        controller: 'infoController',
        controllerAs: 'messages'
      })
      .otherwise({
        redirectTo: '/teampage'
      });
}]);
integrateGroup.directive('ngMin', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elem, attr, ctrl) {
            scope.$watch('member_max', function(){
                if(scope.member_min!=undefined){
                    ctrl.$setViewValue(ctrl.$viewValue);
                }
            });
            var minValidator = function(value) {
              var min = scope.$eval(attr.ngMin) || 0;
              if (value < min) {
                ctrl.$setValidity('ngMin', false);
                return value;
              } else {
                ctrl.$setValidity('ngMin', true);
                return value;
              }
            };

            ctrl.$parsers.push(minValidator);
            ctrl.$formatters.push(minValidator);
        }
    };
});

integrateGroup.directive('ngMax', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elem, attr, ctrl) {
            scope.$watch('member_min', function(){
                if(scope.member_max!=undefined){
                    ctrl.$setViewValue(ctrl.$viewValue);
                }
            });
            var maxValidator = function(value) {
              var max = scope.$eval(attr.ngMax) || Infinity;
              if (value > max) {
                ctrl.$setValidity('ngMax', false);
                return value;
              } else {
                ctrl.$setValidity('ngMax', true);
                return value;
              }
            };

            ctrl.$parsers.push(maxValidator);
            ctrl.$formatters.push(maxValidator);
        }
    };
});
integrateGroup.run(['$http','$rootScope','$location', function ($http, $rootScope, $location) {
    if($location.hash()!=='')
        $rootScope.nowTab = window.location.hash.substr(2);
    else if($location.path()!=='')
        $rootScope.nowTab = $location.path().substr(1);
    $rootScope.addactive = function(value) {
        $rootScope.nowTab = value;
        $rootScope.message_corner = false;
    };
    $rootScope.number;
    $rootScope.isMember;
    $rootScope.message_for_group = true;
    $rootScope.$watch("role",function(role){
        if (role && $location.hash()=='' && $location.path()==''){
            if(role === 'GUEST' || role === 'GUESTHR' || role === 'GUESTLEADER'){
                $location.path('/group_info');
                $rootScope.nowTab = 'group_info';
            }
            else{
                $location.path('/group_message');
                $rootScope.nowTab = 'group_message';
            }
        }
    });

    $rootScope.$on("$routeChangeStart",function(){
        $rootScope.loading = true;
    });
    $rootScope.$on("$routeChangeSuccess",function(){
        $rootScope.loading = false;
    });


    $rootScope.messageTypeChange = function(value){
        $rootScope.message_for_group = value;
    }
    //加入小队
    $rootScope.joinGroup = function(){
        try{
            $http({
                method:'post',
                url: '/users/joinGroup',
                data:{
                    tid : $rootScope.teamId
                }
            }).success(function(data,status){
                if(data.result===1){
                    window.location.reload();
                }
            }).error(function(data,status){
                alertify.alert('DATA ERROR');
            });
        }
        catch(e){
            console.log(e);
        }
    };

    //退出小队
    $rootScope.quitGroup = function(){
        try{
            $http({
                method:'post',
                url: '/users/quitGroup',
                data:{
                    tid : $rootScope.teamId
                }
            }).success(function(data,status){
                if(data.result===1){
                    window.location.reload();
                }
            }).error(function(data,status){
                alertify.alert('err');
            });
        }
        catch(e){
            console.log(e);
        }
    };

    //加载地图
    $rootScope.loadMap = function(index){
        $rootScope.loadMapIndex = index;
    };

    $rootScope.dongIt = function(){
        $rootScope.modalNumber = 2;
    };

    $rootScope.provokeRecommand =function(){
        $rootScope.recommand = true;
    };
}]);


var messageConcat = function(messages,rootScope,scope,reset){
    if(reset){
        rootScope.sum = 0;
    }
    rootScope.sum += messages.length;
    var new_messages = messages;
    for(var i = 0; i < new_messages.length; i ++){
        new_messages[i].comments = [];
        new_messages[i].comment_permission = true;
        scope.toggle.push(false);
        scope.new_comment.push({
            text: ''
        });
    }
    return new_messages;
}


integrateGroup.controller('infoController', ['$http', '$scope','$rootScope',function($http, $scope, $rootScope) {
    $scope.unEdit = true;
    $scope.buttonStatus = '编辑';
    $rootScope.$watch('teamId',function(tid){
        if($rootScope.teamId){
            $http.get('/group/info/'+tid).success(function(data, status) {
                $scope.members = [];
                $scope.team = data.companyGroup;
                $scope.name = $scope.team.name;
                $scope.entity = data.entity;
                $scope.role = data.role;
                var judge = true;
                for(var i = 0; i < data.companyGroup.member.length; i ++) {
                    for(var j = 0; j < data.companyGroup.leader.length; j ++) {
                        if(data.companyGroup.leader[j]._id === data.companyGroup.member[i]._id){
                            judge = false;
                            break;
                        }
                    }
                    if(judge){
                        $scope.members.push(data.companyGroup.member[i]);
                    }
                    judge = true;
                }
                $scope.team.home_court[0] = $scope.team.home_court[0] ? $scope.team.home_court[0] : {'name':'','loc':{'coordinates':[]}} ;
                $scope.team.home_court[1] = $scope.team.home_court[1] ? $scope.team.home_court[1] : {'name':'','loc':{'coordinates':[]}} ;
                $scope.showMap1 = $scope.team.home_court[0].name !=='' ? true : false;//以是否有主场判断是否需要显示地图
                $scope.showMap2 = $scope.team.home_court[1].name !=='' ? true : false;
            });
        }
    });

    $scope.editToggle = function() {

        $scope.unEdit = !$scope.unEdit;
        if($scope.unEdit) {
            if($scope.team.home_court[1].name =='')
                $scope.team.home_court.length --;
            if($scope.team.home_court[0].name =='')
                $scope.team.home_court.length --;
            try{
                $http({
                    method : 'post',
                    url : '/group/saveInfo/'+$rootScope.teamId,
                    data : {
                        'name' : $scope.name,
                        'brief' : $scope.team.brief,
                        'homecourt': $scope.team.home_court
                    }
                }).success(function(data, status) {
                    //TODO:更改对话框
                    if(data.result === 1) {
                        alertify.alert(data.msg);
                        window.location.reload();
                    }
                    else
                        alertify.alert(data.msg);
                }).error(function(data, status) {
                    //TODO:更改对话框
                    alertify.alert('DATA ERROR');
                });
            }
            catch(e) {
                console.log(e);
            }
            $scope.buttonStatus = '编辑';
        }
        else {
            if(!window.map_ready){//如果没有加载过地图script则加载
                window.court_map_initialize = function(){
                    $scope.initialize1(); 
                    $scope.initialize2();
                };
                var script = document.createElement("script");  
                script.src = "http://api.map.baidu.com/api?v=2.0&ak=krPnXlL3wNORRa1KYN1RAx3c&callback=court_map_initialize";
                document.body.appendChild(script);
            }
            $scope.team.home_court[0] = $scope.team.home_court[0] ? $scope.team.home_court[0] : {'name':'','loc':{'coordinates':[]}} ;
            $scope.team.home_court[1] = $scope.team.home_court[1] ? $scope.team.home_court[1] : {'name':'','loc':{'coordinates':[]}} ;
            $scope.buttonStatus = '保存';
        }
    };


    //---主场地图
    //初始化 如果有坐标则显示标注点，没有则不显示
    $scope.initialize1 = function(){
        $scope.locationmap1 = new BMap.Map("courtMap1");
        if($scope.team.home_court[0].name!==''){
            var piont1 = new BMap.Point($scope.team.home_court[0].loc.coordinates[0],$scope.team.home_court[0].loc.coordinates[1]);
            $scope.locationmap1.centerAndZoom(piont1,15);
            var marker1 = new BMap.Marker(piont1);
            $scope.locationmap1.addOverlay(marker1);
        }
        $scope.locationmap1.addControl(new BMap.NavigationControl({type: BMAP_NAVIGATION_CONTROL_SMALL}));
        var options = {
            onSearchComplete: function(results){
                // 判断状态是否正确
                if ($scope.local1.getStatus() == BMAP_STATUS_SUCCESS){
                    $scope.locationmap1.clearOverlays();
                    var nowPoint1 = new BMap.Point(results.getPoi(0).point.lng,results.getPoi(0).point.lat);
                    //var myIcon = new BMap.Icon("/img/icons/favicon.ico", new BMap.Size(30,30));
                    $scope.locationmap1.centerAndZoom(nowPoint1,15);
                    var marker1 = new BMap.Marker(nowPoint1);  // 创建标注
                    $scope.locationmap1.addOverlay(marker1);              // 将标注添加到地图中
                    marker1.enableDragging();    //可拖拽
                    $scope.team.home_court[0].loc.coordinates=[results.getPoi(0).point.lng,results.getPoi(0).point.lat];
                    marker1.addEventListener("dragend", function changePoint(){
                        var p = marker1.getPosition();
                        $scope.team.home_court[0].loc.coordinates = [p.lng , p.lat];
                    });
                }
            }
        };
        $scope.local1 = new BMap.LocalSearch($scope.locationmap1,options);
        window.map_ready =true;
    };

    //修改主场地址后改变地图点
    $scope.changeLocation1 = function(){
        $scope.showMap1 = true;
        $scope.local1.search($scope.team.home_court[0].name);
    };


    $scope.initialize2 = function(){
        $scope.locationmap2 = new BMap.Map("courtMap2");
        if($scope.team.home_court[1].name!==''){
            var point2 = new BMap.Point($scope.team.home_court[1].loc.coordinates[0],$scope.team.home_court[1].loc.coordinates[1]);
            $scope.locationmap2.centerAndZoom(point2,15);
            var marker2 = new BMap.Marker(point2);
            $scope.locationmap2.addOverlay(marker2);
        }
        $scope.locationmap2.addControl(new BMap.NavigationControl({type: BMAP_NAVIGATION_CONTROL_SMALL}));
        var options = {
            onSearchComplete: function(results){
                // 判断状态是否正确
                if ($scope.local2.getStatus() == BMAP_STATUS_SUCCESS){
                    $scope.locationmap2.clearOverlays();
                    var nowPoint2 = new BMap.Point(results.getPoi(0).point.lng,results.getPoi(0).point.lat);
                    //var myIcon = new BMap.Icon("/img/icons/favicon.ico", new BMap.Size(30,30));
                    $scope.locationmap2.centerAndZoom(nowPoint2,15);
                    var marker2 = new BMap.Marker(nowPoint2);  // 创建标注
                    $scope.locationmap2.addOverlay(marker2);              // 将标注添加到地图中
                    marker2.enableDragging();    //可拖拽
                    $scope.team.home_court[1].loc.coordinates=[results.getPoi(0).point.lng,results.getPoi(0).point.lat];
                    marker2.addEventListener("dragend", function changePoint(){
                        var q = marker2.getPosition();
                        $scope.team.home_court[1].loc.coordinates = [q.lng , q.lat];
                    });
                }
            }
        };
        $scope.local2 = new BMap.LocalSearch($scope.locationmap2,options);
    };

    $scope.changeLocation2 = function(){
        $scope.showMap2 = true;
        $scope.local2.search($scope.team.home_court[1].name);
    };

    //---全家福
    var jcrop_api;
    // ng-show 会有BUG,不得已使用jquery show,hide
    var family_preview_container = $('#family_preview_container');
    var family_jcrop_container = $('#family_jcrop_container');
    family_preview_container.show();
    family_jcrop_container.hide();

    $scope.family_photos;
    var getFamily = function() {
        $http
        .get('/group/'+$rootScope.teamId+'/family')
        .success(function(data, status) {
            $scope.family_photos = data;
        })
        .error(function(data, status) {
            // TO DO
        });
    };

    getFamily();

    // for ng-class
    $scope.active = function(index) {
        if (index === 0 || index === '0') {
            return 'active';
        } else {
            return '';
        }
    };

    $scope.selected = function(photo) {
        if (photo.select === true) {
            return 'selected_img';
        } else {
            return '';
        }
    };

    $scope.next = function() {
        family_preview_container.hide();
        family_jcrop_container.show();
    };

    $scope.back = function() {
        if (jcrop_api) {
            jcrop_api.destroy();
            jcrop_img_container.html('');
            upload_input.val('');
            upload_button[0].disabled = true;
        }
        family_preview_container.show();
        family_jcrop_container.hide();
    };

    $scope.deletePhoto = function(id) {
        $http
        .delete('/group/' + $rootScope.teamId + '/family/photo/' + id)
        .success(function(data, status) {
            getFamily();
        })
        .error(function(data, status) {
            // TO DO
        });
    };

    $scope.toggleSelect = function(id) {
        $http
        .post('/select/group/' + $rootScope.teamId + '/family/photo/' + id)
        .success(function(data, status) {
            getFamily();
        })
        .error(function(data, status) {
            // TO DO
        });
    };

    $('#upload_family_form').ajaxForm(function(data, status) {
        getFamily();
        jcrop_api.destroy();
        jcrop_img_container.html('');
        upload_input.val('');
        upload_button[0].disabled = true;
        family_preview_container.show();
        family_jcrop_container.hide();
    });

    var getFilePath = function(input, callback) {
      var file = input.files[0];
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function(e) {
        callback(this.result);
      };
    };

    var upload_input = $('#upload_input');
    var upload_button = $('#upload_button');
    var jcrop_img_container = $('#jcrop_img_container');
    var clone_img = jcrop_img_container.find('img').clone();

    upload_input.change(function() {
        if (upload_input.val() == null || upload_input.val() === '') {
            upload_button[0].disabled = true;
        } else {
            if (upload_input[0].files[0].size > 1024 * 1024 * 5) {
                upload_button[0].disabled = true;
                $scope.remind = '上传的文件大小不可以超过5M';
            } else {
                upload_button[0].disabled = false;
                $scope.step = 'upload';
                family_preview_container.hide();
                family_jcrop_container.show();
            }
        }

        getFilePath(upload_input[0], function(path) {
            jcrop_img_container.html(clone_img.clone());
            var jcrop_img = jcrop_img_container.find('img');
            jcrop_img.attr('src', path);

            var select = function(coords) {
                var operator_img = $('.jcrop-holder img');
                var imgx = operator_img.width();
                var imgy = operator_img.height();
                // 裁剪参数，单位为百分比
                $('#w').val(coords.w / imgx);
                $('#h').val(coords.h / imgy);
                $('#x').val(coords.x / imgx);
                $('#y').val(coords.y / imgy);
            };

            jcrop_img.Jcrop({
                setSelect: [0, 0, 320, 180],
                aspectRatio: 16 / 9,
                onSelect: select,
                onChange: select
            }, function() {
                jcrop_api = this;
            });

            $('.jcrop-holder img').attr('src', path);
        });
    });


    // calendar
    $scope.isDayView = false;
    var firstLoad = true;
    var options = {
        events_source: '/campaign/team/calendar/' + $rootScope.teamId,
        view: 'weeks',
        time_end: '24:00',
        tmpl_path: '/tmpls-team/',
        tmpl_cache: false,
        language: 'zh-CN',
        onAfterEventsLoad: function(events) {
            if (!events) {
                return;
            }
        },
        onAfterViewLoad: function(view) {
            $('#calendar_title').text(this.getTitle());
            //$('#calendar_operator button').removeClass('active');
            //$('button[data-calendar-view="' + view + '"]').addClass('active');
            if (view === 'day') {
                $scope.isDayView = true;
                if (firstLoad === true) {
                    firstLoad = false;
                }
                $scope.$digest();
            } else {
                $scope.isDayView = false;
                if (firstLoad === false) {
                    $scope.$digest();
                }
            }
        },
        classes: {
            months: {
                general: 'label'
            }
        }
    };

    var calendar = $('#calendar').calendar(options);

    $('#calendar_nav [data-calendar-nav]').each(function() {
        var $this = $(this);
        $this.click(function() {
            calendar.navigate($this.data('calendar-nav'));
        });
    });
    $('#calendar_view [data-calendar-view]').each(function() {
        var $this = $(this);
        $this.click(function() {
            calendar.view($this.data('calendar-view'));
        });
    });


}]);

