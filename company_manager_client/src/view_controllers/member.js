define(['angular', 'qrcode', 'angulardatatables'], function (angular, qrcode, angulardatatables) {
  return angular.module('memberCtrls', ['datatables']).controller('member.inviteCtrl', [
    '$rootScope',
    '$scope',
    '$timeout',
    'memberService',
    function ($rootScope, $scope, $timeout, memberService) {
      var qrcode = new QRCode("inviteKeyQrCode", {
        text: $rootScope.company.inviteUrl,
        width: 128,
        height: 128
      });
      $timeout(function () {
        var img = $('#inviteKeyQrCode').find('img')[0];
        var link = document.getElementById('saveInviteKeyQrCode');
        link.href = img.src;
        link.download = "inviteCode.jpg";
      },10)


      $scope.email = '';
      $scope.invite = function () {
        memberService.invite($scope.email)
          .success(function (data) {
            alert(data.msg);
          })
          .error(function (data) {
            alert(data.msg);
          });
      };

    }
  ])
  .filter('inviteMemberFormat', function() {
    return function(input) {
      switch (input) {
        case 0:
          input = '未注册';
          break;
        case 1:
          input = '邀请成功';
          break;
        case 2:
          input = '已经激活';
          break;
        case 3:
          input = '已注册，未激活';
          break;
        case 4:
          input = '不是企业邮箱';
          break;
        case 5:
          input = '不是有效的邮箱';
          break;
        case 6:
          input = '邮件发送错误';
          break;
        case 7:
          input = '数据库发生错误';
          break;
        default:
          input = '';
      }
      return input;
    }
  })
    .controller('member.activeCtrl', [
      '$rootScope',
      '$scope',
      '$state',
      'memberService',
      'DTOptionsBuilder',
      'DTColumnDefBuilder',
      function ($rootScope, $scope, $state, memberService, DTOptionsBuilder, DTColumnDefBuilder) {
        $scope.dtOptions = DTOptionsBuilder.newOptions()
        .withOption('searching', false)
        // .withOption('paging', false)
        .withLanguage({
          'lengthMenu': '_MENU_',
          'zeroRecords': '无数据',
          'paginate': {
            'previous': '上一页',
            'next': '下一页'
          }
        })
        .withOption('info', false);

        $scope.dtColumnDefs =[
          DTColumnDefBuilder.newColumnDef(0),
          DTColumnDefBuilder.newColumnDef(1),
          DTColumnDefBuilder.newColumnDef(2),
          DTColumnDefBuilder.newColumnDef(3).notSortable()
        ];

        var closedUserFilter = function(user) {
          if(user.mail_active===true) {
            return true;
          }
          return false;
        };
        var unClosedUserFilter = function(user) {
          if(user.mail_active===false) {
            return true;
          }
          return false;
        }
        memberService.getMembers($rootScope.company._id,{resultType:3}).success(function (data) {
          $scope.companyMembers = data;
          $scope.closedMembers = data.filter(closedUserFilter);
          $scope.unClosedMembers = data.filter(unClosedUserFilter);
        })
        .error(function (data) {
          alert(data.msg);
        });
        $scope.active = function (id) {
          memberService.active(id).success(function (data) {
            alert('激活成功');
            $state.reload();
          })
          .error(function (data) {
            alert(data.msg);
          });
        };
      }
    ])
    .controller('member.inactiveCtrl', [
      '$rootScope',
      '$scope',
      '$state',
      'memberService',
      '$modal',
      function ($rootScope, $scope, $state, memberService, $modal) {
        // 屏蔽页暂时不要 －M 2014/4/20
        // memberService.getReportedMembers($rootScope.company._id).success(function (data) {
        //   $scope.companyReportedMembers = data;
        // })
        // .error(function (data) {
        //   alert(data.msg);
        // });
        // $scope.deal = function (id, dealFlag) {
        //   memberService.deal({host_type:'user',host_id:id,flag:dealFlag}).success(function (data) {
        //     $scope.modalInstance.dismiss('cancel');
        //     alert('处理成功');
        //   })
        //   .error(function (data) {
        //     $scope.modalInstance.dismiss('cancel');
        //     alert(data.msg);
        //   });
        // }
        // $scope.getDetail = function (id) {
        //   $scope.nowId = id;
        //   memberService.getMemberComments(id).success(function (data) {
        //     $scope.comments = data;
        //     $scope.modalInstance = $modal.open({
        //       templateUrl: 'getUserCommentModal.html',
        //       scope: $scope
        //     });
        //     $scope.close = function () {
        //       $scope.modalInstance.dismiss('cancel');
        //     }
        //   })
        //   .error(function (data) {
        //     alert(data.msg);
        //   });
        // }
      }
    ])
    .controller('member.allCtrl', [
      '$rootScope',
      '$scope',
      '$state',
      '$timeout',
      'memberService',
      'departmentService',
      '$modal',
      'DTOptionsBuilder',
      'DTColumnDefBuilder',
      function ($rootScope, $scope, $state, $timeout, memberService, departmentService, $modal, DTOptionsBuilder, DTColumnDefBuilder) {

        $scope.dtOptions = DTOptionsBuilder.newOptions()
        .withOption('searching', false)
        // .withOption('paging', false)
        .withLanguage({
          'lengthMenu': '_MENU_',
          'zeroRecords': '无数据',
          'paginate': {
            'previous': '上一页',
            'next': '下一页'
          }
        })
        .withOption('info', false);

        $scope.dtColumnDefs =[
          DTColumnDefBuilder.newColumnDef(0).notSortable(),
          DTColumnDefBuilder.newColumnDef(1).notSortable(),
          DTColumnDefBuilder.newColumnDef(2).notSortable(),
          DTColumnDefBuilder.newColumnDef(3).notSortable(),
          DTColumnDefBuilder.newColumnDef(4).notSortable()
        ];
        memberService.getMembers($rootScope.company._id).success(function(data) {
          $scope.companyMembers = data;
          $scope.oldCompanyMembers = data;
        })
        .error(function(data) {
          alert(data.msg);
        });
        // memberService.getMembers($rootScope.company._id,{resultType:4}).success(function (data) {
        //   $scope.inactiveMemberLength = data.length;
        // })
        // .error(function (data) {
        //   console.log(data.msg);
        // });

        // $scope.pageNum =10;
        // $scope.nowPage = 1;
        // $scope.AllcompanyMembers =[];
        // memberService.getMembers($rootScope.company._id,{resultType:2,page:$scope.nowPage}).success(function (data) {
        //   $scope.companyMembers = data.users;
        //   $scope.AllcompanyMembers = new Array(data.maxPage);
        //   $scope.AllcompanyMembers[0] =data.users;
        //   $scope.maxPage = data.maxPage;

        // })
        // .error(function (data) {
        //   alert(data.msg);
        // });
        $scope.nextPage = function () {
          if($scope.maxPage<=$scope.nowPage){
            return;
          }
          $scope.nowPage++;
          if($scope.AllcompanyMembers[$scope.nowPage-1]){
            $scope.companyMembers = $scope.AllcompanyMembers[$scope.nowPage-1];
          }
          else{
            memberService.getMembers($rootScope.company._id,{resultType:2,page:$scope.nowPage}).success(function (data) {
              $scope.companyMembers = data.users;
              $scope.AllcompanyMembers[$scope.nowPage-1] =data.users;
            })
            .error(function (data) {
              alert(data.msg);
            });
          }
        }
        $scope.lastPage = function () {
          if($scope.nowPage<2){
            return;
          }
          $scope.nowPage--;
          if($scope.AllcompanyMembers[$scope.nowPage-1]){
            $scope.companyMembers = $scope.AllcompanyMembers[$scope.nowPage-1];
          }
          else{
            memberService.getMembers($rootScope.company._id,{resultType:2,page:$scope.nowPage}).success(function (data) {
              $scope.companyMembers = data.users;
              $scope.AllcompanyMembers[$scope.nowPage-1] = data.users;
            })
            .error(function (data) {
              alert(data.msg);
            });
          }
        }
        $scope.getPage = function (page) {
          $scope.nowPage =page;
          if($scope.AllcompanyMembers[$scope.nowPage-1]){
            $scope.companyMembers = $scope.AllcompanyMembers[$scope.nowPage-1];
          }
          else{
            memberService.getMembers($rootScope.company._id,{resultType:2,page:page}).success(function (data) {
              $scope.companyMembers = data.users;
              $scope.AllcompanyMembers[page-1] =data.users;
            })
            .error(function (data) {
              alert(data.msg);
            });
          }
          
        }
        $scope.showStatus = function(type) {
          $scope.companyMembers = [];
          switch(type) {
            case 0:
              $scope.companyMembers = $scope.oldCompanyMembers;
              break;
            case 1:
              $scope.oldCompanyMembers.forEach(function(member) {
                if(member.active) {
                  $scope.companyMembers.push(member);
                }
              });
              break;
            case 2:
              $scope.oldCompanyMembers.forEach(function(member) {
                if(!member.active && member.mail_active) {
                  $scope.companyMembers.push(member);
                }
              });
              break;
            case 3:
              $scope.oldCompanyMembers.forEach(function(member) {
                if(!member.active && !member.mail_active) {
                  $scope.companyMembers.push(member);
                }
              });
              break;
          }
        }
        $scope.close = function(index) {
          var member = $scope.companyMembers[index];
          if(confirm('是否确认屏蔽此人？')) {
            memberService.close(member._id).success(function(status, data) {
              $scope.companyMembers[index].acitve = false;
              $scope.$apply();
              alert('屏蔽成功');
            })
            .error(function(stats, data) {
              alert('屏蔽失败');
            });
          }
        }
        $scope.open = function(index) {
          var member = $scope.companyMembers[index];
          if(confirm('是否确认解除屏蔽？')) {
            memberService.open(member._id).success(function(status, data) {
              $scope.companyMembers[index].acitve = true;
              $scope.$apply();
              alert('解除成功');
            })
            .error(function(stats, data) {
              alert('解除失败');
            });
          }
        }

      }
    ]).controller('member.batchImport', [
      '$rootScope',
      '$scope',
      '$state',
      'memberService',
      function ($rootScope, $scope, $state, memberService) {
        $scope.importFlag = false;
        $scope.importExcel = function () {
          var reader = new FileReader(),
            fileData;
          function to_json(workbook) {
            var result = {};
            workbook.SheetNames.forEach(function(sheetName) {
              var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
              if(roa.length > 0){
                var formatRows =[]
                roa.forEach(function(element, index){
                  var formatRow ={}
                  for (var col in element){
                    if(col=='邮箱'){
                      formatRow.email = element[col]
                    }
                    else if(col=='姓名'){
                      formatRow.name = element[col]
                    }
                  }
                  if(formatRow.email && formatRow.email.indexOf('@')>-1){
                    formatRows.push(formatRow)
                  }
                });
                result[sheetName] = formatRows;
              }
            });
            return result;
          }
          reader.onload = function(e){
            $scope.importFlag = true;
            var data = e.target.result;
            var workbook = XLSX.read(data, {type: 'binary'});
            var output = to_json(workbook);
            $scope.members = []
            for (var sheet in output){
              $scope.members = $scope.members.concat(output[sheet])
            }
            memberService.batchInviteCheck($scope.members).success(function (data) {
              $scope.validMembers =[]
              $scope.invalidMembers =[]
              data.forEach(function(element, index){
                if(element.status==0){
                  element.select = false;
                  element.index = $scope.validMembers.length;
                  $scope.validMembers.push(element)
                }
                else{
                  $scope.invalidMembers.push(element)
                }
              });
              $scope.members = data;
            })
            .error(function (data) {
              alert(data.msg);
            });
          };
          if ($('#importFile')[0].files[0]) {
            reader.readAsBinaryString($('#importFile')[0].files[0]);
          }
        }
        $scope.selectAll = function () {
          $scope.validMembers.forEach(function(element, index){
            element.select = true;
          });
        }
        $scope.reset= function (argument) {
          $scope.importFlag =false;
          document.getElementById("importForm").reset();
          $scope.validMembers =[]
          $scope.invalidMembers =[]
        }
        $scope.invite = function () {
          var inviteMembers = $scope.validMembers.filter(function (member) {
            return member.select==true;
          })
          if(inviteMembers.length==0){
            alert('您未选择要邀请的员工')
            return;
          }
          else{
            $scope.inviteLoading = true;
            memberService.batchInvite(inviteMembers).success(function (data) {
              data.forEach(function(member, index){
                $scope.validMembers[member.index] = member;
              });
              $scope.inviteLoading = false;
            })
            .error(function (data) {
              alert(data.msg);
              $scope.inviteLoading = false;
            });
          }
          
        }
      }
    ]);
});




