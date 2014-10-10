'use strict';

angular.module('donler')

.controller('PhotoDetailCtrl', ['$scope','$http','Comment', 'Report', function($scope,$http,Comment, Report) {
  $('.js_ajax_form').ajaxForm(function(data, status) {
    if (status === 'success') {
      window.location.reload();
    }
  });
  var deleteForm = $('#delete_form');
  deleteForm.ajaxForm(function(data, status) {
    var return_url = $('#return_url').val();
    window.location.href = return_url;
  });
  $('#delete_button').click(function() {
    alertify.set({
      buttonFocus: "none",
      labels: {
        ok: '确认删除',
        cancel: '取消'
      }
    });
    alertify.confirm('删除后不可恢复，您确定要删除该照片吗？', function(e) {
      if (e) {
        deleteForm.submit();
      }
    });
  });

  var page_size = 20;
  $scope.comments=[];
  $scope.pages = [];
  $scope.now_page = 0;
  $scope.$watch('photo_id',function(photoId){
    if(photoId==null){
        return;
    }
    Comment.get('photo', photoId, function (err, comments, has_next) {
      if (err) {
        alertify.alert('获取评论失败，请刷新页面重试');
      } else {
        if(comments.length > 0){
          $scope.comments = comments;
          var page = {
            has_next: has_next
          };
          if (has_next === true) {
            page.next_create_date = comments[comments.length - 1].create_date;
          }
          $scope.pages.push(page);
        }
      }
    });
  });

  $scope.nextPage = function () {
    Comment.get('photo', $scope.photo_id, function (err, comments, has_next) {
      if (err) {
        alertify.alert('获取评论失败，请刷新页面重试');
      } else {
        $scope.comments = comments;
        $scope.now_page++;
        if (!$scope.pages[$scope.now_page]) {
          var page = {
            has_next: has_next
          };
          page.this_create_date = $scope.pages[$scope.now_page - 1].next_create_date;
          if (has_next === true) {
            page.next_create_date = comments[comments.length - 1].create_date;
          }
          $scope.pages.push(page);
        }
      }
    }, $scope.pages[$scope.now_page].next_create_date);
  };

  $scope.lastPage = function () {
    Comment.get('photo', $scope.photo_id, function (err, comments) {
      if (err) {
        alertify.alert('获取评论失败，请刷新页面重试');
      } else {
        $scope.comments = comments;
        $scope.now_page--;
      }
    }, $scope.pages[$scope.now_page - 1].this_create_date);
  };

  $scope.changePage = function (index) {
    Comment.get('photo', $scope.photo_id, function (err, comments) {
      if (err) {
        alertify.alert('获取评论失败，请刷新页面重试');
      } else {
        $scope.comments = comments;
        $scope.now_page = index;
      }
    }, $scope.pages[index].this_create_date);
  };

  $scope.deleteComment = function(index){
    alertify.confirm('确认要删除该评论吗？',function(e){
      if(e){
        try {
          $http({
            method: 'post',
            url: '/comment/delete/delete/'+$scope.comments[index]._id,
            data:{
              comment_id : $scope.comments[index]._id
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
    });
  };
  $scope.getReport = function(index){
      $scope.reportContent = {
          hostType: 'comment',
          hostContent:{
              _id:$scope.comments[index]._id,
              content:$scope.comments[index].content,
              poster:$scope.comments[index].poster
          },
          reportType:''
      }
      $('#reportModal').modal('show');
  }
  $scope.pushReport = function(){
      Report.publish($scope.reportContent,function(err,msg){
          alertify.alert(msg);
      });
  }
}]);