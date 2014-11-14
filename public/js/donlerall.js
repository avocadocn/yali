'use strict';

angular.module('donler.components.campaignCard', [])

  .controller('CampaignCardCtrl', ['$scope', 'Campaign', function ($scope, Campaign) {
    this.join = function (cid, tid, item) {
      Campaign.join({
        campaignId: item.id,
        cid: cid,
        tid: tid
      }, function (err) {
        if (err) {
          alertify.alert('参加失败');
        } else {
          alertify.alert('参加成功');
          item.isJoin = true;
        }
      });
    };

    this.quit = function (item) {
      alertify.confirm('确定要退出该活动吗？', function (e) {
        if (e) {
          Campaign.quit(item.id, function (err) {
            if (err) {
              alertify.alert('退出失败');
            } else {
              alertify.alert('退出成功');
              item.isJoin = false;
            }
          });
        }
      });
    };

  }])
  // .directive("campaignCardContainer", function () {
  //   return {
  //     restrict: "A",
  //     scope: true,
  //     controller: function ($scope) {
  //       $scope.nowComment ='';
  //       this.changeShowComment = function(nowId) {
  //         $scope.nowComment =nowId;
  //         console.log(nowId);
  //       };
  //       this.setShowComment = function(){
  //         return $scope.nowComment;
  //       }
  //     }
  //   };
  // })
  .directive('campaignCard', function () {

    return {
      restrict: 'E',
      replace: true,
      // require: "^campaignCardContainer",
      scope: {
        item: '=',
        role:'@',
        cid: '@',
        tid: '@'
      },
      templateUrl: '/components/campaignCard/template',
      controller: 'CampaignCardCtrl',
      link: function (scope, ele, attrs, ctrl) {
        scope.join = function (cid, tid) {
          ctrl.join(cid, tid, scope.item);
        };
        scope.quit = function () {
          ctrl.quit(scope.item);
        };
      }
    };

  })
'use strict';

angular.module('donler.components', ['donler.components.richComment', 'donler.components.scoreBoard', 'donler.components.imageBox', 'donler.components.campaignCard']);
'use strict';

angular.module('donler.components.imageBox', [])

  .controller('ImageBoxCtrl', ['$scope', function ($scope) {
    $scope.thumbBoxInnerStyle = {};
    this.maxScrollWidth = 0;
    this.maxShowThumbCount = 0; // 下方缩略图最多可展示的数目
    this.thumbWidth = 60;
    var self = this;

    $scope.canPrev = false;
    $scope.canNext = false;

    $scope.setMargin = function (index) {
      var correctIndex = 0;
      if ($scope.images.length > self.maxShowThumbCount) {
        correctIndex = index - parseInt((self.maxShowThumbCount - 1) / 2);
      }
      if (correctIndex < 0) {
        correctIndex = 0;
      }
      var marginWidth = self.thumbWidth * correctIndex;
      if (self.maxScrollWidth > 0) {
        if (marginWidth > self.maxScrollWidth) {
          marginWidth = self.maxScrollWidth;
        }
        var margin = (0 - marginWidth) + 'px';
        $scope.thumbBoxInnerStyle = {
          'margin-left': margin
        };
      }

      if (marginWidth === 0) {
        $scope.canPrev = false;
      } else {
        $scope.canPrev = true;
      }

      if (marginWidth >= self.maxScrollWidth) {
        $scope.canNext = false;
      } else {
        $scope.canNext = true;
      }

    };

  }])

  .directive('imageBox', function () {

    return {
      restrict: 'E',
      replace: true,
      scope: {
        images: '='
      },
      templateUrl: '/components/ImageBox/template',
      controller: 'ImageBoxCtrl',
      link: function (scope, ele, attrs, ctrl) {
        var images = scope.images;
        if (images.length > 0) {
          scope.isPreview = false;
          scope.prevIndex = 0;
          scope.thisIndex = 0;
          scope.nextIndex = 0;
          var pageIndex = 0;

          var setIndex = function (index) {
            if (index <= 0) {
              scope.prevIndex = 0;
              scope.nextIndex = Math.min(index + 1, images.length - 1);
              scope.thisIndex = 0;
            } else if (index >= images.length - 1) {
              scope.prevIndex = Math.max(index - 1, 0);
              scope.nextIndex = images.length - 1;
              scope.thisIndex = images.length - 1;
            } else {
              scope.prevIndex = index - 1;
              scope.nextIndex = index + 1;
              scope.thisIndex = index;
            }
            pageIndex = scope.thisIndex;
            scope.previewImg = images[scope.thisIndex].uri;
            scope.setMargin(scope.thisIndex);

          };

          scope.choose = function (index) {
            setIndex(index);
          }

          scope.preview = function (index) {
            setIndex(index);
            scope.isPreview = true;
          };

          scope.prev = function () {
            setIndex(scope.thisIndex - 1);
          };

          scope.next = function () {
            setIndex(scope.thisIndex + 1);
          }

          scope.close = function () {
            scope.isPreview = false;
          };

          scope.prevList = function () {
            if (scope.canPrev) {
              pageIndex -= ctrl.maxShowThumbCount;
              scope.setMargin(pageIndex);
            }
          };

          scope.nextList = function () {
            if (scope.canNext) {
              pageIndex += ctrl.maxShowThumbCount;
              scope.setMargin(pageIndex);
            }
          };


        }

      }
    };

  })

  .directive('calWidth', function () {
    return {
      require: '^imageBox',
      restrict: 'A',
      link: function (scope, ele, attrs, ctrl) {
        // 最大滚动宽度，可能为负值，表示允许向左滚动的最大值
        var maxScrollWidth = ctrl.thumbWidth * scope.images.length - ele.width();

        // 校正最大滚动宽度为缩略图的整数倍
        if (maxScrollWidth > 0) {
          var count = parseInt(maxScrollWidth / ctrl.thumbWidth);
          var remainder = maxScrollWidth % ctrl.thumbWidth;
          if (remainder != 0) {
            maxScrollWidth = ctrl.thumbWidth * (count + 1);
          }
        }
        ctrl.maxScrollWidth = maxScrollWidth;
        ctrl.maxShowThumbCount = parseInt(ele.width() / ctrl.thumbWidth);
      }
    };
  })

  .directive('needScroll', function () {
    return {
      require: '^imageBox',
      restrict: 'A',
      link: function (scope, ele, attrs, ctrl) {
        var lastHeight = 0;
        scope.$watch('previewImg', function (newVal, oldVal) {
          if(newVal){
            var img = new Image();
            img.src = newVal;
            img.onload = function () {
              if (this.height > document.body.clientHeight || lastHeight > document.body.clientHeight) {
                window.scrollTo(0, ele[0].offsetTop);
              }
              lastHeight = this.height;
            }
          }

        })
      }
    };
  })



'use strict';

angular.module('donler.components.richComment', ['angularFileUpload'])

  .controller('RichCommentCtrl', ['$scope', '$http', '$element','$timeout', 'Comment', 'Report', 'FileUploader',
    function ($scope, $http, $element, $timeout, Comment, Report, FileUploader) {
      $scope.pages = [];
      $scope.nowPage = 0;
      $scope.showMoreComment = false;
      var CommentBox = function (args) {

        Object.defineProperty(this, 'photo_album_id', {
          set: function (value) {
            this.uploader.url = '/photoAlbum/' + value + '/photo/single';
          }
        });

        if (args) {
          this.host_type = args.host_type;
          this.host_id = args.host_id;
          this.photo_album_id = args.photo_album_id;
        }

        var uploader = new FileUploader({
          url: this.photo_album_id ? '/photoAlbum/' + this.photo_album_id + '/photo/single' : null
        });

        uploader.filters.push({
          name: 'imageFilter',
          fn: function(item, options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
          }
        });
        uploader.onAfterAddingAll = function(){
          if($scope.afterRender){
            $timeout(function () {
              $scope.afterRender();
            });
          }
        };
        this.uploader = uploader;
      };

      CommentBox.prototype.publish = function (content, callback) {
        if (!content && content === '') return;
        var self = this;
        if (self.uploader.getNotUploadedItems().length > 0) {
          if (!this.uploader.url || this.uploader.url === '') return;
          self.uploader.uploadAll();
          self.uploader.onSuccessItem = function (item, data, status, headers) {
            if($scope.afterRender){
              $timeout(function () {
                $scope.afterRender();
              });
            }
          };
          self.uploader.onCompleteAll = function () {
            Comment.publish({
              host_id: self.host_id,
              host_type: self.host_type,
              content: content
            }, function (err, comment) {
              self.uploader.clearQueue();
              callback(err, comment);
            });
          };
        } else {
          Comment.publish({
            host_id: self.host_id,
            host_type: self.host_type,
            content: content
          }, function (err, comment) {
            self.uploader.clearQueue();
            callback(err, comment);
          });
        }

      };

      var cbox = new CommentBox();
      $scope.uploader = cbox.uploader;


      $scope.publish = function (content, form) {
        cbox.publish(content, function (err, comment) {
          if (err) {
            console.log(err);
          } else {
            $scope.comments.unshift({
              '_id':comment._id,
              'host_id' : comment.host_id,
              'content' : comment.content,
              'create_date' : comment.create_date,
              'poster' : comment.poster,
              'photos': comment.photos,
              'host_type' : comment.host_type,
              'delete_permission':true
            });
            $scope.new_comment.text = '';
            form.$setPristine();
            if($scope.afterRender){
              $timeout(function () {
                $scope.afterRender();
              });
            }
          }

        });
      };
      if($scope.componentId){
        $http.get('/components/RichComment/id/' + $scope.componentId)
        .success(function (data) {
          if (data.result === 1) {
            cbox.host_type = data.componentData.hostType;
            cbox.host_id = data.componentData.hostId;
            cbox.photo_album_id = data.componentData.photoAlbumId;
            $scope.photoAlbumId = data.componentData.photoAlbumId;

            Comment.get('campaign', cbox.host_id, function (err, comments, nextStartDate) {
              if (err) {
                alertify.alert('获取评论失败，请刷新页面重试');
              } else {
                $scope.comments = comments;
                if (!$scope.pages[$scope.nowPage]) {
                  var page = {
                    nextStartDate: nextStartDate
                  };
                  if ($scope.comments[0]) {
                    page.thisStartDate = $scope.comments[0].create_date;
                  }
                  $scope.pages.push(page);
                }
                if($scope.afterRender){
                  $timeout(function () {
                    $scope.afterRender();
                  });
                }
              }
            });
          }
        })
        .error(function (data, status) {
          alertify.alert('获取评论失败，请刷新页面重试');
        });
      }


      $scope.new_comment = {
        text: ''
      };


      var getReplies = function (comment) {
        Comment.getReplies(comment._id, function (err, replies) {
          comment.replies = replies;
          comment.reply_count = replies.length;
        });
      };


      $scope.last_reply_comment;
      $scope.toggleComment = function (comment) {
        if ($scope.last_reply_comment && $scope.last_reply_comment != comment) {
          $scope.last_reply_comment.replying = false;
        }
        comment.replying = !comment.replying;
        $scope.last_reply_comment = comment;
        if (comment.replying) {
          getReplies(comment);
          $scope.now_reply_to = {
            _id: comment.poster._id,
            nickname: comment.poster.nickname
          };
          if($scope.afterRender){
            $timeout(function () {
              $scope.afterRender();
            });
          }
        }
      };

      $scope.setReplyTo = function (comment, to, nickname) {
        if ($scope.last_reply_comment != comment) {
          $scope.last_reply_comment.replying = false;
          $scope.last_reply_comment = comment;
        }
        if (!comment.replying) {
          comment.replying = true;
        }
        $scope.now_reply_to = {
          _id: to,
          nickname: nickname
        };
      };
      $scope.reply = function (comment, form) {
        if (!comment.new_reply || comment.new_reply === '') return;
        Comment.reply(comment._id, $scope.now_reply_to._id, comment.new_reply, function (err, reply) {
          if (err) {
            // TO DO
          } else {
            if (!comment.replies) {
              comment.replies = [];
            }
            comment.replies.push(reply);
            comment.reply_count++;
            comment.new_reply = "";
            form.$setPristine();
            if($scope.afterRender){
              $timeout(function () {
                $scope.afterRender();
              });
            }
          }
        });
      };


      $scope.deleteComment = function (index) {
        alertify.confirm('确认要删除该评论吗？',function (e) {
          if(e){
            try {
              Comment.remove($scope.comments[index]._id, function (err) {
                if (err) {
                  alertify.alert('删除失败，请重试。');
                } else {
                  $scope.comments.splice(index,1);
                  if($scope.afterRender){
                    $timeout(function () {
                      $scope.afterRender();
                    });
                  }
                }
              });
            }
            catch(e) {
              console.log(e);
            }
          }
        });
      };

      $scope.removeReply = function (comment, index) {
        alertify.confirm('确认要删除该回复吗？', function (e) {
          if (e) {
            var reply = comment.replies[index];
            Comment.remove(reply._id, function (err) {
              if (err) {
                alertify.alert('删除失败，请重试。');
              } else {
                comment.replies.splice(index, 1);
                comment.reply_count--;
                if($scope.afterRender){
                  $timeout(function () {
                    $scope.afterRender();
                  });
                }
              }
            });
          }
        });
      };


      $scope.getReport = function(comment) {
        $scope.reportContent = {
          hostType: 'comment',
          hostContent: {
            _id: comment._id,
            content: comment.content,
            poster: comment.poster
          },
          reportType: ''
        }
        $('#reportModal').modal('show');
      }

      $scope.pushReport = function() {
        Report.publish($scope.reportContent, function(err, msg) {
          alertify.alert(msg);
        });
      };


      $scope.nextPage = function () {
        Comment.get('campaign', cbox.host_id, function (err, comments, nextStartDate) {
          if (err) {
            alertify.alert('获取评论失败，请刷新页面重试');
          } else {
            $scope.comments = comments;
            $scope.nowPage++;
            if (!$scope.pages[$scope.nowPage]) {
              var page = {
                thisStartDate: $scope.pages[$scope.nowPage - 1].nextStartDate,
                nextStartDate: nextStartDate
              };
              $scope.pages.push(page);
            }
          }
        }, $scope.pages[$scope.nowPage].nextStartDate);
      };

      $scope.lastPage = function () {
        Comment.get('campaign', cbox.host_id, function (err, comments) {
          if (err) {
            alertify.alert('获取评论失败，请刷新页面重试');
          } else {
            $scope.comments = comments;
            $scope.nowPage--;
          }
        }, $scope.pages[$scope.nowPage - 1].thisStartDate);
      };

      $scope.changePage = function (index) {
        Comment.get('campaign', cbox.host_id, function (err, comments) {
          if (err) {
            alertify.alert('获取评论失败，请刷新页面重试');
          } else {
            $scope.comments = comments;
            $scope.nowPage = index;
          }
        }, $scope.pages[index].thisStartDate);
      };

      $scope.showMore = function () {
        $scope.showMoreComment = true;
        if ($scope.afterRender) {
          $timeout(function () {
            $scope.afterRender();
          });
        }
      };

      $scope.originPlaceholder = '输入内容请控制在140字以内';
      $scope.currentPlaceholder = {
        comment: $scope.originPlaceholder,
        reply: $scope.originPlaceholder
      };

    }])

  .directive('simpleComment', function () {
    return {
      restrict: 'E',
      replace: true,
      controller: 'RichCommentCtrl',
      scope: {
        componentId: '@',
        photoAlbumId: '@',
        allowPublish: '@',
        commentNum:'@',
        afterRender:'&'
      },
      templateUrl: '/components/SimpleComment/template'
    }
  })

  .directive('richComment', function () {
    return {
      restrict: 'E',
      replace: true,
      controller: 'RichCommentCtrl',
      scope: {
        componentId: '@',
        photoAlbumId: '@',
        allowPublish: '@'
      },
      templateUrl: '/components/RichComment/template'
    }
  });




'use strict';

angular.module('donler.components.scoreBoard', [])

  .controller('ScoreBoardCtrl', ['$scope', 'ScoreBoard', function ($scope, ScoreBoard) {

    /**
     * 对于有编辑权限的用户的状态，可以是以下的值
     * 'init' 初始状态，双发都没有设置比分
     * 'waitConfirm' 等待对方确认
     * 'toConfirm' 对方已设置比分，需要我方确认
     * 'confirm' 双方已确认
     * @type {String}
     */
    $scope.leaderStatus = 'init';

    /**
     * 是否可以编辑比分板，确认后将无法编辑
     * @type {Boolean}
     */
    $scope.allowEdit = false;

    /**
     * 是否可以查看日志
     * @type {Boolean}
     */
    $scope.allowManage = false;

    var getScoreBoardData = function () {
      ScoreBoard.getData($scope.componentId, function (err, scoreBoardData) {
        if (err) {
          // todo 这不是一个好的做法，alertify并非是此模块的依赖项
          alertify.alert(err);
        } else {
          $scope.scoreBoard = scoreBoardData;
          if ($scope.scoreBoard.effective) {
            $scope.scores = [];
            $scope.results = [];
            for (var i = 0; i < $scope.scoreBoard.playingTeams.length; i++) {
              var playingTeam = $scope.scoreBoard.playingTeams[i];
              $scope.scores.push(playingTeam.score);
              $scope.results.push(playingTeam.result);
              if ($scope.scoreBoard.status === 1) {
                if (playingTeam.allowManage) {
                  $scope.allowEdit = true;
                  if (playingTeam.confirm) {
                    $scope.leaderStatus = 'waitConfirm';
                  } else {
                    $scope.leaderStatus = 'toConfirm';
                  }
                }
              } else if ($scope.scoreBoard.status === 0) {
                if (playingTeam.allowManage) {
                  $scope.allowEdit = true;
                }
              }

              if (playingTeam.allowManage) {
                $scope.allowManage = true;
              }
            }
          }
        }
      });
    };
    getScoreBoardData();

    $scope.editing = false;

    /**
     * 设置胜负结果
     * @param {Number} result -1, 0, 1
     * @param {Number} index  0或1, $scope.results的索引
     */
    $scope.setResult = function (result, index) {
      if (index === 0) {
        // 两队胜负值的和为0
        $scope.results[0] = result;
        $scope.results[1] = 0 - result;
      } else if (index === 1) {
        $scope.results[0] = 0 - result;
        $scope.results[1] = result;
      }
    };

    $scope.toggleEdit = function () {
      $scope.editing = !$scope.editing;
    };

    var finishEdit = function () {
      $scope.editing = false;
      $scope.scoreBoard.status === 1;
      $scope.leaderStatus = 'waitConfirm';
      for (var i = 0; i < $scope.scoreBoard.playingTeams.length; i++) {
        var playingTeam = $scope.scoreBoard.playingTeams[i];
        playingTeam.score = $scope.scores[i];
        playingTeam.result = $scope.results[i];
      }
    };

    $scope.initScore = function () {
      ScoreBoard.initScore($scope.componentId, {
        scores: $scope.scores,
        results: $scope.results
      }, function (err) {
        if (err) {
          alertify.alert(err);
        } else {
          finishEdit();
        }
      })
    };

    $scope.resetScore = function () {
      ScoreBoard.resetScore($scope.componentId, {
        scores: $scope.scores,
        results: $scope.results
      }, function (err) {
        if (err) {
          alertify.alert(err);
        } else {
          finishEdit();
        }
      })
    };

    $scope.confirmScore = function () {
      var remindMsg = '提示：同意后将无法修改，确定要同意吗？';
      alertify.confirm(remindMsg, function (e) {
        if (e) {
          ScoreBoard.confirmScore($scope.componentId, function (err) {
            if (err) {
              alertify.alert(err);
            } else {
              $scope.scoreBoard.allConfirm = true;
              $scope.leaderStatus = 'confirm';
              $scope.scoreBoard.status = 2;
            }
          });
        }
      });
    };

    $scope.showLogs = false;
    $scope.toggleLogs = function () {
      if (!$scope.showLogs) {
        ScoreBoard.getLogs($scope.componentId, function (err, logs) {
          if (err) {
            alertify.alert(err);
          } else {
            $scope.logs = logs;
            $scope.showLogs = true;
          }
        });
      } else {
        $scope.showLogs = false;
      }
    };

  }])

  .factory('ScoreBoard', ['$http', function ($http) {

    /**
     * 设置比分
     * @param id 组件id
     * @param data 比分数据
     *  data: {
     *    scores: [Number], // 可选
     *    results: [Number], // 可选
     *    // scores,results属性至少要有一个
     *  }
     * @param {Boolean} isInit 是否是初始化设置
     * @param callback callback(err)
     */
    var setScore = function (id, data, isInit, callback) {
      $http.post('/components/ScoreBoard/id/' + id + '/setScore', {
        data: data,
        isInit: isInit
      })
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('设置失败');
        });
    };

    return {

      /**
       * 获取比分组件的数据
       * @param id 组件id
       * @param callback 成功或失败后的回调函数，形式为callback(err, componentData)
       */
      getData: function (id, callback) {
        $http.get('/components/ScoreBoard/id/' + id)
          .success(function (data) {
            if (data.result === 1) {
              callback(null, data.componentData);
            } else {
              callback('获取比分失败，请刷新页面重试');
            }
          })
          .error(function (data, status) {
            callback('获取比分失败，请刷新页面重试');
          });
      },

      // 初始化比分
      initScore: function (id, data, callback) {
        setScore(id, data, true, callback);
      },

      // 重设比分
      resetScore: function (id, data, callback) {
        setScore(id, data, false, callback);
      },

      /**
       * 确认比分
       * @param {String} id 组件id
       * @param callback callback(err)
       */
      confirmScore: function (id, callback) {
        $http.post('/components/ScoreBoard/id/' + id + '/confirmScore')
          .success(function (data, status) {
            if (data.result === 1) {
              callback();
            } else {
              callback(data.msg);
            }
          })
          .error(function (data, status) {
            callback('操作失败，请重试。');
          });
      },

      /**
       * 获取日志
       * @param {String} id 组件id
       * @param  {Function} callback callback(err, logs)
       */
      getLogs: function (id, callback) {
        $http.get('/components/ScoreBoard/id/' + id + '/getLogs')
          .success(function (data, status) {
            if (data.result === 1) {
              callback(null, data.logs);
            } else {
              callback(data.msg);
            }
          })
          .error(function (data, status) {
            callback('获取记录失败，请重试。');
          });
      }

    };
  }])

  .directive('scoreBoard', function () {
    return {
      restrict: 'E',
      replace: true,
      controller: 'ScoreBoardCtrl',
      templateUrl: '/components/ScoreBoard/template',
      scope: {
        componentId: '@'
      }
    }
  })
'use strict';

angular.module('donler', ['ngRoute','ui.bootstrap','pascalprecht.translate','wu.masonry', 'angular-carousel', 'donler.components']);


var app = angular.module('donler');

app.directive('match', function ($parse) {
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl) {
      scope.$watch(function() {
        return $parse(attrs.match)(scope) === ctrl.$modelValue;
      }, function(currentValue) {
        ctrl.$setValidity('mismatch', currentValue);
      });
    }
  };
});
app.directive('ngMin', function() {
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

app.directive('ngMax', function() {
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
//弹出信息卡片的控制器
app.directive('bsPopover',function() {
  return{
    controller:['$http','$scope',function($http, $scope){
      $scope.showUserCard = function(member_id,pop_id) {
        if($scope.member_id===member_id)
          $('#pop'+pop_id).dl_card({content:$scope.htmlcontent});
        else{
          $scope.member_id = member_id;
          $http.get('/users/briefInfo/'+member_id).success(function(data, status){
            $scope.htmlcontent=data;
            $('#pop'+pop_id).dl_card({content:data});
          });
        }
      };
      $scope.showGroupCard = function(group_id,pop_id) {
        if($scope.group_id===group_id)
          $('#pop'+pop_id).dl_card({content:$scope.htmlcontent});
        else{
          $scope.group_id = group_id;
          $http.get('/group/briefInfo/'+group_id).success(function(data, status){
            $('#pop'+pop_id).dl_card({content:data});
            $scope.htmlcontent = data;
          });
        }
      };
    }],
  };
});
app.directive('contenteditable',function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attr, ngModel) {
      var read;
      if (!ngModel) {
        return;
      }
      ngModel.$render = function() {
        return element.html(ngModel.$viewValue);
      };
      var changeBind = function(e){
        var htmlContent = $.trim(element.html());
        if (ngModel.$viewValue !== htmlContent ) {
          if(htmlContent.replace(/<\/?[^>]*>/g, '').replace(/[\u4e00-\u9fa5]/g, '**').length>attr.mixMaxlength){
            ngModel.$setValidity('mixlength', false);
          }
          else{
            ngModel.$setValidity('mixlength', true);
          }
          return scope.$apply(read);
        }
      }
      var clearStyle = function(e){
        var before = e.currentTarget.innerHTML;
        setTimeout(function(){
            // get content after paste by a 100ms delay
            var after = e.currentTarget.innerHTML;
            // find the start and end position where the two differ
            var pos1 = -1;
            var pos2 = -1;
            for (var i=0; i<after.length; i++) {
                if (pos1 == -1 && before.substr(i, 1) != after.substr(i, 1)) pos1 = i;
                if (pos2 == -1 && before.substr(before.length-i-1, 1) != after.substr(after.length-i-1, 1)) pos2 = i;
            }
            // the difference = pasted string with HTML:
            var pasted = after.substr(pos1, after.length-pos2-pos1);
            // strip the tags:
            var replace = pasted.replace(/style\s*=(['\"\s]?)[^'\"]*?\1/gi,'').replace(/class\s*=(['\"\s]?)[^'\"]*?\1/gi,'');
            // build clean content:
            var replaced = after.substr(0, pos1)+replace+after.substr(pos1+pasted.length);
            // replace the HTML mess with the plain content
            //console.log(replaced);
            e.currentTarget.innerHTML = replaced;
        }, 100);
      }
      element.bind('focus', function() {
        element.bind('keydown',changeBind);
        element.bind('paste', clearStyle);
      });
      element.bind('blur', function(e) {
        element.unbind('keydown',changeBind);
         element.unbind('paste', clearStyle);
        changeBind(e);
      });
      return read = function() {
        return ngModel.$setViewValue($.trim(element.html()));
      };
    }
  };
});
app.directive('mixMaxlength', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, ele, attrs, ctrl) {
            var length = parseInt(attrs['mixMaxlength']) || 10;
            scope.$watch(attrs.ngModel, function(newValue, oldValue) {
                if (newValue && newValue.replace(/[\u4e00-\u9fa5]/g, '**').length > length) {
                    ctrl.$setValidity('mixlength', false);
                } else {
                    ctrl.$setValidity('mixlength', true);
                }
            })
        }
    }
});
app.directive('bootstrapTagsinput', [function() {

  function getItemProperty(scope, property) {
    if (!property)
      return undefined;

    if (angular.isFunction(scope.$parent[property]))
      return scope.$parent[property];

    return function(item) {
      return item[property];
    };
  }

  return {
    restrict: 'EA',
    scope: {
      model: '=ngModel'
    },
    template: '<select multiple></select>',
    replace: false,
    link: function(scope, element, attrs) {
      $(function() {
        if (!angular.isArray(scope.model))
          scope.model = [];

        var select = $('select', element);
        var typeaheadSourceArray = attrs.typeaheadSource ? attrs.typeaheadSource.split('.') : null;
        var typeaheadSource = typeaheadSourceArray ?
            (typeaheadSourceArray.length > 1 ?
                scope.$parent[typeaheadSourceArray[0]][typeaheadSourceArray[1]]
                : scope.$parent[typeaheadSourceArray[0]])
            : null;

        select.tagsinput(scope.$parent[attrs.options || ''] || {
          typeahead : {
            source   : angular.isFunction(typeaheadSource) ? typeaheadSource : null
          },
          itemValue: getItemProperty(scope, attrs.itemvalue),
          itemText : getItemProperty(scope, attrs.itemtext),
          confirmKeys : getItemProperty(scope, attrs.confirmkeys) ? JSON.parse(attrs.confirmkeys) : [13],
          tagClass : angular.isFunction(scope.$parent[attrs.tagclass]) ? scope.$parent[attrs.tagclass] : function(item) { return attrs.tagclass; }
        });

        for (var i = 0; i < scope.model.length; i++) {
          select.tagsinput('add', scope.model[i]);
        }

        select.on('itemAdded', function(event) {
          if (scope.model.indexOf(event.item) === -1)
            scope.model.push(event.item);
        });

        select.on('itemRemoved', function(event) {
          var idx = scope.model.indexOf(event.item);
          if (idx !== -1)
            scope.model.splice(idx, 1);
        });

        // create a shallow copy of model's current state, needed to determine
        // diff when model changes
        var prev = scope.model.slice();
        scope.$watch("model", function() {
          var added = scope.model.filter(function(i) {return prev.indexOf(i) === -1;}),
              removed = prev.filter(function(i) {return scope.model.indexOf(i) === -1;}),
              i;

          prev = scope.model.slice();

          // Remove tags no longer in binded model
          for (i = 0; i < removed.length; i++) {
            select.tagsinput('remove', removed[i]);
          }

          // Refresh remaining tags
          select.tagsinput('refresh');

          // Add new items in model as tags
          for (i = 0; i < added.length; i++) {
            select.tagsinput('add', added[i]);
          }
        }, true);
      });
    }
  };
}]);

app.directive('ngThumb', ['$window',
  function($window) {
    var helper = {
      support: !!($window.FileReader && $window.CanvasRenderingContext2D),
      isFile: function(item) {
        return angular.isObject(item) && item instanceof $window.File;
      },
      isImage: function(file) {
        var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    };

    return {
      restrict: 'A',
      template: '<canvas/>',
      link: function(scope, element, attributes) {
        if (!helper.support) return;

        var params = scope.$eval(attributes.ngThumb);

        if (!helper.isFile(params.file)) return;
        if (!helper.isImage(params.file)) return;

        var canvas = element.find('canvas');
        var reader = new FileReader();

        reader.onload = onLoadFile;
        reader.readAsDataURL(params.file);

        function onLoadFile(event) {
          var img = new Image();
          img.onload = onLoadImage;
          img.src = event.target.result;
        }

        function onLoadImage() {
          var width = params.width || this.width / this.height * params.height;
          var height = params.height || this.height / this.width * params.width;
          canvas.attr({
            width: width,
            height: height
          });
          canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
        }
      }
    };
  }
]);

app.run(['$rootScope', function ($rootScope) {
    alertify.set({
      buttonFocus: "none",
      labels: {
        ok: '确认',
        cancel: '取消'
      }
    });
    $rootScope.shortTrim = function(value){
      //中文
      if(escape(value).indexOf("%u")>=0){
        if(value.length>6){
          return value.substr(0,6)+'...';
        }else{
          return value;
        }
      //非中文
      }else{
        if(value.length>15){
          return value.substr(0,15)+'...';
        }else{
          return value;
        }
      }
    }
}]);

app.filter('dateView', function() {
  return function(input) {
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    var date = new Date(input);
    var intervalMilli = date.getTime() - today.getTime();
    var xcts = Math.floor(intervalMilli / (24 * 60 * 60 * 1000));
    var nowTime = (date.getHours()<10?('0'+date.getHours()):date.getHours())+':'+(date.getMinutes()<10?('0'+date.getMinutes()):date.getMinutes());
    // -2:前天 -1：昨天 0：今天 1：明天 2：后天， out：显示日期
    switch(xcts){
      case -2:
      return '前天'+nowTime;
      break;
      case -1:
      return '昨天'+nowTime;
      break;
      case 0:
      return '今天'+nowTime;
      break;
      case 1:
      return '明天'+nowTime;
      break;
      case 2:
      return '后天'+nowTime;
      break;
      default:
      return input;
    }
  }
});
app.filter('day', function() {
  return function(input) {
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    var date = new Date(input);
    var intervalMilli = date.getTime() - today.getTime();
    var xcts = Math.floor(intervalMilli / (24 * 60 * 60 * 1000));
    // -2:前天 -1：昨天 0：今天 1：明天 2：后天， out：显示日期
    switch(xcts){
    // case -2:
    //   return '前天';
    case -1:
      return '昨天';
    case 0:
      return '今天';
    case 1:
      return '明天';
    // case 2:
    //   return '后天';
    default:
      return (date.getMonth() + 1) + '-' + date.getDate();
    }
  }
});
app.filter('week', function() {
return function(input) {
// input will be ginger in the usage below
switch(new Date(input).getDay()){
  case 0:
  input = '周日';
  break;
  case 1:
  input = '周一';
  break;
  case 2:
  input = '周二';
  break;
  case 3:
  input = '周三';
  break;
  case 4:
  input = '周四';
  break;
  case 5:
  input = '周五';
  break;
  case 6:
  input = '周六';
  break;
  default:
  input = '';
}
return input;
}
});
'use strict';

angular.module('donler')

  .factory('Campaign', ['$http', function ($http) {
    /**
     * 发起活动
     * @param String _url 请求的url
     * @param {Object} _data
     *  _data:{
     *    theme:String,
     *    content:String,(暂时只有挑战有)
     *    location:{
     *      name:String,
     *      coordinate:[]
     *    },
     *    start_time:Date,
     *    deadline:Date,
     *    member_min:Number,(选填)
     *    member_max:Number,(选填)
     *    deadline:Date,(选填)
     *    tags:[String](暂时只有挑战有,选填)
     *    campaign_mold: String,
     *  }
     * @param {Object} callback callback(status,data)
     */
    var sponsor = function (_url, _data, callback) {
      try {
        $http({
          method: 'post',
          url: _url,
          data: _data
        }).success(function (data, status) {
          callback(null,data);
        }).error(function (data, status) {
          callback('error');
        });
      }
      catch (e) {
        console.log(e);
      }
    };

    //获取Tags
    var getTags = function (hostType, hostId, callback) {
      $http.get('/' + hostType + '/getTags/' + hostId).success(function (data, status) {
        callback(null, data);
      }).error(function (data, status) {
        callback('error');
      });
    };

    /**
     * 获取活动类型
     * @param String hostType 请求方 'company' or 'team'
     * @param String hostId 请求方ID (hostType为company时为0)
     * @param {Object} callback callback(err)
     */

     var getMolds = function(hostType,hostId,callback) {
      $http.get('/campaign/getMolds/'+hostType+'/'+hostId).success(function(data,status){
        if(data.result===0){
          callback(data.msg);
        }
        else{
          callback(null,data);
        }
      }).error(function(data,status){
        callback('error');
      })
     }

    /**
     * 参加活动
     * @param {Object} data
     *  data: {
     *    campaignId: String,
     *    cid: String,
     *    tid: String (是公司活动时不需要提供此属性)
     *  }
     * @param {Object} callback callback(err)
     */
    var join = function (data, callback) {
      $http.post('/campaign/joinCampaign/' + data.campaignId, {
        cid: data.cid,
        tid: data.tid
      })
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('参加失败，请重试。');
        });
    };

    /**
     * 退出活动
     * @param {String} campaignId 活动id
     * @param callback callback(err)
     */
    var quit = function (campaignId, callback) {
      $http.post('/campaign/quitCampaign/' + campaignId)
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('退出失败，请重试。');
        });
    };

    /**
     * 编辑活动
     * @param campaignId 活动id
     * @param campaignData 活动数据
     * @param callback callback(err)
     */
    var edit = function (campaignId, campaignData, callback) {
      $http.post('/campaign/edit/' + campaignId, campaignData)
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('编辑失败，请重试。');
        });
    };

    var cancel = function (campaignId, callback) {
      $http.post('/campaign/cancel/' + campaignId)
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('关闭活动失败，请重试。');
        });
    };
    // var vote = function(campaignId, vote_status, tid, callback) {
    //      try {
    //         $http({
    //             method: 'post',
    //             url: '/campaign/vote/'+campaignId,
    //             data:{
    //                 campaignId : campaignId,
    //                 aOr : vote_status,
    //                 tid : tid
    //             }
    //         }).success(function(data, status) {
    //             if(data.result===1) {
    //               callback();
    //             } else {
    //               callback(data.msg);
    //             }
    //         }).error(function(data, status) {
    //             callback('DATA ERROR');
    //         });
    //     }
    //     catch(e) {
    //         console.log(e);
    //     }
    // };
    //应战、拒绝、取消
    var dealProvoke = function(campaignId,tid,status,callback) {
      $http({
        method: 'post',
        url: '/campaign/dealProvoke/'+campaignId,
        data:{
          tid : tid,
          responseStatus : status
        }
      }).success(function(data, status) {
        if(data.result===1) {
          callback();
        } else {
          callback(data.msg);
        }
      }).error(function(data, status) {
        callback('DATA ERROR');
      });
    };

    /**
     * 获取自己能动别人一下的小队或者自己能发活动的小队
     * @param tid 别人小队的id,若是null则是在个人主页查找自己的小队
     * @param callback callback(status,data)
     */
    //获取自己能动别人一下的小队或者自己能发活动的小队
    var getLedTeams = function(tid,callback) {
      if(!tid)
        var _url = '/group/getLedTeams';
      else
        var _url = '/group/getLedTeams/'+tid;
      $http.get(_url).success(function(data,status) {
        if(data.result===0){
          callback(data.msg);
        }
        else{
          callback(null,data);
        }
      });
    };
    /**
     * 获取特定月份的活动
     * @param  {type}   hostType 获取主体的类型：team,user
     * @param  {type}   hostId   小队或者用户的id
     * @param  {type}   paging   分页的条件
     * @param  {Function} callback callback(err, campaigns)
     */
    var getCampaignsData = function (hostType, hostId, paging, callback) {
      var query = '';
      if (paging && paging.year && paging.month) {
        query = '?year=' + paging.year + '&month=' + paging.month;
      }
      $http.get('/campaign/getCampaignData/' +hostType +'/' +hostId + query)
        .success(function (data, status) {
          if (data.result === 1) {
            callback(null, data.timeLine);
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    };

    /**

     * 获取有活动的年月
     * @param  {String}   hostType 获取主体的类型：team,user
     * @param  {String}   hostId   小队或者用户的id
     * @param  {Function} callback callback(err, record)
     */
    var getCampaignsDateRecord = function (hostType, hostId, callback) {
      $http.get('/campaign/getDateRecord/' + hostType +'/'+ hostId)

        .success(function (data, status) {
          if (data.result === 1) {
            callback(null, data.dateRecord);
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    };

    return {
      sponsor: sponsor,
      getTags: getTags,
      join: join,
      quit: quit,
      edit: edit,
      cancel: cancel,
      getMolds: getMolds,
      // vote: vote,
      dealProvoke: dealProvoke,
      getLedTeams: getLedTeams,
      getCampaignsData: getCampaignsData,
      getCampaignsDateRecord: getCampaignsDateRecord
    };
  }]);
'use strict';

angular.module('donler')

  .factory('Comment', ['$http', function ($http) {

    var get = function (type, id, callback, create_date, num) {
      $http.post('/comment/pull/' + type + '/' + id, { create_date: create_date ,num: num})
        .success(function (data, status) {
          callback(null, data.comments, data.nextStartDate);
        })
        .error(function (data, status) {
          callback('error');
        });
    };

    var publish = function (data, callback) {
      $http.post('/comment/push/'+data.host_type+'/'+data.host_id, data)
        .success(function (data) {
          // ugly api
          if (data.msg === 'SUCCESS') {
            callback(null, data.comment);
          } else {
            callback('error');
          }
        })
        .error(function () {
          callback('error');
        });
    };

    var remove = function (comment_id, callback) {
      $http.delete('/comment/' + comment_id)
        .success(function (data) {
          if (data.result === 1) {
            callback();
          } else {
            callback('error');
          }
        })
        .error(function () {
          callback('error');
        });
    };

    var reply = function (comment_id, to, content, callback) {
      $http.post('/comment/' + comment_id + '/reply', {
        to: to,
        content: content
      }).success(function (data, status) {
        if (data.result === 1) {
          callback(null, data.reply);
        } else {
          callback('error');
        }
      }).error(function (data, status) {
        callback('error');
      });
    };

    var getReplies = function (comment_id, callback) {
      $http.get('/comment/' + comment_id + '/replies')
        .success(function (data, status) {
          if (data.result === 1) {
            callback(null, data.replies);
          } else {
            callback('error');
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    };

    return {
      get: get,
      publish: publish,
      reply: reply,
      remove: remove,
      getReplies: getReplies
    };

  }]);
'use strict';

angular.module('donler')

.factory('PhotoAlbum', ['$http', function ($http) {

  var PhotoAlbum = function (id) {
    this.id = id;
  };

  PhotoAlbum.prototype.getInfo = function (callback) {
    $http.get('/photoAlbum/' + this.id)
    .success(function (data, status) {
      if (data.result === 1) {
        callback(null, data.data);
      } else {
        callback(data.msg);
      }
    })
    .error(function (data, status) {
      callback('error');
    });
  };

  PhotoAlbum.prototype.getPhotos = function (callback) {
    $http.get('/photoAlbum/' + this.id + '/photolist')
    .success(function (data, status) {
      if (data.result === 1) {
        callback(null, data.data);
      } else {
        callback(data.msg, []);
      }
    })
    .error(function (data, status) {
      callback('error', []);
    });
  };

  PhotoAlbum.prototype.changeName = function (callback) {
    var self = this;
    return function (name) {
      $http.put('/photoAlbum/' + self.id, {name: name})
      .success(function (data, status) {
        if (data.result === 1) {
          callback(null, data.data);
        } else {
          callback(data.msg);
        }
      })
      .error(function (data, status) {
        callback('error');
      });
    };
  };

  PhotoAlbum.prototype.delete = function (callback) {
    $http.delete('/photoAlbum/' + this.id)
    .success(function (data, status) {
      if (data.result === 1) {
        callback();
      } else {
        callback(data.msg);
      }
    })
    .error(function (data, status) {
      callback('error');
    });
  };

  return PhotoAlbum;

}]);
'use strict';

angular.module('donler')

.factory('Report', ['$http', function ($http) {

  // var get = function (type, id, callback, create_date) {
  //   $http.post('/report/pull/', { host_type : host_type, id : id})
  //   .success(function (data, status) {
  //     callback(null, data.comments, data.has_next);
  //   })
  //   .error(function (data, status) {
  //     callback('error');
  //   });
  // };

  var publish = function (data, callback) {
    $http.post('/report/push/', data)
    .success(function (data, status) {
      if (data.result === 1) {
        callback(null,data.msg);
      } else {
        callback('error',data.msg);
      }
    })
    .error(function (data, status) {
      callback('error','数据发送错误');
    });
  };

  return {
    // get: get,
    publish: publish
  };

}]);
'use strict';

angular.module('donler')

  .factory('Search', ['$http', function ($http) {
    /**
     * 查找同城小队
     * @param String tid 小队id
     * @param pageNum 页数
     * @param {Object} callback callback(status,data)
     */
    var searchSameCity = function (tid, pageNum, callback) {
      try {
        $http.get('/search/sameCityTeam/'+tid+'?page='+pageNum)
        .success(function (data, status) {
          callback(null,data);
        }).error(function (data, status) {
          callback('error');
        });
      }
      catch (e) {
        console.log(e);
        callback('error');
      }
    };
    /**
     * 查找附近小队
     * @param String tid 小队id
     * @param pageNum 页数
     * @param homecourtIndex 主场index
     * @param {Object} callback callback(status,data)
     */
    var searchNearby = function (tid, pageNum, homecourtIndex, callback) {
      try {
        $http.get('/search/nearbyTeam/'+tid+'?page='+pageNum+'&index='+homecourtIndex)
        .success(function (data, status) {
          callback(null,data);
        }).error(function (data, status) {
          callback('error');
        });
      }
      catch (e) {
        console.log(e);
        callback('error');
      }
    };
    /**
     * 查找附近小队
     * @param String tid 小队id
     * @param {Object} callback callback(status,data)
     */
    var getOpponentInfo = function(tid, callback) {
      $http.get('/group/opponentInfo/'+tid)
      .success(function(data,status){
        callback(null,data);
      }).error(function(data,status){
        callback('error');
      })
    };
    /**
     * 关键字查找
     * @param String tid 小队id
     * @param String keyword 关键词
     * @param pageNum 页数
     * @param {Object} callback callback(status,data)
     */
    var searchTeam = function(tid,keyword,pageNum,callback) {
      $http.get('/search/keywordSearch/'+tid+'?key='+keyword+'&page='+pageNum)
      .success(function(data,status){
        callback(null,data);
      }).error(function(data,status){
        callback('error');
      })
    };
    return {
      searchSameCity: searchSameCity,
      getOpponentInfo: getOpponentInfo,
      searchNearby: searchNearby,
      searchTeam: searchTeam
    };
  }]);
'use strict';

var donler = angular.module('donler');

donler.factory('Team', ['$http', function($http) {


  return {
    /**
     * 获取小队信息
     * @param  {String}   id       小队id
     * @param  {Function} callback callback(err, data)
     */
    getTeamInfo: function (id, callback) {
      $http.get('/group/' + id + '/info')
        .success(function (data, status) {
          if (data.result === 1) {
            callback(null, {
              team: data.team,
              allow: data.allow,
              isShowHomeCourts: data.isShowHomeCourts,
              role: data.role
            });
          } else {
            callback('error');
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    },

    /**
     * 获取小队成员列表
     * @param  {String}   id       小队id
     * @param  {Function} callback callback(err, members)
     */
    getTeamMembers: function (id, callback) {
      $http.get('/group/' + id + '/members')
        .success(function (data, status) {
          if (data.result === 1) {
            callback(null, data.members);
          } else {
            callback('error');
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    },

    /**
     * 加入小队
     * @param  {String}   id       小队id
     * @param  {Function} callback callback(err)
     */
    join: function (id, callback) {
      $http.post('/users/joinGroup', { tid: id })
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback('error');
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    },

    /**
     * 退出小队
     * @param  {String}   id       小队id
     * @param  {Function} callback callback(err)
     */
    quit: function (id, callback) {
      $http.post('/users/quitGroup', { tid: id })
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback('error');
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    },

    /**
     * 保存小队信息
     * @param  {String}   id       小队id
     * @param  {Object}   data     {name: String, brief: String}
     * @param  {Function} callback callback(err)
     */
    saveInfo: function (id, data, callback) {
      var homecourt;
      if (data.homecourt) {
        homecourt = data.homecourt;
        for (var i = 0; i < homecourt.length; i++) {
          if (!homecourt[i].name) {
            homecourt.splice(i, 1);
          }
        }
      }
      $http.post('/group/saveInfo/' + id, {
        name: data.name,
        brief: data.brief,
        homecourt: homecourt
      })
        .success(function (data, status) {
          if (data.result === 1) {
            callback();
          } else {
            callback(data.msg);
          }
        })
        .error(function (data, status) {
          callback('error');
        });
    }


  };


}])
'use strict';

var messageApp = angular.module('donler');

messageApp.run(['$http','$rootScope', function ($http, $rootScope) {
  $rootScope.o = 0;
}]);


messageApp.controller('messageHeaderController', ['$scope', '$http','$rootScope', function ($scope, $http, $rootScope) {
    if(location.pathname != '/message/home'){
      $http.get('/message/header').success(function(data, status) {
          var messages = data.msg;
          $rootScope.o = messages.length;
      });
    }
}]);
'use strict';
(function($){
	var $loading, $wrap, timers = [], optsArray = [], currentObj, currentOpts = {},
		
		_position = function($ref, $target){
			var scrollTop,
				scrollLeft,
				windowHeight,
				windowWidth,
				refOffset,
				refHeight,
				refWidth,
				targetTop,
				targetLeft,
				targetHeight,
				targetWidth,
				originTop,
				originRight,
				originBottom,
				originLeft,
				arrowPositon,//箭头方向
				arrowSize = 5,
				isPosition = false;
				
			
			scrollTop = $(document).scrollTop();
			scrollLeft = $(document).scrollLeft();
			windowHeight = $(window).height();
			windowWidth = $(window).width();
			refOffset = $ref.offset();
			refHeight = $ref.outerHeight();
			refWidth = $ref.outerWidth();
			targetHeight = $target.outerHeight();
			targetWidth = $target.outerWidth();
			
			
			//定位显示的位置
			if(refOffset.top - scrollTop - targetHeight - arrowSize>= 0){//上
				if(windowWidth + scrollLeft - refOffset.left - targetWidth >= 0){//上右
					targetTop = refOffset.top - targetHeight - arrowSize;
					targetLeft = refOffset.left;
					isPosition = true;
					arrowPositon = "b";
				}else if(refOffset.left + refWidth -scrollLeft - targetWidth >=0){//上左
					targetTop = refOffset.top - targetHeight - arrowSize;
					targetLeft = refOffset.left + refWidth - targetWidth;
					isPosition = true;
					arrowPositon = "b";
					$wrap.find('.arrow').css({left: 'auto',right: '20px'});
				}
			}
			
			if(!isPosition){
				if(windowHeight - (refOffset.top + refHeight - scrollTop) - targetHeight - arrowSize >= 0){//下
					if(windowWidth + scrollLeft  - refOffset.left - targetWidth >= 0){//下右
						targetTop = refOffset.top + refHeight + arrowSize;
						targetLeft = refOffset.left;
						isPosition = true;
						arrowPositon = "t";
					}else if(refOffset.left + refWidth -scrollLeft - targetWidth >=0){//下左
						targetTop = refOffset.top + refHeight + arrowSize;
						targetLeft = refOffset.left + refWidth - targetWidth;
						isPosition = true;
						arrowPositon = "t";
						$wrap.find('.arrow').css({left: 'auto',right: '20px'});
					}
				}
			}
			
			
			if(!isPosition){
				if(windowWidth + scrollLeft - refOffset.left - refWidth - targetWidth - arrowSize>= 0){//右
					if(refOffset.top + refHeight - scrollTop - targetHeight >= 0){//右上
						targetTop = refOffset.top + refHeight - targetHeight;
						targetLeft = refOffset.left + refWidth + arrowSize;
						isPosition = true;
						arrowPositon = "l";
						$wrap.find('.arrow').css({top: 'auto', bottom: '20px'});
					}else if(refOffset.top + windowHeight - scrollTop - targetHeight>= 0){//右下
						targetTop = refOffset.top;
						targetLeft = refOffset.left + refWidth + arrowSize;
						isPosition = true;
						arrowPositon = "l";
					}
				}
			}
			
			if(!isPosition){
				if(refOffset.left - scrollLeft - targetWidth - arrowSize>=0){//左
					if(windowHeight - (refOffset.top - scrollTop) - targetHeight >= 0){//左下
						targetTop = refOffset.top;
						targetLeft = refOffset.left - targetWidth -arrowSize;
						isPosition = true;
						arrowPositon = "r";
					}else if(refOffset.top + refHeight - scrollTop - targetHeight >= 0){//左上
						targetTop = refOffset.top + refHeight - targetHeight;
						targetLeft = refOffset.left - targetWidth - arrowSize;
						isPosition = true;
						arrowPositon = "r";
						$wrap.find('.arrow').css({top: 'auto', bottom: '20px'});
					} 
				}
			}
			
			if(!isPosition){
				//特殊情况定位(非最大化情况下)
				//计算原点与浏览器视窗边缘的距离
				originTop = refOffset.top - scrollTop + refHeight/2;
				originBottom = windowHeight - originTop;
				originLeft = refOffset.left - scrollLeft + refWidth/2;
				originRight = windowWidth - originLeft;
				
				if(originTop >= originBottom ){
					if(originRight >= originLeft){
						if(originTop < targetHeight && originRight >= targetWidth){//右上
							targetTop = refOffset.top + refHeight - targetHeight;
							targetLeft = refOffset.left + refWidth + arrowSize;	
							arrowPositon = "l";
							$wrap.find('.arrow').css({top: 'auto', bottom: '20px'});
						}else{//上右
							targetTop = refOffset.top - targetHeight - arrowSize;
							targetLeft = refOffset.left;
							arrowPositon = "b";
						}
					}else{
						if(originTop < targetHeight && originLeft >= targetWidth){//左上
							targetTop = refOffset.top + refHeight - targetHeight;
							targetLeft = refOffset.left - targetWidth - arrowSize;
							arrowPositon = "r";
							$wrap.find('.arrow').css({top: 'auto', bottom: '20px'});
						}else{//上左
							targetTop = refOffset.top - targetHeight - arrowSize;
							targetLeft = refOffset.left + refWidth - targetWidth;
							arrowPositon = "b";
							$wrap.find('.arrow').css({left: 'auto',right: '20px'});
						}
					}
				}else{
					if(originRight >= originLeft){
						if(originBottom < targetHeight && originRight >= targetWidth){//右下
							targetTop = refOffset.top;
							targetLeft = refOffset.left + refWidth + arrowSize;		
							arrowPositon = "l";
						}else{//下右
							targetTop = refOffset.top + refHeight + arrowSize;
							targetLeft = refOffset.left;
							arrowPositon = "t";
						}
					}else{
						if(originBottom < targetHeight && originLeft >= targetWidth){//左下
							targetTop = refOffset.top;
							targetLeft = refOffset.left - targetWidth - arrowSize;
							arrowPositon = "r";
						}else{//下左
							targetTop = refOffset.top + refHeight + arrowSize;
							targetLeft = refOffset.left + refWidth - targetWidth;
							arrowPositon = "t";
							$wrap.find('.arrow').css({left: 'auto',right: '20px'});
						}
					}
				}
				
				isPosition = true;	
			}
			
			$wrap.find('.arrow').removeClass().addClass('arrow arrow_' + arrowPositon);
			
			if(isPosition){
				$target.css({
					top: targetTop,
					left: targetLeft
				});
			}

		},
		
		_appendContent = function(){
			var type, href, data, content;

			$loading = $('<div class="dl_card_loading"><div>正在加载，请稍后</div></div>');
			if (typeof($wrap) != "undefined"){
				$wrap.html('');
			}else{	
				$('body').append('<div class="dl_card"></div>');
				$wrap = $('.dl_card');
			}
			$wrap.html('<div class="dl_card_layer clearfix"><div class="dl_card_content clearfix"></div><div class="arrow"></div></div>');
			$wrap.find('.dl_card_content').append($loading);
			currentOpts = optsArray.opts;
			if(currentOpts.content){
				type = 'html';
			}else{
				type = 'ajax';
			}
			
			switch (type) {
				case 'html' :
					$wrap.find('.dl_card_content').html(currentOpts.content);
				break;

				case 'ajax' :
					href = $(currentObj).attr('ajax-href');
					data = $(currentObj).attr('ajax-data');
					
					var ajaxLoader = $.ajax({
						url	: href,
						data : data || {},
						error : function(XMLHttpRequest, textStatus, errorThrown) {
							if ( XMLHttpRequest.status > 0 ) {
								window.console.log('ajax error');
							}
						},
						success : function(data, textStatus, XMLHttpRequest) {
							var o = typeof XMLHttpRequest == 'object' ? XMLHttpRequest : ajaxLoader;
							if (o.status == 200) {
								$wrap.find('.pinwheel_content').html(data);
								_position($(currentObj), $wrap);//定位
							}
						}
					});
				break;
			}
		},
		
		_clearTimer = function(){
			for(var i=0; i<timers.length; i++){
				if(timers[i]){
					clearInterval(timers[i]);
				}
			}
			timers = [];
		},
		
		_debug = function($obj){
			if(window.console && window.console.log){
				window.console.log("pinwheel count :" +　$obj.size());
			};
		};

	$.fn.dl_card = function(options){
		var opts=options;
		return this.each(function(){
			optsArray={obj:this, opts:opts};
			_clearTimer();
			if(currentObj && currentObj == this){
				_position($(this), $wrap);//定位
				$wrap.show();
			}else{
				currentObj = this;
				_appendContent();//为容器添加内容
				_position($(this), $wrap);//定位
				$wrap.show();

				$wrap.unbind().bind('mouseover', function(e){
					e.stopPropagation();
					_clearTimer();
				});
		
				$(this).bind("mouseleave", function(){
					_clearTimer();
					if($wrap.is(':visible')){
						var timer = setInterval(function(){
							$wrap.hide();
							_clearTimer();
						},50);	
						timers.push(timer);
					}
				});
				$wrap.bind("mouseleave", function(){
					_clearTimer();
					if($wrap.is(':visible')){
						var timer = setInterval(function(){
							$wrap.hide();
							_clearTimer();
						},50);	
						timers.push(timer);
					}
				});
			}
		});
	};

	// $.fn.dl_card_hide = function(){
	// 	//$wrap.hide();
	// }
})(jQuery);