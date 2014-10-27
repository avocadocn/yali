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
        alertify.confirm('确认要退出该小队吗？',function(e){
            if(e){
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
            }
        });
    };
    $rootScope.sponsorIndex =function(index) {
        $rootScope.modal_index=index;
        if(index===1){//活动
            $('#sponsorCampaignModel').modal('show');
        }
        else{
            $('#sponsorProvokeModel').modal('show');
        }
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



integrateGroup.controller('SponsorController', ['$http', '$scope','$rootScope','Campaign',function($http, $scope, $rootScope, Campaign) {
    $scope.showMapFlag=false;

    $scope.$watch('member_max + member_min',function(newValue,oldValue){
        if($scope.member_max<$scope.member_min){
            $scope.campaign_form.$setValidity('ngMin', false);
            $scope.campaign_form.$setValidity('ngMax', false);
        }
        else{
            $scope.campaign_form.$setValidity('ngMin', true);
            $scope.campaign_form.$setValidity('ngMax', true);
        };
    });

    //打开发活动modal时
    $('#sponsorCampaignModel').on('show.bs.modal', function (e) {
        if(!$scope.moldsgot){
            Campaign.getMolds('team',$rootScope.teamId,function(status,data){
                if(!status){
                    $scope.molds = data;
                    $scope.moldsgot = true;
                    $scope.mold = $scope.molds[0].name;
                }
            });
        }
        //加载地图
        if(!window.map_ready){
            window.campaign_map_initialize = $scope.initialize;
            var script = document.createElement("script");  
            script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=campaign_map_initialize";
            document.body.appendChild(script);
        }
        else{
            $scope.initialize();
        }
        $scope.location={name:'',coordinates:[]};
        $("#start_time").on("changeDate",function (ev) {
            var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
            $scope.start_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
            $('#end_time').datetimepicker('setStartDate', dateUTC);
        });
        $("#end_time").on("changeDate",function (ev) {
            var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
            $scope.end_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
            $('#start_time').datetimepicker('setEndDate', dateUTC);
            $('#deadline').datetimepicker('setEndDate', dateUTC);
        });
        $("#deadline").on("changeDate",function (ev) {
            var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
            $scope.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
            $('#end_time').datetimepicker('setEndDate', dateUTC);
        });
    });

    var placeSearchCallBack = function(data){
        $scope.locationmap.clearMap();
        var lngX = data.poiList.pois[0].location.getLng();
        var latY = data.poiList.pois[0].location.getLat();
        $scope.location.coordinates=[lngX, latY];
        var nowPoint = new AMap.LngLat(lngX,latY);
        var markerOption = {
            map: $scope.locationmap,
            position: nowPoint,
            draggable: true
        };
        var mar = new AMap.Marker(markerOption);
        var changePoint = function (e) {
            var p = mar.getPosition();
            $scope.location.coordinates=[p.getLng(), p.getLat()];
        };
        $scope.locationmap.setFitView();
        AMap.event.addListener(mar,"dragend", changePoint);

    }
    $scope.initialize = function(){
        $scope.locationmap = new AMap.Map("mapDetail");            // 创建Map实例
        $scope.locationmap.plugin(["AMap.CitySearch"], function() {
            //实例化城市查询类
            var citysearch = new AMap.CitySearch();
            //自动获取用户IP，返回当前城市
            citysearch.getLocalCity();
            //citysearch.getCityByIp("123.125.114.*");
            AMap.event.addListener(citysearch, "complete", function(result){
                if(result && result.city && result.bounds) {
                    var citybounds = result.bounds;
                    //地图显示当前城市
                    $scope.locationmap.setBounds(citybounds);
                    $scope.locationmap.plugin(["AMap.PlaceSearch"], function() {      
                        $scope.MSearch = new AMap.PlaceSearch({ //构造地点查询类
                            pageSize:1,
                            pageIndex:1,
                            city: result.city

                        });
                        AMap.event.addListener($scope.MSearch, "complete", placeSearchCallBack);//返回地点查询结果
                    });
                }
            });
            AMap.event.addListener(citysearch, "error", function(result){alert(result.info);});
        });
        window.map_ready =true;
    };
    $scope.showMap = function(){
        if($scope.location.name==''){
            alertify.alert('请输入地点');
            return false;
        }
        else if($scope.showMapFlag ==false){
            $scope.showMapFlag =true;
            $scope.MSearch.search($scope.location.name); //关键字查询
        }
        else{
           $scope.MSearch.search($scope.location.name); //关键字查询
        }
    };

    $scope.selectMold=function(name){
        $scope.mold = name;
    };

    $scope.sponsor = function() {
        if($scope.member_max < $scope.member_min){
            alertify.alert('最少人数须小于最大人数');
        }
        else{
            var _data = {
                theme: $scope.theme,
                location: $scope.location,
                start_time : $scope.start_time,
                end_time : $scope.end_time,
                campaign_mold:$scope.mold
            };
            var _url = '/group/campaignSponsor/'+ $rootScope.teamId;
            Campaign.sponsor(_url,_data,function(status,data){
                if(!status){
                    // window.location.reload();
                    window.location = '/campaign/detail/'+data.campaign_id+'?stat=editing';
                }else{
                    alertify.alert('活动发布出错');
                }
            });
        }
    };
}]);

integrateGroup.controller('infoController', ['$http', '$scope','$rootScope', function($http, $scope, $rootScope) {
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

    $scope.slide = {
        index: 0
    };

    $scope.default_family = [
        {
            uri: '/img/icons/defaultfamily1.jpg'
        },
        {
            uri: '/img/icons/defaultfamily2.jpg'
        },
        {
            uri: '/img/icons/defaultfamily3.jpg'
        }
    ];


    $scope.clickThumb = function(photo) {
        for (var i = 0; i < $scope.family_photos.length; i++) {
            if (photo._id === $scope.family_photos[i]._id) {
                $scope.slide.index = i;
                break;
            }
        }
    };

    $scope.$watch('slide', function(newValue, oldValue) {
        var newIndex = newValue.index;
        var oldIndex = oldValue.index;

        if (newIndex > oldIndex) {
            for (var i = 0; i < newIndex - oldIndex; i++) {

            }
        }

    });

    $scope.prevPhoto = function() {
        if ($scope.slide.index !== 0) {
            $scope.slide.index--;
        }
    };

    $scope.nextPhoto = function() {
        if ($scope.slide.index !== $scope.family_photos.select_count - 1) {
            $scope.slide.index++;
        }
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
            $scope.family_photos.select_count = 0;
            $scope.family_photos.forEach(function(photo) {
                if (photo.select === true) {
                    $scope.family_photos.select_count++;
                }
            });
            $scope.thumbs = [$scope.family_photos[0], $scope.family_photos[1], $scope.family_photos[2]];
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

    var remind_time = $('#remind_time');
    var start_time = new Date($('#campaign_start_time').text());
    var remind_text = $('#remind_text');
    var handle = setInterval(function() {
        start_time.setSeconds(start_time.getSeconds());
        if (start_time < Date.now()) {
            remind_time.text('活动已开始');
            remind_text.addClass('transparent');
            clearInterval(handle);
            return;
        }
        var during = moment.duration(moment(start_time).diff(Date.now()));
        var remind_time_text = during.seconds() + '秒';
        if (during.minutes() > 0) {
            remind_time_text = during.minutes() + '分' + remind_time_text;
        }
        if (during.hours() > 0) {
            remind_time_text = during.hours() + '小时' + remind_time_text;
        }
        if (during.days() > 0) {
            remind_time_text = during.days() + '天' + remind_time_text;
        }
        if (during.months() > 0) {
            remind_time_text = during.months() + '月' + remind_time_text;
        }
        if (during.years() > 0) {
            remind_time_text = during.years() + '年' + remind_time_text;
        }
        remind_time.text(remind_time_text);
    }, 1000);


}]);


integrateGroup.controller('ProvokeController', ['$http', '$scope','$rootScope','Campaign',function($http, $scope, $rootScope, Campaign) {
    $scope.search_type="team";
    $scope.companies = [];
    $scope.teams = [];
    $scope.showMapFlag=false;
    $scope.location={name:'',coordinates:[]};
    $scope.modal=0;
    $scope.result=0;//是否已搜索
    $scope.selected_index=-1;

    //决定要打开哪个挑战的modal
    $rootScope.$watch('modal_index',function(value){
        if(value===3){
            $scope.modal = 2;
            $http.get('/group/getSimiliarTeams/'+$rootScope.teamId).success(function(data,status){
                $scope.similarTeams = data;
                if(data.length===1){
                    $scope.modal=3;//直接跳到发起挑战页面
                    $scope.team_opposite = $scope.similarTeams[0];
                    Campaign.getTags('group',$scope.team_opposite._id,function(status,data){
                        if(!status){
                            $scope.recommand_tags = data;
                        }
                    });
                    Campaign.getMolds('team',$rootScope.teamId,function(status,data){
                        if(!status){
                            console.log(data);
                            $scope.mold = data[0].name;
                        }
                    });
                }
            });
        }
        else if(value===2){
            $scope.recommandTeam();
        }
        if(value===2||value===3){
            //加载地图
            if(!window.map_ready){
                window.campaign_map_initialize = $scope.initialize;
                var script = document.createElement("script");  
                script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=campaign_map_initialize";
                document.body.appendChild(script);
            }
            else{
                $scope.initialize();
            }            
        }
    });

    $("#competition_start_time").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.competition_date = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#competition_end_time').datetimepicker('setStartDate', dateUTC);
    });
    $("#competition_end_time").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#competition_start_time').datetimepicker('setEndDate', dateUTC);
        $('#competition_deadline').datetimepicker('setEndDate', dateUTC);
    });
    $("#competition_deadline").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#end_time').datetimepicker('setEndDate', dateUTC);
    });
    
    $scope.recommandTeam = function(){
        $scope.homecourt = true;

        try{
            $http({
                method:'post',
                url:'/search/recommandteam',
                data:{
                    gid : $rootScope.groupId,
                    tid : $rootScope.teamId
                }
            }).success(function(data,status){
                if(data.result===1){
                    $scope.teams=data.teams;
                }
                else if(data.result===2)//没填主场
                    $scope.homecourt=false;
            }).error(function(data,status){
               console.log('推荐失败'); 
            });
        }
        catch(e){
            console.log(e);
        }
    };

    $scope.search = function() {
        //按公司搜索
        if($scope.search_type==='company'){
            $scope.getCompany();
        //按队名搜索
        } else {
            $scope.getTeam();
        }
        $scope.result=1;//已搜索，显示搜索结果
        $scope.selected_index = -1;
    };
    var placeSearchCallBack = function(data){
        $scope.locationmap.clearMap();
        var lngX = data.poiList.pois[0].location.getLng();
        var latY = data.poiList.pois[0].location.getLat();
        $scope.location.coordinates=[lngX, latY];
        var nowPoint = new AMap.LngLat(lngX,latY);
        var markerOption = {
            map: $scope.locationmap,
            position: nowPoint,
            draggable: true
        };
        var mar = new AMap.Marker(markerOption);
        var changePoint = function (e) {
            var p = mar.getPosition();
            $scope.location.coordinates=[p.getLng(), p.getLat()];
        };
        $scope.locationmap.setFitView();
        AMap.event.addListener(mar,"dragend", changePoint);
    }
    $scope.initialize = function(){
        $scope.locationmap = new AMap.Map("competitionMapDetail");            // 创建Map实例
        $scope.locationmap.plugin(["AMap.CitySearch"], function() {
            //实例化城市查询类
            var citysearch = new AMap.CitySearch();
            //自动获取用户IP，返回当前城市
            citysearch.getLocalCity();
            //citysearch.getCityByIp("123.125.114.*");
            AMap.event.addListener(citysearch, "complete", function(result){
                if(result && result.city && result.bounds) {
                    var citybounds = result.bounds;
                    //地图显示当前城市
                    $scope.locationmap.setBounds(citybounds);
                    $scope.locationmap.plugin(["AMap.PlaceSearch"], function() {      
                        $scope.MSearch = new AMap.PlaceSearch({ //构造地点查询类
                            pageSize:1,
                            pageIndex:1,
                            city: result.city

                        });
                        AMap.event.addListener($scope.MSearch, "complete", placeSearchCallBack);//返回地点查询结果
                    });
                }
            });
            AMap.event.addListener(citysearch, "error", function(result){alert(result.info);});
        });
        window.map_ready =true;
    };
    
    $scope.showMap = function(){
        if($scope.location.name==''){
            alertify.alert('请输入地点');
            return false;
        }
        else if($scope.showMapFlag ==false){
            $scope.showMapFlag =true;
            $scope.MSearch.search($scope.location.name); //关键字查询
        }
        else{
            $scope.MSearch.search($scope.location.name); //关键字查询
        }
    };

    $scope.getCompany =function() {
        try {
            $scope.show_team = [];
            $http({
                method: 'post',
                url: '/search/company',
                data:{
                    regx : $scope.s_value
                }
            }).success(function(data, status) {
                $scope.companies = data;
                var tmp = 0;
                for(var i = 0; i < $scope.companies.length; i ++) {
                    var team_tmp = $scope.companies[i].team;
                    $scope.companies[i].team = [];
                    for(var j = 0; j < team_tmp.length; j ++) {
                        if(team_tmp[j].gid === $rootScope.groupId){
                            if(team_tmp[j].id.toString() !== $rootScope.teamId){
                                $scope.companies[i].team.push(team_tmp[j]);
                            }
                        }
                    }
                }
                $scope.teams=[];
                if($scope.companies.length <= 0) {
                    alertify.alert("没有找到符合条件的公司!");
                }else{
                    for(var i = 0; i < $scope.companies.length; i ++) {
                        $scope.show_team.push(false);
                    }
                }
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    }

    var show_team_index = -1;
    $scope.toggleTeam = function(cid,index){
        if(show_team_index !== -1)
            $scope.show_team[show_team_index]=false;
        $scope.show_team[index] = true;
        if($scope.show_team[index] && show_team_index!==index){
            $scope.getSelectTeam(cid);
            $scope.selected_index = -1;
        }
        show_team_index = index;
    }

    $scope.getSelectTeam = function(cid) {
        try {
            $scope.teams=[];
            $http({
                method: 'post',
                url: '/search/team',
                data:{
                    cid : cid,
                    gid : $rootScope.groupId,
                    tid : $rootScope.teamId,
                    operate:'part'
                }
            }).success(function(data, status) {
                $scope.teams = data;
                var len = $scope.teams.length;
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    }
    //选择小队
    $scope.getTeam = function () {
        try {
            $http({
                method: 'post',
                url: '/search/team',
                data:{
                    regx : $scope.s_value,
                    gid : $rootScope.groupId,
                    tid : $rootScope.teamId,
                    operate:'all'
                }
            }).success(function(data, status) {
                $scope.teams = data;
                $scope.companies=[];
                if($scope.teams.length <= 0) {
                    alertify.alert("没有找到符合条件的小队!");
                }
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    //选择对战小队
    $scope.provoke_select = function (index) {
        if(!index){//在自己队发挑战
            $scope.team_opposite = $scope.teams[$scope.selected_index]; 
            Campaign.getTags('group',$rootScope.teamId,function(status,data){
                if(!status){
                    $scope.recommand_tags = data;
                }
            });
            Campaign.getMolds('team',$rootScope.teamId,function(status,data){
                if(!status){
                    $scope.mold = data[0].name;
                }
            });
        }
        else{//到对方队动
            $scope.team_opposite = $scope.similarTeams[$scope.selected_index];
            Campaign.getTags('group',$scope.team_opposite._id,function(status,data){
                if(!status){
                    $scope.recommand_tags = data;
                }
            });
            Campaign.getMolds('team',$scope.team_opposite._id,function(status,data){
                if(!status){
                    $scope.mold = data[0].name;
                }
            });
        }
        $scope.modal++;
        $rootScope.loadMapIndex=2;
    };


    $scope.addTag = function(index) {
        $scope.recommand_tags[index].disabled = true;
        $('#comptagsinput').tagsinput('add', $scope.recommand_tags[index]._id);
    };
    //约战
    $scope.provoke = function() {
        if($scope.member_max < $scope.member_min){
            alertify.alert('最少人数须小于最大人数');
        }
        else{
            var _data = {
                theme : $scope.theme,
                content : $scope.content,
                location: $scope.location,
                start_time: $scope.start_time,
                end_time: $scope.end_time,
                deadline: $scope.deadline,
                member_min : $scope.member_min,
                member_max : $scope.member_max,
                tags: $scope.tags?$scope.tags.split(','):[],
                campaign_mold:$scope.mold
            };
            var callback = function(status,data){
                if(!status){
                    window.location = '/campaign/detail/'+data.campaign_id+'?stat=editing';
                }
                else{
                    alertify.alert(data.msg);
                }                
            };
            if($scope.modal===1){//在自己的小队约战
                _data.team_opposite_id =$scope.team_opposite._id
                Campaign.sponsor('/group/provoke/'+$rootScope.teamId,_data,callback);
            }
            else{//在其它小队约战
                _data.team_opposite_id = $rootScope.teamId;
                Campaign.sponsor('/group/provoke/'+$scope.team_opposite._id,_data,callback);
            }
        }
    };

    $scope.preStep = function(){
        $scope.modal--;
    };

    $scope.selcet_team = function(index){
        $scope.selected_index = index;
    };
}]);

integrateGroup.directive('scrollThumbs', function($parse) {
    return{
        restrict: 'A',
        scope: {
            scrollIndex: '='
        },
        compile: function(tElement, tAttrs, transclude){

            var height = parseInt(tAttrs['height']) || 90;
            var count = parseInt(tAttrs['count']) || 3;
            var totalHeight = height * count;

            var holderStyle = 'height:' + totalHeight + "px; margin:0; position:relative; top:0px";

            tElement.attr('style', holderStyle);

            return function(scope, element, attrs) {
                var length = 0;

                scope.$watch('scrollIndex', function(newValue, oldValue) {
                    if (length !== element.children().length) {
                        length = element.children().length;
                    }
                    if (length > count) {
                        if (newValue > 1 && newValue < length - 1) {
                            element.css('top', '-' + (height * (newValue - 1)) + 'px');
                        } else if (newValue <= 1) {
                            element.css('top', '0');
                        } else if (newValue >= length - 1) {
                            element.css('top', '-' + (height * (length - count)) + 'px');
                        }
                    }
                });

            };
        }

    }
});




