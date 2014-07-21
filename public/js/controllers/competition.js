//组件列表控制器
'use strict';


var groupApp = angular.module('donler');

groupApp.controller('competitionController', ['$http', '$scope','$rootScope',function ($http, $scope,$rootScope) {
    $scope.$watch('competition_id',function(competition_id){
        if(competition_id==null){
            return;
        }
        $scope.getComment(); //获取留言
    });
    $scope.comments = [];

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
}]);


(function(window){
  $(function(){
    var competition_format = {};
    var allowDrop =function(e){
      e.originalEvent.preventDefault();
    };

    var drag =function(e){
      e.originalEvent.dataTransfer.setData("member_id",e.originalEvent.target.id);
      e.originalEvent.dataTransfer.setData("nowx",e.originalEvent.pageX);
      e.originalEvent.dataTransfer.setData("nowy",e.originalEvent.pageY);
      e.originalEvent.dataTransfer.dropEffect ='move';
    };


    var drop =function(e){
      e.originalEvent.preventDefault();
      var data=e.originalEvent.dataTransfer.getData("member_id");
      var _newEle ={};
      var _x = $(e.originalEvent.target).offset().left;
      var _y = $(e.originalEvent.target).offset().top;
      var _width = $(e.originalEvent.target).width();
      var _height = $(e.originalEvent.target).height();
      var _offsetX = e.originalEvent.pageX - _x - 10;
      var _offsetY = e.originalEvent.pageY - _y -10;
      if($('#'+data).attr('data-camp')=='0'&&_offsetX > _width / 2||$('#'+data).attr('data-camp')=='1'&&_offsetX < _width / 2){
        return false;
      };
      if(data.indexOf('on_')!=0){
        _newEle = $('#'+data).clone(true);
        _newEle.attr('id','on_'+data);
        _newEle.css('top',_offsetY > 0 ? _offsetY : 0);
        _newEle.css('left',_offsetX > 0 ? _offsetX : 0);
        $(e.originalEvent.target).parent().append(_newEle);
        $('#'+data).attr('draggable',false);
      }
      else{
        _newEle = $('#'+data);
        var _top= _newEle.position().top;
        var _left= _newEle.position().left;
        var datax=e.originalEvent.dataTransfer.getData("nowx");
        var datay=e.originalEvent.dataTransfer.getData("nowy");
        _offsetX = _left + e.originalEvent.pageX - datax;
        _offsetY = _top +e.originalEvent.pageY - datay;
        console.log(_left,datax,_offsetX);
        console.log(_top,datay,_offsetY);
        _newEle.css('top',_offsetY > 0 ? _offsetY : 0);
        _newEle.css('left',_offsetX > 0 ? _offsetX : 0);
      };
      var _percentX = 100 * _offsetX / _width;
      var _percentY = 100 * _offsetY / _height;
      updateFormatData(data,$('#'+data).attr('data-tid'),_percentX.toFixed(2),_percentY.toFixed(2));
    };
    var dragend = function(e){
      var _id = e.originalEvent.target.id;
      if(_id.indexOf('on_')==0){
        var $field = $('#formatField');
        var _left = $field.offset().left;
        var _top = $field.offset().top;
        var _right = _left + $field.width();
        var _bottom = _top +$field.height();
        var _nowx = e.originalEvent.pageX;
        var _nowy = e.originalEvent.pageY;
        if (_nowx < _left || _nowx > _right || _nowy > _bottom || _nowy < _top) {
          $(e.originalEvent.target).remove();
          _id = getMemberId(_id);
          $('#'+_id).attr('draggable',true);
          updateFormatData(_id,$('#'+_id).attr('data-tid'),-1);
        };
      }
    };
    var updateFormatData = function(id,tid,percentX,percentY){
      id = getMemberId(id);
      if(percentX===-1){
        delete competition_format[id];
      }
      else{
        competition_format[id] ={
          'x':percentX,
          'y':percentY
        };
      }
      var competition_id = $('#competition_content').attr('data-id');
      $.post('/group/updateFormation/'+tid+'/'+competition_id,{'formation':competition_format},function(data,status){
        if(data.result===0){
          //TODO
          //能不能把这个闭包和AngularJS绑定?
          alertify.alert(data.msg);
          var body = {
            'border': '1px',
            'border-radius': '0px',
            'top' : '50px',
            'left' : '55%',
            'width' : '350px'
        };

        var buttons = {
            'border-top' : '0px',
            'background' : '#fff',
            'text-align' : 'center'
        }

        var button = {
            'margin-left' : '0px',
            'padding' : '6px 15px',
            'box-shadow' : '0px 0px 0px #ffffff',
            'background-color' : '#3498db'
        }

        $(".alertify-buttons").css(buttons);
        $(".alertify").css(body);
        $(".alertify-button").css(button);

        }
      });
    };
    var getMemberId = function(id){
      return (id.indexOf('on_')==0) ? id.substr(3) : id;
    };
    var _conetent = $('#competition_content');
    _conetent.find('.teamMember').bind('dragstart',drag);
    _conetent.find('.teamMember').bind('dragend',dragend);
    _conetent.find('#formatField').bind('drop',drop);
    _conetent.find('#formatField').bind('dragover',allowDrop);
    _conetent.find('.onmemberA').each(function(){
      var _id = $(this).attr('id');
      var _x = $(this).attr('data-left');
      var _y = $(this).attr('data-top');
      _id = getMemberId(_id);
      competition_format[_id] ={
        'x':_x,
        'y':_y
      };
      $(this).css('left',_x+'%');
      $(this).css('top',_y+'%');
      _id = getMemberId(_id);
      $('#'+_id).attr('draggable',false);
      $(this).attr('src',$('#'+_id).attr('src'));
    });
    _conetent.find('.onmemberB').each(function(){
      var _id = $(this).attr('id');
      var _x = $(this).attr('data-left');
      var _y = $(this).attr('data-top');
      $(this).css('left',_x+'%');
      $(this).css('top',_y+'%');
      _id = getMemberId(_id);
      competition_format[_id] ={
        'x':_x,
        'y':_y
      };
      $('#'+_id).attr('draggable',false);
      $(this).attr('src',$('#'+_id).attr('src'));
    });
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

