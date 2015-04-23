define(['angular', 'qrcode'], function (angular, qrcode) {
  return angular.module('memberCtrls', []).controller('member.inviteCtrl', [
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
          input = '发生错误';
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
      function ($rootScope, $scope, $state, memberService) {
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
      'memberService',
      'departmentService',
      '$modal',
      function ($rootScope, $scope, $state, memberService, departmentService, $modal) {
        var markUserDepartment = function(user, department) {
          if (department && user.department) {
            for (var i = 0; i < department.length; i++) {
              if (department[i]._id.toString() === user.department._id.toString()) {
                department[i].selected = true;
                $scope.last_selected_node = department[i];
                $scope.ori_selected_node = department[i];
              }
              else {
                department[i].selected = false;
              }
              markUserDepartment(user, department[i].department);
            }
          }
        };
        memberService.getMembers($rootScope.company._id,{resultType:4}).success(function (data) {
          $scope.inactiveMemberLength = data.length;
        })
        .error(function (data) {
          console.log(data.msg);
        });

        var formatData = function(data) {
          $scope.node = {
            _id: data._id,
            name: data.name,
            is_company: true,
            department: data.department
          };
          if ($scope.node.department.length === 0) {
            $scope.node.department = null;
          }
          markUserDepartment($scope.nowUser, $scope.node.department);
        };
        $scope.pageNum =10;
        $scope.nowPage = 1;
        $scope.AllcompanyMembers =[];
        memberService.getMembers($rootScope.company._id,{resultType:2,page:$scope.nowPage}).success(function (data) {
          $scope.companyMembers = data.users;
          $scope.AllcompanyMembers = new Array(data.maxPage);
          $scope.AllcompanyMembers[0] =data.users;
          $scope.maxPage = data.maxPage;

        })
        .error(function (data) {
          alert(data.msg);
        });
        $scope.nextPage = function () {
          if($scope.maxPage<=$scope.nowPage){
            return;
          }
          $scope.nowPage++;
          // if($scope.nowPage>$scope.page) {
          //   memberService.getMembers($rootScope.company._id,{resultType:2,page:++$scope.page}).success(function (data) {
          //     $scope.AllcompanyMembers.push(data.users);
          //     $scope.companyMembers = data.users;
          //     $scope.hasNext = data.hasNext;
          //   })
          // }
          // else {
            $scope.companyMembers = $scope.AllcompanyMembers[$scope.nowPage-1];
          // }
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
              $scope.AllcompanyMembers = new Array(data.maxPage);
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
              $scope.AllcompanyMembers = new Array(data.maxPage);
              $scope.AllcompanyMembers[page-1] =data.users;
            })
            .error(function (data) {
              alert(data.msg);
            });
          }
          
        }
        departmentService.getDepartmentTree($rootScope.company._id).success(function (data) {
          $scope.department = data;
        })
        .error(function (data) {
          alert(data.msg);
        });

        
        

        //编辑成员
        // $scope.selectNode = function(node) {
        //   if (node.is_company === true) {
        //     return;
        //   }
        //   if ($scope.last_selected_node) {
        //     $scope.last_selected_node.selected = false;
        //   }
        //   node.selected = true;
        //   $scope.last_selected_node = node;
        // };
        $scope.editUser = function (index) {
          $scope.index = index;
          $scope.nowUser = $scope.companyMembers[index];
          formatData($scope.department);
          
          $scope.modalInstance = $modal.open({
            templateUrl: 'editUserModal.html',
            scope: $scope
          });
          //关闭modal
          $scope.close = function () {
            $scope.modalInstance.dismiss('cancel');
          }
          //激活
          $scope.active = function () {
            var id = $scope.companyMembers[$scope.index]._id;
            memberService.active(id).success(function (data) {
              alert('激活成功');
              $scope.companyMembers[$scope.index].active = true;
              $scope.companyMembers[$scope.index].mail_active = true;
              $scope.nowUser.active = true;
              $scope.nowUser.mail_active = true;
            })
            .error(function (data) {
              alert(data.msg);
            });
          };
          //屏蔽
          $scope.closeUser = function() {
            var id = $scope.companyMembers[$scope.index]._id;
            memberService.close(id).success(function (data) {
              alert('屏蔽成功');
              $scope.companyMembers[$scope.index].active = false;
              $scope.nowUser.active = false;
            })
            .error(function (data) {
              alert(data.msg);
            });
          };
          // $scope.save = function () {
          //   $scope.modalInstance.dismiss('cancel');
          //   memberService.edit($scope.nowUser._id,{did:$scope.last_selected_node._id}).success(function (data) {
          //     alert('编辑成功');
          //     $state.reload();
          //   })
          //   .error(function (data) {
          //     alert(data.msg);
          //   });

          // }
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
                    if(col=='邮件'){
                      formatRow.email = element[col]
                    }
                    else if(col=='用户名'){
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
              $scope.validMembers = data;
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




