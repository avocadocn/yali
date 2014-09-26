'use strict';

var departmentApp = angular.module('donler');


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
departmentApp.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider
      .when('/message', {
        templateUrl: '/message_list',
        controller: 'GroupMessageController',
        controllerAs: 'messages'
      })
      .when('/campaign', {
        templateUrl: '/group/campaign',
        controller: 'CampaignListController',
        controllerAs: 'campaign'
      })
      .when('/info', {
        templateUrl: '/department/info',
        controller: 'infoController',
        controllerAs: 'account',
      })
      .when('/timeLine/:tid', {
        templateUrl: function(params){
            return '/group/timeline/'+params.tid;
        },
        controller: 'TimeLineController'
      })
      .otherwise({
        redirectTo: '/message'
      });
}]);
departmentApp.run(['$http','$rootScope', '$location', function ($http, $rootScope, $location) {
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
                $rootScope.number += 1;
                $rootScope.isMember = true;
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
                $rootScope.number --;
                $rootScope.isMember = false;
            }).error(function(data,status){
                alertify.alert('DATA ERROR');
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

departmentApp.controller('TimeLineController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {
         $rootScope.nowTab = window.location.hash.substr(2);
    }
]);



departmentApp.controller('GroupMessageController', ['$http','$scope','$rootScope',
  function ($http, $scope,$rootScope) {
    $scope.private_message_content = {
        'text':""
    };
    $scope.toggle = [];
    $scope.new_comment = [];
    $rootScope.$watch('teamId',function(tid){
        $http.get('/groupMessage/team/'+tid+'/0?'+ (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            $scope.group_messages = data.group_messages;
            $scope.user = data.user;
            $scope.role = data.role;

            $rootScope.message_corner = true;
            if(data.group_messages.length<20){
                $scope.loadMore_flag = false;
            }
            else{
                $scope.loadMore_flag = true;
            }
            $scope.group_messages = messageConcat(data.group_messages,$rootScope,$scope),true;
        });
    });

    //var teamId = $('#team_content').attr('team-id');
    $rootScope.nowTab ='message';
    $scope.block = 1;
    $scope.page = 1;
    $scope.pageTime = [0];
    $scope.lastPage_flag = false;
    $scope.nextPage_flag = false;


    $scope.index_for_participator = 0;
    $scope.modalPerticipator = function(index){
        $rootScope.index_for_participator = index;
        $('#sponsorMessageCampaignModel').modal();
    }
    $scope.sendToParticipator = function(){
        try{
          $http({
              method: 'post',
              url: '/message/push/campaign',
              data:{
                  campaign_id : $scope.group_messages[$rootScope.index_for_participator].campaign._id,
                  content : $scope.private_message_content.text
              }
          }).success(function(data, status) {
              if(data.msg === 'SUCCESS'){
                $scope.private_message_content.text = "";
                $rootScope.team_length++;
                $rootScope.o ++;
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

    $scope.loadMore = function(){
        $http.get('/groupMessage/team/'+$rootScope.teamId+'/'+new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime()+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            if(data.result===1 && data.group_messages.length>0){
                $scope.group_messages = $scope.group_messages.concat(messageConcat(data.group_messages,$rootScope,$scope,false));
                if(data.group_messages.length<20){
                    $scope.loadMore_flag = false;
                }
                else{
                    $scope.loadMore_flag = true;
                }
                if(++$scope.block==5){
                    $scope.nextPage_flag = true;
                    $scope.loadMore_flag = false;
                    if($scope.page!=1){
                        $scope.lastPage_flag = true;
                    }
                }

            }
            else{
                $scope.loadOver_flag = true;
                $scope.loadMore_flag = false;
                $scope.nextPage_flag = false;
            }
        });
    }
    $scope.changePage = function(flag){
        var start_time = flag ==1? new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime() :$scope.pageTime[$scope.page-2];
        $http.get('/groupMessage/team/'+$rootScope.teamId+'/'+start_time+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            if(data.result===1 && data.group_messages.length>0){
                if(flag ==1){
                    $scope.page++;
                    $scope.pageTime.push(new Date($scope.group_messages[$scope.group_messages.length-1].create_time).getTime());
                }
                else{
                    $scope.page--;
                }
                $scope.group_messages = messageConcat(data.group_messages,$rootScope,$scope,true);
                if(data.group_messages.length<20){
                    $scope.loadMore_flag = false;
                }
                else{
                    $scope.loadMore_flag = true;
                }
                $scope.nextPage_flag = false;
                $scope.lastPage_flag = false;
                $scope.loadOver_flag = false;
                $scope.block = 1;
                window.scroll(0,0);
            }
            else{
                $scope.nextPage_flag = false;
                $scope.loadMore_flag = false;
                $scope.loadOver_flag = true;
            }
        });
    }
    $scope.toggleOperate = function(index){
        $scope.toggle[index] = !$scope.toggle[index];
        $scope.message_index = index;
    }
    $scope.getComment = function(index){
        if($scope.toggle){
            try {
                $http({
                    method: 'post',
                    url: '/comment/pull/team/'+$rootScope.teamId,
                    data:{
                        host_id : $scope.group_messages[index].campaign._id
                    }
                }).success(function(data, status) {
                    if(data.comments.length > 0){
                        $scope.group_messages[index].comments = data.comments;
                        $scope.fixed_sum = data.comments.length;
                    }
                }).error(function(data, status) {
                    alertify.alert('DATA ERROR');
                });
            }
            catch(e) {
                console.log(e);
            }
        }
    }

    $scope.deleteComment = function(index){
        try {
            $http({
                method: 'post',
                url: '/comment/delete',
                data:{
                    comment_id : $scope.group_messages[$scope.message_index].comments[index]._id
                }
            }).success(function(data, status) {
                if(data === 'SUCCESS'){
                    $scope.group_messages[$scope.message_index].comments.splice(index,1);
                    $scope.group_messages[$scope.message_index].campaign.comment_sum --;
                } else {
                    alertify.alert('DATA ERROR');
                }
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    }
    $scope.comment = function(index){
        if($scope.group_messages[index].comments.length > 0){
            var tmp_comment = $scope.group_messages[index].comments[0];
            if(tmp_comment.poster._id === $scope.user._id){
                if($scope.new_comment[index].text === tmp_comment.content){
                    alertify.alert('勿要重复留言!');
                    return;
                }
            }
        }
        try {
            $http({
                method: 'post',
                url: '/comment/push',
                data:{
                    host_id : $scope.group_messages[index].campaign._id,
                    content : $scope.new_comment[index].text,
                    host_type : 'campaign'
                }
            }).success(function(data, status) {
                if(data.msg === 'SUCCESS'){
                    $scope.group_messages[index].campaign.comment_sum ++;
                    $scope.group_messages[index].comments.unshift({
                        'show':true,
                        'host_id' : data.comment.host_id,
                        'content' : data.comment.content,
                        'create_date' : data.comment.create_date,
                        'poster' : data.comment.poster,
                        'host_type' : data.comment.host_type,
                        'index' : $scope.fixed_sum+1
                    });
                    $scope.new_comment[index].text='';
                } else {
                    alertify.alert('DATA ERROR');
                }
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    }
    //消除ajax缓存
    $scope.vote = function(competition_id, vote_status, index) {
         try {
            $http({
                method: 'post',
                url: '/users/vote',
                data:{
                    competition_id : competition_id,
                    aOr : vote_status,
                    tid : $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].id
                }
            }).success(function(data, status) {
                if(data.result===0) {
                    alertify.alert(data.msg);
                } else {
                    $scope.group_messages[index].vote_flag = vote_status ? data.data.quit : -data.data.quit;
                    $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].vote.positive = data.data.positive;
                    $scope.group_messages[index].campaign.camp[$scope.group_messages[index].camp_flag].vote.negative = data.data.negative;
                }
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    };
    $scope.join = function(campaign_id,index) {
        try {
            $http({
                method: 'post',
                url: '/campaign/joinCampaign/' + campaign_id,
                data:{
                    campaign_id : campaign_id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    //alert('成功加入该活动!');
                    alertify.alert('成功加入该活动!');
                    $scope.group_messages[index].join_flag = true;
                    $scope.group_messages[index].member_num++;
                }
                else{
                    alertify.alert(data.msg);
                }
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $scope.quit = function(campaign_id,index) {
        try {
            $http({
                method: 'post',
                url: '/campaign/quitCampaign/' + campaign_id,
                data:{
                    campaign_id : campaign_id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    alertify.alert('成功退出该活动!');
                    //alert('您已退出该活动!');
                    $scope.group_messages[index].join_flag = false;
                    $scope.group_messages[index].member_num--;
                }
                else{
                    alertify.alert(data.msg);
                }
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    };
    //应战
    $scope.responseProvoke = function(tid,competition_id) {
         try {
            $http({
                method: 'post',
                url: '/group/responseProvoke/'+$rootScope.teamId,
                data:{
                    competition_id : competition_id
                }
            }).success(function(data, status) {
                window.location.reload();
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);


departmentApp.controller('CampaignListController', ['$http', '$scope','$rootScope',
  function ($http, $scope, $rootScope) {
    $rootScope.$watch('teamId',function(teamId){
        $http.get('/campaign/getCampaigns/team/'+teamId+'/all/0/0?' + (Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            $scope.campaigns = data.campaigns;
            $rootScope.sum = $scope.campaigns.length;
            if(data.campaignLength<20){
                $scope.loadMore_flag = false;
            }
            else{
                $scope.loadMore_flag = true;
            }
        });
    });

    $scope.loadMore_flag = true;
    $scope.block = 1;
    $scope.page = 0;
    $scope.lastPage_flag = false;
    $scope.nextPage_flag = false;

    $scope.loadMore = function(){
        $http.get('/campaign/getCampaigns/team/'+teamId+'/all/'+$scope.page+'/'+$scope.block+'?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            if(data.result===1 && data.campaigns.length>0){
                $scope.campaigns = $scope.campaigns.concat(data.campaigns);
                if(data.campaignLength<20){
                    $scope.loadMore_flag = false;
                }
                else{
                    $scope.loadMore_flag = true;
                }
                if(++$scope.block==5){
                    $scope.nextPage_flag = true;
                    $scope.loadMore_flag = false;
                    if($scope.page>1){
                        $scope.lastPage_flag = true;
                    }
                }

            }
            else{
                $scope.loadOver_flag = true;
                $scope.loadMore_flag = false;
                $scope.nextPage_flag = false;
            }
        });
    }
    $scope.changePage = function(flag){
        $http.get('/campaign/getCampaigns/team/'+teamId+'/all/'+($scope.page+flag)+'/0?'+(Math.round(Math.random()*100) + Date.now())).success(function(data, status) {
            if(data.result===1 && data.campaigns.length>0){
                if(flag ==1){
                    $scope.page++;
                }
                else{
                    $scope.page--;
                }
                $scope.campaigns = data.campaigns;
                $scope.nextPage_flag = false;
                $scope.lastPage_flag = false;
                $scope.loadOver_flag = false;
                $scope.block = 1;
                if(data.campaignLength<20){
                    $scope.loadMore_flag = false;
                    if(flag==1){
                        $scope.lastPage_flag = true;
                        $scope.nextPage_flag = false;
                    }
                    else{
                        $scope.lastPage_flag = false;
                        $scope.nextPage_flag = true;
                    }
                    $scope.loadOver_flag = true;
                }
                else{
                    $scope.loadMore_flag = true;
                    $scope.nextPage_flag = false;
                    $scope.lastPage_flag = false;
                    $scope.loadOver_flag = false;
                }
                window.scroll(0,0);
            }
            else{
                $scope.nextPage_flag = false;
                $scope.loadMore_flag = false;
                $scope.loadOver_flag = true;
            }
        });
    }
    $scope.getId = function(cid) {
        $scope.campaign_id = cid;
    };
    // $scope.join = function(campaign_id,index) {
    //     try {
    //         $http({
    //             method: 'post',
    //             url: '/users/joinCampaign',
    //             data:{
    //                 campaign_id : campaign_id
    //             }
    //         }).success(function(data, status) {
    //             if(data.result===1){
    //                 //alert('成功加入该活动!');
    //                 alertify.alert('成功加入该活动!');
    //                 $scope.campaigns[index].join_flag = 1;
    //                 $scope.campaigns[index].member_num++;
    //             }
    //             else{
    //                 alertify.alert(data.msg);
    //             }
    //         }).error(function(data, status) {
    //             alertify.alert('DATA ERROR');
    //         });
    //     }
    //     catch(e) {
    //         console.log(e);
    //     }
    // };

    // $scope.quit = function(campaign_id,index) {
    //     try {
    //         $http({
    //             method: 'post',
    //             url: '/users/quitCampaign',
    //             data:{
    //                 campaign_id : campaign_id
    //             }
    //         }).success(function(data, status) {
    //             if(data.result===1){
    //                 alertify.alert('成功退出该活动!');
    //                 //alert('您已退出该活动!');
    //                 $scope.campaigns[index].join_flag = -1;
    //                 $scope.campaigns[index].member_num--;
    //             }
    //             else{
    //                 alertify.alert(data.msg);
    //             }
    //         }).error(function(data, status) {
    //             alertify.alert('DATA ERROR');
    //         });
    //     }
    //     catch(e) {
    //         console.log(e);
    //     }
    // };
    // //应战
    // $scope.responseProvoke = function(competition_id) {
    //      try {
    //         $http({
    //             method: 'post',
    //             url: '/group/responseProvoke',
    //             data:{
    //                 competition_id : competition_id
    //             }
    //         }).success(function(data, status) {
    //             window.location.reload();
    //         }).error(function(data, status) {
    //             alertify.alert('DATA ERROR');
    //         });
    //     }
    //     catch(e) {
    //         console.log(e);
    //     }
    // };

    $scope.cancel = function (_id) {
        try {
            $http({
                method: 'post',
                url: '/campaign/cancel/'+_id,
                data:{
                    campaign_id : _id
                }
            }).success(function(data, status) {
                if(data.result===1){
                    window.location.reload();
                }
                else{
                    alertify(data.msg);
                }
            }).error(function(data, status) {
                alertify.alert('DATA ERROR');
            });
        }
        catch(e) {
            console.log(e);
        }
    };
}]);


departmentApp.controller('infoController', ['$http', '$scope','$rootScope',function($http, $scope, $rootScope) {
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
            });
        }

    });
    $scope.editToggle = function() {
        $scope.unEdit = !$scope.unEdit;
        if($scope.unEdit) {
            try{
                $http({
                    method : 'post',
                    url : '/group/saveInfo/'+$rootScope.teamId,
                    data : {
                        'name' : $scope.name,
                        'brief' : $scope.team.brief
                    }
                }).success(function(data, status) {
                    //TODO:更改对话框
                    if(data.result === 1) {
                        window.location.reload();
                    }
                    else
                        alertify.alert(data.msg);
                }).error(function(data, status) {
                    //TODO:更改对话框
                });
            }
            catch(e) {
                console.log(e);
            }
            $scope.buttonStatus = '编辑';
        }
        else {
            $scope.buttonStatus = '保存';
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
}]);



departmentApp.controller('SponsorController', ['$http', '$scope','$rootScope',function($http, $scope, $rootScope) {
    $scope.multi = false;          //是否发起多部门会活动
    $scope.departments = [];
    $scope.select_departments = [];
    $scope.main_department = null;
    $scope.search_department = null;

    $scope.search = function(){
        var find = false;
        $scope.select_departments = [];
        for(var i = 0 ; i < $scope.departments.length; i ++){
            if($scope.departments[i].name.indexOf($scope.search_department) > -1){
                $scope.departments[i].selected = false;
                $scope.select_departments.push($scope.departments[i]);
            }
        }
    }
    $scope.showCampaignSponsor = function(){
        $scope.multi = true;
        $('#sponsorCampaignModel').modal();
    }

    $scope.select_department = function(){
        for(var i = 0; i < $scope.select_departments.length; i ++){
            if($scope.select_departments[i]._id === $scope.main_department._id){
                $scope.main_department.selected = true;
                return;
            }
        }
        $scope.select_departments = [];
        $scope.main_department.selected = true;
        $scope.select_departments.push($scope.main_department);
    }

    $scope.selectReady = function(index){
        for(var i = 0; i < $scope.select_departments.length; i ++){
            if($scope.select_departments[i].selected){
                $scope.select_departments[i].selected = false;
                break;
            }
        }
        for(var i = 0; i < $scope.select_departments.length; i ++){
            if(i === index){
                $scope.select_departments[i].selected = true;
                $scope.main_department = $scope.select_departments[i];
                break;
            }
        }
    }
    //将获取的部门格式化存入 $sacope.departments
    $scope.departmentFormat = function(departments){
        for(var i = 0 ; i < departments.length; i ++){
            if(departments[i]._id !== $scope.did){
                    $scope.departments.push({
                    '_id':departments[i]._id,
                    'name':departments[i].name,
                    'team':departments[i].team,
                });
            }
        }
    }

    //获取除了当前部门外的所有部门
    $scope.$watch('did',function(did){
        $scope.$watch('cid',function(cid){
            $http
            .get('/department/detail/multi/' + cid)
            .success(function(data, status) {
                $scope.departmentFormat(data.departments);
            });
        });
    });

    $scope.showMapFlag=false;
    $scope.location={name:'',coordinates:[]};
    $("#start_time").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.start_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#end_time').datetimepicker('setStartDate', dateUTC);
        $('#deadline').datetimepicker('setEndDate', dateUTC);
    });
    $("#end_time").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.end_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#start_time').datetimepicker('setEndDate', dateUTC);

    });
    $("#deadline").on("changeDate",function (ev) {
        var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
        $scope.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
        $('#end_time').datetimepicker('setEndDate', dateUTC);
    });

    $rootScope.$watch('loadMapIndex',function(value){
        if($rootScope.loadMapIndex){
            if(value==1){
                //加载地图
                if(!window.map_ready){
                    window.campaign_map_initialize = $scope.initialize;
                    var script = document.createElement("script");  
                    script.src = "http://api.map.baidu.com/api?v=2.0&ak=krPnXlL3wNORRa1KYN1RAx3c&callback=campaign_map_initialize";
                    document.body.appendChild(script);
                }
                else{
                    $scope.initialize();
                }
            }
        }

    });

    $scope.initialize = function(){
        $scope.locationmap = new BMap.Map("mapDetail");            // 创建Map实例
        $scope.locationmap.centerAndZoom('上海',15);
        $scope.locationmap.enableScrollWheelZoom(true);
        $scope.locationmap.addControl(new BMap.NavigationControl({type: BMAP_NAVIGATION_CONTROL_SMALL}));
        var options = {
            onSearchComplete: function(results){
                // 判断状态是否正确
                if ($scope.local.getStatus() == BMAP_STATUS_SUCCESS){
                    $scope.locationmap.clearOverlays();
                    var nowPoint = new BMap.Point(results.getPoi(0).point.lng,results.getPoi(0).point.lat);
                    //var myIcon = new BMap.Icon("/img/icons/favicon.ico", new BMap.Size(30,30));
                    $scope.locationmap.centerAndZoom(nowPoint,15);
                    var marker = new BMap.Marker(nowPoint);  // 创建标注
                    $scope.locationmap.addOverlay(marker);              // 将标注添加到地图中
                    marker.enableDragging();    //可拖拽
                    $scope.location.coordinates=[results.getPoi(0).point.lng,results.getPoi(0).point.lat];
                    marker.addEventListener("dragend", function changePoint(){
                        var p = marker.getPosition();
                        $scope.location.coordinates=[p.lng , p.lat];
                    });
                }
            }
        };
        $scope.local = new BMap.LocalSearch($scope.locationmap,options);
        window.map_ready =true;
    };


    $scope.showMap = function(){
        if($scope.location.name==''){
            alertify.alert('请输入地点');
            return false;
        }
        else if($scope.showMapFlag ==false){
            $scope.showMapFlag =true;
            $scope.local.search($scope.location.name);
        }
        else{
            $scope.local.search($scope.location.name);
        }
    };

    $scope.sponsor = function() {
        var _data;
        var _url;
        if($scope.multi){
            _url = '/department/'+$scope.did+'/multi_sponsor';
            _data = {
                select_departments:[$scope.main_department],
                theme: $scope.theme,
                location: $scope.location,
                content : $scope.content,
                time:{
                    start:$scope.start_time,
                    end:$scope.end_time,
                    deadline:$scope.deadline
                },
                member_num:{
                    min:$scope.member_min,
                    max:$scope.member_max
                },
                tags:$scope.tags.split(',')
            }
            // console.log($scope.deadline);
        }else{
            _url = '/department/'+$scope.did+'/sponsor';
            _data = {
                theme: $scope.theme,
                location: $scope.location,
                content : $scope.content,
                start_time : $scope.start_time,
                end_time : $scope.end_time,
                member_min: $scope.member_min,
                member_max: $scope.member_max,
                deadline: $scope.deadline,
                tags:$scope.tags.split(',')
            }
            // console.log($scope.deadline);
        }
        try{
            $http({
                method: 'post',
                url: _url,
                data:_data
            }).success(function(data, status) {
                //发布活动后跳转到显示活动列表页面
                window.location.reload();

            }).error(function(data, status) {
                //TODO:更改对话框
                alertify.alert('DATA ERROR');
            });

        }
        catch(e){
            console.log(e);
        }
    };
}]);
departmentApp.controller('ProvokeController', ['$http', '$scope','$rootScope',function($http, $scope, $rootScope) {

}]);
