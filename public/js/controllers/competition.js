//组件列表控制器
'use strict';


var groupApp = angular.module('mean.main');

groupApp.controller('resultController', ['$http', '$scope','$rootScope',function ($http, $scope,$rootScope) {
    // $scope.$watch('msg_show',function(){
    //   if($scope.msg_show){
    //     $('#resultModel').modal();
    //   }
    // });
    $scope.modify_caption = "成绩确认";


    $scope.score_own = {
      'score':0
    };
    $scope.score_opposite = {
      'score':0
    };
    //异步接受真是太麻烦了,必须嵌套来保持一致性
    $scope.$watch('rst_content',function(rst_content){
      $scope.rst_content = rst_content;
      $scope.$watch('score_a',function(score_a){
        $scope.score_own.score = score_a != 'undefined' ? score_a : 0;
        $scope.$watch('score_b',function(score_b){
          $scope.score_opposite.score = score_b != 'undefined' ? score_b : 0;
          $scope.$watch('msg_show',function(msg_show){
            if(msg_show=='true'){
              $scope.modify_caption = "发出异议";
            }
          });
        });
      });
    });

    // $scope.msg_show = $('#competition_data').attr('data-msg-show');
    // $scope.rst_content = $('#competition_data').attr('data-rst-content');
    // $scope.score_a = $('#competition_data').attr('data-score-a');
    // $scope.score_b = $('#competition_data').attr('data-score-b');

    //alert($scope.msg_show);
    var competition_id = $('#competition_content').attr('data-id');

    $scope.scoreModify = function(){
      if(!$scope.edit){
        $scope.edit = true;
        $scope.modify_caption = "发送";
      }else{
        $scope.modify_caption = "修改比分";
        $scope.confirmScore(false);
      }
    }
    $scope.confirmScore = function (confirm) {
      try {
        $http({
          method: 'post',
          url: '/competition/resultConfirm/'+competition_id,
          data:{
            score_a : $scope.score_own.score,
            score_b : $scope.score_opposite.score,
            rst_content: 'null',
            rst_accept : confirm
          }
        }).success(function(data, status) {
          window.location.reload();
        }).error(function(data, status) {
            $rootScope.donlerAlert($rootScope.lang_for_msg[$rootScope.lang_key].value.DATA_ERROR);
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
    };


    var drop =function(e){
      e.originalEvent.preventDefault();
      var competition_team = $('#competition_content').attr('data-nowteam');
      var data=e.originalEvent.dataTransfer.getData("member_id");
      var _newEle ={};
      var _x = $(e.originalEvent.target).offset().left;
      var _y = $(e.originalEvent.target).offset().top;
      var _width = $(e.originalEvent.target).width();
      var _height = $(e.originalEvent.target).height();
      var _offsetX = e.originalEvent.pageX - _x - 10;
      var _offsetY = e.originalEvent.pageY - _y -10;
      if(competition_team=='A'&&_offsetX > _width / 2||competition_team=='B'&&_offsetX < _width / 2){
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
        _newEle.css('top',_offsetY > 0 ? _offsetY : 0);
        _newEle.css('left',_offsetX > 0 ? _offsetX : 0);
      };
      var _percentX = 100 * _offsetX / _width;
      var _percentY = 100 * _offsetY / _height;
      updateFormatData(data,_percentX.toFixed(2),_percentY.toFixed(2));
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
        };
      }
    };
    var updateFormatData = function(id,percentX,percentY){
      id = getMemberId(id);
      competition_format[id] ={
        'x':percentX,
        'y':percentY
      };
      var competition_team = $('#competition_content').attr('data-nowteam');
      var competition_id = $('#competition_content').attr('data-id');
      $.post('/group/updateFormation/'+competition_id,{'formation':competition_format,'competition_team':competition_team},function(data,status){
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
    // 百度地图API功能
    var map = new BMap.Map("location");            // 创建Map实例
    var _address = competition_location['address']?competition_location['address'] :'';
    var _locationName = competition_location['name'];
    var _longitude = competition_location['coordinates'][0]?competition_location['coordinates'][0]:116.404 ;
    var _latitude = competition_location['coordinates'][1]?competition_location['coordinates'][1]:39.915;
    var point = new BMap.Point(_longitude, _latitude);    // 创建点坐标
    map.centerAndZoom(point,15);                     // 初始化地图,设置中心点坐标和地图级别。
    map.enableScrollWheelZoom();
    map.addControl(new BMap.NavigationControl({anchor: BMAP_ANCHOR_BOTTOM_RIGHT, type: BMAP_NAVIGATION_CONTROL_ZOOM}));
    var marker = new BMap.Marker(point);  // 创建标注
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
  });
}(window));

