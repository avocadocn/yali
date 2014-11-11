'use strict';

var campaignApp = angular.module('donler');

campaignApp.controller('campaignController', ['$scope', '$http', 'Campaign', function ($scope, $http, Campaign) {

  var data = document.getElementById('campaign_data').dataset;
  var campaignId = data.id;

  $scope.isStart = data.start === 'true';
  $scope.isEnd = data.end === 'true';
  $scope.isJoin = data.join === 'true';

  $scope.notice = {
    placeholder: '',
    placeholderText: '添加公告，让成员随时了解活动动态！（请控制在140字以内）',
    content: ''
  };
  $scope.notice.placeholder = $scope.notice.placeholderText;
  $scope.publishNotice = function() {
    if ($scope.notice.content === '') return;
    $http({
      method: 'post',
      url: '/message/push/campaign',
      data: {
        campaign_id: campaignId,
        content: $scope.notice.content
      }
    }).success(function(data, status) {
      if (data.msg === 'SUCCESS') {
        window.location.reload();
      }
    }).error(function(data, status) {
      //TODO:更改对话框
      alertify.alert('DATA ERROR');
    });
  };

  $scope.join = function (cid, tid) {
    Campaign.join({
      campaignId: campaignId,
      cid: cid,
      tid: tid
    }, function (err) {
      if (err) {
        alertify.alert(err);
      } else {
        $scope.isJoin = true;
        alertify.alert('参加活动成功', function (e) {
          window.location.reload();
        });
      }
    });
  };

  $scope.quit = function () {
    Campaign.quit(campaignId, function (err) {
      if (err) {
        alertify.alert(err);
      } else {
        $scope.isJoin = false;
        alertify.alert('退出活动成功', function (e) {
          window.location.reload();
        });
      }
    });
  };



  $scope.editing = false;
  $scope.campaignData = {
    content: '',
    member_max: 0,
    member_min: 0
  };

  $scope.save = function () {
    if($scope.campaignData.member_min<=$scope.member_max&&$scope.member_min>=0){
      Campaign.edit(campaignId, $scope.campaignData, function (err) {
        if (err) {
          alertify.alert(err);
        } else {
          alertify.alert('编辑成功', function (e) {
            window.location='/campaign/detail/'+campaignId;
          });
        }
      });
    }else{
      alertify.alert('请正确填写报名人数!');
    }
  };

  $scope.toggleEdit = function () {
    $scope.editing = !$scope.editing;
  };

  $scope.cancel = function () {
    alertify.confirm('活动关闭后，不能再编辑该活动、发表评论、上传照片，并且不能重新打开，确定要关闭该活动吗？', function (e) {
      if (e) {
        Campaign.cancel(campaignId, function (err) {
          if (err) {
            alertify.alert(err);
          } else {
            alertify.alert('关闭活动成功', function (e) {
              window.location.reload();
            });
          }
        });
      }
    });
  };
  $scope.dealProvoke = function(tid, status) {
      switch(status){
        case 1://接受
          var tip = '是否确认接受该挑战?';
          break;
        case 2://拒绝
          var tip = '是否确认拒绝该挑战?';
          break;
        case 3://取消
          var tip = '是否确认取消发起挑战';
          break;
      }
      alertify.confirm(tip,function(e){
        if(e){
          Campaign.dealProvoke(campaignId, tid, status, function (err) {
            if (err) {
              alertify.alert(err);
            } else {
              window.location.reload();
            }
          });
        }
      });
    };
  $('#deadline').datetimepicker({
    autoclose: true,
    language: 'zh-CN',
    startDate: new Date(),
    pickerPosition: "top-left"
  });

  var options = {
    editor: document.getElementById('campaignDetail'), // {DOM Element} [required]
    class: 'dl_markdown', // {String} class of the editor,
    textarea: '<textarea name="content" ng-model="$parent.content"></textarea>', // fallback for old browsers
    list: ['h5', 'p', 'insertorderedlist','insertunorderedlist', 'indent', 'outdent', 'bold', 'italic', 'underline'], // editor menu list
    stay: false,
    toolBarId: 'campaignDetailToolBar'
  };

  var editor = new Pen(options);

  $scope.canUnFold = false;
  var detailModal = $('#campaignDetailModal');
  detailModal.on('shown.bs.modal', function (e) {
    var campaignIntroDom = document.getElementById('campaign_intro');
    if (campaignIntroDom.scrollHeight > 100) {
      $scope.canUnFold = true;
      $scope.$apply();
    }
  });

  $scope.showDetailModal = function () {
    detailModal.modal('show');
  };

  $scope.baseContent = true;
  $scope.toggleFold = function () {
    $scope.baseContent = !$scope.baseContent;
  };



}]);


