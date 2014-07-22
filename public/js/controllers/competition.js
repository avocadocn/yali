//组件列表控制器
'use strict';


var groupApp = angular.module('donler');
groupApp.directive('donlerMember', ['$rootScope', function($rootScope) {
      return {
          restrict: 'A',
          link: function(scope, el, attrs, controller) {
            var _id = angular.element(el).attr('id');
            var _tid = angular.element(el).attr('data-tid');
            var _x = angular.element(el).attr('data-left');
            var _y = angular.element(el).attr('data-top');
            angular.element(el).css('left',_x+'%');
            angular.element(el).css('top',_y+'%');
            angular.element('#'+_id).attr('draggable',false);
            angular.element(el).attr('src',angular.element('#'+_id.substr(3)).attr('src'));
            if(angular.element(el).attr('x-donler-member')==="true"){
              if(!scope.competition_format[_tid]){
                scope.competition_format[_tid]={};
              }
              _id = scope.getMemberId(_id);
              scope.competition_format[_tid][_id] ={
                'x':_x,
                'y':_y
              };
            }
          }
      }
  }]);
groupApp.directive('donlerDraggable', ['$rootScope', function($rootScope) {
      return {
          restrict: 'A',
          link: function(scope, el, attrs, controller) {
            angular.element(el).attr("draggable", "true");
            var id = angular.element(el).attr("id");
            el.bind("dragstart", function(e) {
              angular.element(e.target).addClass('donler_dragover');
              e.originalEvent.dataTransfer.setData("member_id",e.originalEvent.target.id);
              e.originalEvent.dataTransfer.setData("nowx",e.originalEvent.pageX);
              e.originalEvent.dataTransfer.setData("nowy",e.originalEvent.pageY);
              e.originalEvent.dataTransfer.dropEffect ='move';
              e.originalEvent.dataTransfer.setDragImage(e.originalEvent.target,20,20);
            });

            el.bind("dragend", function(e) {
              angular.element(e.target).removeClass('donler_dragover');
              var _id = e.originalEvent.target.id;
              if(_id.indexOf('on_')==0){
                var $field = angular.element('.formatField');
                var _left = $field.offset().left;
                var _top = $field.offset().top;
                var _right = _left + $field.width();
                var _bottom = _top +$field.height();
                var _nowx = e.originalEvent.pageX;
                var _nowy = e.originalEvent.pageY;
                if (_nowx < _left || _nowx > _right || _nowy > _bottom || _nowy < _top) {
                  scope.updateFormatData(_id,angular.element('#'+_id).attr('data-tid'),-1);
                  angular.element(e.originalEvent.target).remove();
                  _id = scope.getMemberId(_id);
                  angular.element('#'+_id).attr('draggable',true);
                };
              }
            });
          }
      }
  }]);

groupApp.directive('donlerDropTarget', ['$rootScope', function($rootScope) {
      return {
          restrict: 'A',
          link: function(scope, el, attrs, controller) {
              var id = angular.element(el).attr("id");

              el.bind("dragover", function(e) {
                if (e.originalEvent.preventDefault) {
                  e.originalEvent.preventDefault(); // Necessary. Allows us to drop.
                }

                e.originalEvent.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
                return false;
              });

              // el.bind("dragenter", function(e) {
              //   // this / e.target is the current hover target
              // });

              // el.bind("dragleave", function(e) {
              //   angular.element(e.target).removeClass('donler_dragover');  // this / e.target is previous target element.
              // });

              el.bind("drop", function(e) {
                if (e.originalEvent.preventDefault) {
                  e.originalEvent.preventDefault(); // Necessary. Allows us to drop.
                }

                if (e.originalEvent.stopPropagation) {
                  e.originalEvent.stopPropagation(); // Necessary. Allows us to drop.
                }
                var data=e.originalEvent.dataTransfer.getData("member_id");
                if(!data){
                  return false;
                }
                var _newEle ={};
                var _x = angular.element(e.originalEvent.target).offset().left;
                var _y = angular.element(e.originalEvent.target).offset().top;
                var _width = angular.element(e.originalEvent.target).width();
                var _height = angular.element(e.originalEvent.target).height();
                var _offsetX = e.originalEvent.pageX - _x;
                var _offsetY = e.originalEvent.pageY - _y;
                if(angular.element('#'+data).attr('data-camp')=='0'&&_offsetX > _width / 2||angular.element('#'+data).attr('data-camp')=='1'&&_offsetX < _width / 2){
                  return false;
                };
                if(data.indexOf('on_')!=0){
                  _newEle = angular.element('#'+data).clone(true);
                  _newEle.attr('id','on_'+data);
                  _newEle.css('top',_offsetY > 0 ? _offsetY-3 : 0);
                  _newEle.css('left',_offsetX > 0 ? _offsetX-3 : 0);
                  angular.element(e.originalEvent.target).append(_newEle);
                  angular.element('#'+data).attr('draggable',false);
                }
                else{
                  _newEle = angular.element('#'+data);
                  var _top= _newEle.position().top;
                  var _left= _newEle.position().left;
                  var datax=e.originalEvent.dataTransfer.getData("nowx");
                  var datay=e.originalEvent.dataTransfer.getData("nowy");
                  _offsetX = _left + e.originalEvent.pageX - datax;
                  _offsetY = _top +e.originalEvent.pageY - datay;
                  _newEle.css('top',_offsetY > 0 ? _offsetY : 0);
                  _newEle.css('left',_offsetX > 0 ? _offsetX : 0);
                };
                var _percentX = 100 * _offsetX / _width;
                var _percentY = 100 * _offsetY / _height;
                scope.updateFormatData(data,angular.element('#'+data).attr('data-tid'),_percentX.toFixed(2),_percentY.toFixed(2));
              });
          }
      }
  }]);
groupApp.controller('competitionController', ['$http', '$scope','$rootScope',function ($http, $scope,$rootScope) {
    $scope.$watch('competition_id',function(competition_id){
        if(competition_id==null){
            return;
        }
        $scope.getComment(); //获取留言
        if($scope.role==='HR'||$scope.role==='LEADER'){
          setInterval($scope.pushFormatData,3000);
        }
    });
    $scope.updateFlag = false;
    $scope.comments = [];
    $scope.competition_format = {};
    $scope.new_comment = {
        text:''
    };
    $scope.modify_caption = "成绩确认";
    $scope.object_caption = "发出异议";
    $scope.edit = false;
    $scope.getComment = function(){
        try {
            $http({
                method: 'post',
                url: '/comment/pull',
                data:{
                    host_id : $scope.competition_id
                }
            }).success(function(data, status) {
                if(data.length > 0){
                    $scope.comments = data;
                    $scope.fixed_sum = data.length;
                    for(var i = 0; i < $scope.comments.length; i ++) {
                        if($scope.comments[i].status == 'delete'){
                            $scope.comments.splice(i,1);
                            i--;
                        }else{
                            $scope.comments[i].delete_permission = $scope.role === 'LEADER' || $scope.role === 'HR' || $scope.comments[i].poster._id === $scope.user._id;
                            $scope.comments[i].index = data.length - i;
                        }
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

    $scope.deleteComment = function(index){
        try {
            $http({
                method: 'post',
                url: '/comment/delete',
                data:{
                    comment_id : $scope.comments[index]._id,
                    host_type:'competition',
                    host_id:$scope.competition_id
                }
            }).success(function(data, status) {
                if(data === 'SUCCESS'){
                    $scope.comments.splice(index,1);
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

    $scope.comment = function(){
      if($scope.comments.length > 0){
        var tmp_comment = $scope.comments[0];
        if(tmp_comment.poster._id === $scope.user._id){
            if($scope.new_comment.text === tmp_comment.content){
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
                  host_id : $scope.competition_id,
                  content : $scope.new_comment.text,
                  host_type : 'competition'
              }
          }).success(function(data, status) {
              if(data.msg === 'SUCCESS'){
                  $scope.comments.unshift({
                      'host_id' : data.comment.host_id,
                      'content' : data.comment.content,
                      'create_date' : data.comment.create_date,
                      'poster' : data.comment.poster,
                      'host_type' : data.comment.host_type,
                      'index' : $scope.fixed_sum+1
                  });
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
    $scope.tip = function(){
      var content = "";
      if($scope.confirm_mode == '3'){
        content="您可以编辑比分框里的分数,然后点击'比赛确认'按钮向对方发送待确认比分!";
      }else{
        content="您可以接受对方发来的分数,如果您对次比分有疑问,可以修改比分框里的分数,然后点击'发出异议'按钮即可!";
      }
      $("#score_tip").tooltip({
        "trigger":"hover",
        "title":content,
        "placement" : "right"
      });
    }
    // $scope.msg_show = $('#competition_data').attr('data-msg-show');
    // $scope.rst_content = $('#competition_data').attr('data-rst-content');
    // $scope.score_a = $('#competition_data').attr('data-score-a');
    // $scope.score_b = $('#competition_data').attr('data-score-b');

    //alert($scope.msg_show);
    var competition_id = $('#competition_content').attr('data-id');

    $scope.numValidate = function(){
      if(isNaN(Number($scope.score_a)) || isNaN(Number($scope.score_b))){
        alertify.alert("请输入数字!");
        $scope.score_a = 0;
        $scope.score_b = 0;
      }
      else if($scope.score_a.length>3||$scope.score_b.length>3){
        alertify.alert("分数最大长度为3!");
      }
    }

    $scope.scoreModify = function(){
      if(!$scope.edit){
        $scope.edit = true;
        $scope.modify_caption = "发送";
        $scope.object_caption = "发送";
      }else{
        $scope.modify_caption = "成绩确认";
        $scope.object_caption = "发出异议";
        $scope.confirmScore(false);
      }
    }
    $scope.confirmScore = function (confirm) {
      try {
        $http({
          method: 'post',
          url: '/competition/resultConfirm/'+competition_id,
          data:{
            score_a : $scope.score_a,
            score_b : $scope.score_b,
            rst_accept : confirm
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
    //应战
    $scope.responseProvoke = function(tid,provoke_message_id) {
        try {
            $http({
                method: 'post',
                url: '/group/responseProvoke/'+tid,
                data:{
                    competition_id : competition_id
                }
            }).success(function(data, status) {
                window.location.reload();
            }).error(function(data, status) {
                //$rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };
    $scope.joinCampaign = function (competition_id,tid) {
        //$rootScope.donlerAlert($scope.campaign_id);
        try {
            $http({
                method: 'post',
                url: '/campaign/joinCampaign/'+competition_id,
                data:{
                    campaign_id : competition_id,
                    tid:tid
                }
            }).success(function(data, status) {
                if(data.result===1){
                  window.location.reload();
                }
                else{
                    //$rootScope.donlerAlert(data.msg);
                }
            }).error(function(data, status) {
                //$rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };

    $scope.quitCampaign = function (competition_id,tid) {
        try {
            $http({
                method: 'post',
                url: '/campaign/quitCampaign/'+competition_id,
                data:{
                    campaign_id : competition_id,
                    tid:tid
                }
            }).success(function(data, status) {
                if(data.result===1){
                    window.location.reload();
                }
                else{
                    //$rootScope.donlerAlert(data.msg);
                }
            }).error(function(data, status) {
                //$rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
            });
        }
        catch(e) {
            console.log(e);
        }
    };
    $scope.vote = function(competition_id, vote_status,tid) {
      try {
          $http({
              method: 'post',
              url: '/campaign/vote/'+competition_id,
              data:{
                  competition_id : competition_id,
                  aOr : vote_status,
                  tid : tid
              }
          }).success(function(data, status) {
              if(data.result===1) {
                  window.location.reload();
              }
          });
      }
      catch(e) {
          console.log(e);
      }
    };
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
    $scope.getMemberId = function(id){
      return id.substr(id.indexOf('__')+2);
    };
    $scope.updateFormatData = function(id,tid,percentX,percentY){
      id = $scope.getMemberId(id);

      if(percentX===-1){
        delete $scope.competition_format[tid][id];
        $scope.pushFormatData(tid);
      }
      else{
        if(!$scope.competition_format[tid]){
          $scope.competition_format[tid]={};
        }
        if($scope.competition_format[tid][id]){
          var nowx = $scope.competition_format[tid][id].x;
          var nowy = $scope.competition_format[tid][id].y;
        }
        $scope.competition_format[tid][id] ={
          'x':percentX,
          'y':percentY
        };
        if(!nowx || nowx&& Math.abs(nowx-percentX)>=5||nowy&& Math.abs(nowy-percentY)>=5){
          $scope.pushFormatData(tid);
        }
        else{
          $scope.updateFlag = true;
        }
      }
    };
    $scope.pushFormatData = function(_tid){
      if(_tid){
        $.post('/group/updateFormation/'+_tid+'/'+$scope.competition_id,{'formation':$scope.competition_format[_tid]},function(data,status){
          if(data.result===0){
            alertify.alert(data.msg);
          }
        });
      }
      else if($scope.updateFlag){
        for (var tid in $scope.competition_format){
          $.post('/group/updateFormation/'+tid+'/'+$scope.competition_id,{'formation':$scope.competition_format[tid]},function(data,status){
            if(data.result===0){
              alertify.alert(data.msg);
            }
          });
        }
        $scope.updateFlag=false;
      }
    }

}]);


(function(window){
  $(function(){
    window.initialize = function(){
      // 百度地图API功能
      var map = new BMap.Map("location");            // 创建Map实例
      var _address = competition_location['address']?competition_location['address'] :'sss';
      var _locationName = competition_location['name'];
      var _longitude = competition_location['coordinates'][0]?competition_location['coordinates'][0]:116.404 ;
      var _latitude = competition_location['coordinates'][1]?competition_location['coordinates'][1]:39.915;
      var point = new BMap.Point(_longitude, _latitude);    // 创建点坐标
      map.centerAndZoom(point,15);                     // 初始化地图,设置中心点坐标和地图级别。
      map.enableScrollWheelZoom();
      map.addControl(new BMap.NavigationControl({anchor: BMAP_ANCHOR_BOTTOM_RIGHT, type: BMAP_NAVIGATION_CONTROL_ZOOM}));
      var marker = new BMap.Marker(point);  // 创建标注
      var label = new BMap.Label(competition_location['name'],{offset:new BMap.Size(20,-10)});
      marker.setLabel(label);
      map.addOverlay(marker);              // 将标注添加到地图中
      function showInfo(e){
        var opts = {
          width : 200,     // 信息窗口宽度
          height: 60,     // 信息窗口高度
          title : _locationName, // 信息窗口标题
        };
        var infoWindow = new BMap.InfoWindow(_address, opts);  // 创建信息窗口对象
        map.openInfoWindow(infoWindow,point); //开启信息窗口
      }
      map.addEventListener("click", showInfo);
    }

  });
}(window));

