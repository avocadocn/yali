define(['./campaign', 'alertify', 'moment'], function (campaign, alertify, moment) {
  return campaign.directive('contenteditable', [function() {
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
                changeBind(e);
            }, 100);
          }
          element.bind('focus', function() {
            element.bind('input',changeBind);
            element.bind('keydown',changeBind);
            element.bind('paste', clearStyle);
          });
          element.bind('blur', function(e) {
            element.unbind('input',changeBind);
            element.unbind('keydown',changeBind);
            element.unbind('paste', clearStyle);
            changeBind(e);
          });
          return read = function() {
            return ngModel.$setViewValue($.trim(element.html()));
          };
        }
      };
    }])
    .directive('mixMaxlength', function() {
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, ele, attrs, ctrl) {
          var length = parseInt(attrs['mixMaxlength']) || 10;
          scope.$watch(attrs.ngModel, function(newValue, oldValue) {
            if (newValue && newValue.replace(/[\u4e00-\u9fa5]/g, '**').length > length) {
              ctrl.$setValidity('mixlength', false);
              ele[0].onkeydown = function (evt) {
                switch (evt.keyCode) {
                case 8: // backspace
                case 46: // delete
                  break;
                default:
                  evt.preventDefault();
                  break;
                }
              };
            } else {
              ctrl.$setValidity('mixlength', true);
              ele[0].onkeydown = null;
            }
          })
        }
      }
    })
    .directive('sponsorCampaign', ['campaignService', function (campaignService) {
      return {
        restrict: 'E',
        scope: {
          data: '=',
        },
        templateUrl: '/company/manager/templates/campaign/sponsor.html',
        link: function (scope, ele, attrs, ctrl) {

          scope.$watch('data', function (data) {
            if (data) {
              scope.teams = scope.data.teams;
            }
          })

          //选小队相关
          scope.selectedType = 'company';
          scope.selectType = function(selectedType) {
            scope.selectedType = selectedType;
          };

          scope.tid = [];
          scope.toggleSelectTeam = function(tid, indexOfTeams) {
            var index = scope.tid.indexOf(tid);
            if(index>-1) {
              scope.tid.splice(index, 1);
              scope.teams[indexOfTeams].selected = false;
            } else {
              scope.tid.push(tid);
              scope.teams[indexOfTeams].selected = true;
            }
          };

          //获取mold
          campaignService.getCampaignMolds().success(function (data) {
            scope.molds = data;
            scope.mold = data[0].name;
          })
          .error(function (data) {
            console.log(data);
          });

          scope.selectMold = function (name) {
            scope.mold = name;
          };

          //详情
          scope.content = '活动简介';
          scope.checkContent = function() {
            if(scope.content=='活动简介') {
              scope.content = '';
            }
          };

          var options = {
            editor: document.getElementById('campaignDetail'), // {DOM Element} [required]
            class: 'dl_markdown', // {String} class of the editor,
            textarea: '<textarea name="content" ng-model="content"></textarea>', // fallback for old browsers
            list: ['h5', 'p', 'insertorderedlist','insertunorderedlist', 'indent', 'outdent', 'bold', 'italic', 'underline'], // editor menu list
            stay: false,
            toolBarId: 'campaignDetailToolBar'
          };

          var editor = new Pen(options);

          //时间相关
          $('#start_time').datetimepicker({
            autoclose: true,
            language: 'zh-CN',
            startDate: new Date(),
            pickerPosition:"bottom-left"
          });
          $('#end_time').datetimepicker({
            autoclose: true,
            language: 'zh-CN',
            startDate: new Date(),
            pickerPosition:"bottom-left"
          });
          $('#deadline').datetimepicker({
            autoclose: true,
            language: 'zh-CN',
            startDate: new Date(),
            pickerPosition:"bottom-left"
          });

          $("#start_time").on("changeDate",function (ev) {
              var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
              scope.start_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
              $('#end_time').datetimepicker('setStartDate', dateUTC); //开始时间应小于结束时间
          });
          $("#end_time").on("changeDate",function (ev) {
              var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
              scope.end_time = moment(dateUTC).format("YYYY-MM-DD HH:mm");
              $('#start_time').datetimepicker('setEndDate', dateUTC); //开始时间应小于结束时间
              $('#deadline').datetimepicker('setEndDate', dateUTC);   //截至时间应小于结束时间
          });
          $("#deadline").on("changeDate",function (ev) {
              var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
              scope.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
              $('#end_time').datetimepicker('setStartDate', dateUTC); //截至时间应小于结束时间
          });

          //map相关
          scope.mapLoadFlag = false;
          scope.location = {name:'',coordinates:[]};
          var placeSearchCallBack = function(data) {
            scope.locationmap.clearMap();
            if(data.poiList.pois.length==0){
              alert('没有符合条件的地点，请重新输入');
              return;
            }
            var lngX = data.poiList.pois[0].location.getLng();
            var latY = data.poiList.pois[0].location.getLat();
            scope.location.coordinates=[lngX, latY];
            var nowPoint = new AMap.LngLat(lngX,latY);
            var markerOption = {
              map: scope.locationmap,
              position: nowPoint,
              draggable: true
            };
            var mar = new AMap.Marker(markerOption);
            var changePoint = function (e) {
              var p = mar.getPosition();
              scope.location.coordinates=[p.getLng(), p.getLat()];
            };
            AMap.event.addListener(mar, "dragend", changePoint);
            scope.locationmap.setFitView();
          };
          scope.initialize = function() {
            scope.locationmap = new AMap.Map("mapDetail");            // 创建Map实例
            scope.locationmap.plugin(["AMap.CitySearch"], function() {
              scope.locationmap.plugin(["AMap.PlaceSearch"], function() {
                scope.MSearch = new AMap.PlaceSearch({ //构造地点查询类
                  pageSize:1,
                  pageIndex:1
                });
                AMap.event.addListener(scope.MSearch, "complete", placeSearchCallBack);//返回地点查询结果
              });
              //实例化城市查询类
              var citysearch = new AMap.CitySearch();
              //自动获取用户IP，返回当前城市
              citysearch.getLocalCity();
              //citysearch.getCityByIp("123.125.114.*");
              AMap.event.addListener(citysearch, "complete", function(result){
                if(result && result.city && result.bounds) {
                  var citybounds = result.bounds;
                  //地图显示当前城市
                  scope.locationmap.setBounds(citybounds);
                  scope.locationmap.plugin(["AMap.PlaceSearch"], function() {
                    scope.MSearch = new AMap.PlaceSearch({ //构造地点查询类
                      pageSize:1,
                      pageIndex:1,
                      city: result.city

                    });
                    AMap.event.addListener(scope.MSearch, "complete", placeSearchCallBack);//返回地点查询结果
                  });
                }
              });
              AMap.event.addListener(citysearch, "error", function(result){alert(result.info);});
            });
            scope.mapLoadFlag = true;
          };

          scope.showMap = function () {
            if(scope.location.name==''){
              alert('请输入地点');
              return false;
            }
            if(scope.mapLoadFlag ==false){
              window.initialize = scope.initialize;
              var script = document.createElement("script");
              script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=initialize";
              document.body.appendChild(script);
            }
            else{
              scope.MSearch.search(scope.location.name); //关键字查询
              scope.showMapFlag = true;
            }
          };
          $('#sponsorCampaignModel').on('show.bs.modal', function(e) {
            if(scope.mapLoadFlag ==false) {
              window.initialize = scope.initialize;
              var script = document.createElement("script");
              script.src = "http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=initialize";
              document.body.appendChild(script);
            }
          });

          //发活动
          scope.sponsorCampaign = function () {
            var campaign = {
              cid: [scope.data.cid],
              tid: scope.tid,
              campaign_type: scope.selectedType === 'company' ? 1:2,
              theme: scope.theme,
              location: scope.location,
              start_time: scope.start_time,
              end_time: scope.end_time,
              deadline: scope.deadline,
              campaign_mold: scope.mold,
              member_max: scope.member_max,
              content: scope.content
            };
            // console.log(campaign);
            campaignService.sponsor(campaign, function(msg) {
              if(msg) {
                alert(msg);
              }else {
                $('#sponsorCampaignModel').modal('hide');
                alert('活动发送成功');
              }
            })
          };
        }
      }
    }])
    .directive('editCampaign', ['campaignService', '$modal', function (campaignService, $modal) {
      return {
        restrict: 'A',
        scope: {
          campaignId: '=',
        },
        // template: '<a href="" ng-click="getCampaign(campaignId)"> 详情</a>',
        // templateUrl: '/company/manager/templates/campaign/editCampaign.html',
        link: function (scope, ele, attrs, ctrl) {
          //按按钮时请求数据
          scope.getCampaign = function() {
            scope.modalInstance = $modal.open({
              templateUrl: '/company/manager/templates/campaign/editCampaign.html',
              size:'sm',
              scope: scope
            });
            scope.close = function() {
              scope.modalInstance.dismiss('cancel');
            }
            campaignService.getCampaign(scope.campaignId)
              .success(function (data, status) {
                scope.campaignOfTeams = true;
                scope.campaign = data;
                scope.campaign.members = [];
                var units = scope.campaign.campaign_unit;
                for(var i=units.length-1; i>=0; i--) {
                  for(var j=units[i].member.length-1; j>=0; j--) {
                    scope.campaign.members.push(units[i].member[j]);
                  }
                }
                if(data.campaign_type === 1 || data.campaign_type > 5) {
                  scope.campaignOfTeams = true;
                }
                scope.campaign.deadline = moment(scope.campaign.deadline).format('YYYY-MM-DD HH:mm');
                // $('#deadlineEdit').datetimepicker({
                //   autoclose: true,
                //   language: 'zh-CN',
                //   startDate: new Date(),
                //   pickerPosition:"bottom-left"
                // });
                // $('#deadlineEdit').datetimepicker('setEndDate', new Date(scope.campaign.end_time));   //截至时间应小于结束时间
              })
              .error(function (data, status) {

              });
          }
          ele.on('click', scope.getCampaign);

          // $("#deadlineEdit").on("changeDate",function (ev) {
          //   var dateUTC = new Date(ev.date.getTime() + (ev.date.getTimezoneOffset() * 60000));
          //   scope.campaign.deadline = moment(dateUTC).format("YYYY-MM-DD HH:mm");
          // });

          // var options = {
          //   editor: document.getElementById('campaignDetailEdit'), // {DOM Element} [required]
          //   class: 'dl_markdown', // {String} class of the editor,
          //   textarea: '<textarea name="content" ng-model="content"></textarea>', // fallback for old browsers
          //   list: ['h5', 'p', 'insertorderedlist','insertunorderedlist', 'indent', 'outdent', 'bold', 'italic', 'underline'], // editor menu list
          //   stay: false,
          //   toolBarId: 'campaignDetailEditToolBar'
          // };

          // var editor = new Pen(options);

          // scope.edit = function() {
          //   scope.editing = true;
          // };
          // scope.save = function() {
          //   campaignService.editCampaign(scope.campaign)
          //   .success(function (data, status) {
          //     alert('保存成功');
          //     scope.editing = false;
          //   })
          //   .error(function (data, status) {
          //     alert('保存失败:' + data.msg);
          //   })
          // };
        }
      }
    }])
    .directive('campaignMember', ['campaignService', function (campaignService) {
      return {
        restrict: 'E',
        scope: {
          members: '=',
        },
        templateUrl: '/company/manager/templates/campaign/campaignMember.html',
        link: function (scope, ele, attrs, ctrl) {
          scope.showAll = false;
          scope.showAllMember = function() {
            scope.showAll = true;
          }
        }
      }
    }])
    // .directive('campaignStBar', ['$filter', function ($filter) {
    //   return {

    //     restrict: 'E',
    //     scope: {
    //       data: '='
    //     },
    //     templateUrl: '/company/manager/templates/campaign/st_bar.html',
    //     link: function (scope, ele, attrs, ctrl) {

    //       var getDateRangeString = function (start, end) {
    //         return ($filter('date')(start, 'yyyy-MM-dd') + '\n~' + $filter('date')(end, 'yyyy-MM-dd'));
    //       };

    //       scope.$watch('data', function (data) {
    //         if (data) {
    //           var myChart = echarts.init(ele[0].querySelector('.st_bar'));

    //           var option = {
    //             title: {
    //               text: '公司小队活动'
    //             },
    //             tooltip: {
    //               trigger: 'axis'
    //             },
    //             legend: {
    //               data: ['活动次数', '活动人次']
    //             },
    //             toolbox: {
    //               show: true,
    //               feature: {
    //                 saveAsImage: {show: true}
    //               }
    //             },
    //             xAxis: [
    //               {
    //                 name: '周',
    //                 type: 'category',
    //                 axisLabel: {
    //                   interval: 0
    //                 },
    //                 data: [
    //                   getDateRangeString(data.splitDate[0], data.splitDate[1]),
    //                   getDateRangeString(data.splitDate[1], data.splitDate[2]),
    //                   getDateRangeString(data.splitDate[2], data.splitDate[3]),
    //                   getDateRangeString(data.splitDate[3], data.splitDate[4]),
    //                   getDateRangeString(data.splitDate[4], data.splitDate[5]) + '\n本周'
    //                 ]
    //               }
    //             ],
    //             yAxis: [
    //               {
    //                 name: '活动次数',
    //                 type: 'value',
    //                 position: 'left'
    //               },
    //               {
    //                 name: '活动人次',
    //                 type: 'value',
    //                 position: 'right'
    //               }
    //             ],
    //             series: [
    //               {
    //                 name: '活动次数',
    //                 type: 'bar',
    //                 data: data.chartsData.campaignCounts,
    //                 itemStyle: {
    //                   normal: {
    //                     color: '#d7cdeb'
    //                   }
    //                 }
    //               },
    //               {
    //                 name: '活动人次',
    //                 type: 'bar',
    //                 yAxisIndex: 1,
    //                 data: data.chartsData.memberCounts,
    //                 itemStyle: {
    //                   normal: {
    //                     color: '#a9d4f3'
    //                   }
    //                 }
    //               }
    //             ]
    //           };

    //           // 为echarts对象加载数据
    //           myChart.setOption(option);
    //         }
    //       });

    //     }

    //   };
    // }])
    // .directive('campaignStPie', ['$filter', function ($filter) {
    //   return {
    //     restrict: 'E',
    //     scope: {
    //       data: '='
    //     },
    //     templateUrl: '/company/manager/templates/campaign/st_pie.html',
    //     link: function (scope, ele, attrs, ctrl) {

    //       scope.labels = [];

    //       var isShowLabel = function (value) {
    //         return value > 0;
    //       };

    //       var getDateRangeString = function (start, end) {
    //         return ($filter('date')(start, 'yyyy-MM-dd') + '~' + $filter('date')(end, 'yyyy-MM-dd'));
    //       };

    //       var formatData = function (data) {
    //         var resData = [];

    //         var max = Math.min(5, data.chartsData.length);
    //         for (var i = 0; i < max; i++) {
    //           var name = getDateRangeString(data.splitDate[i], data.splitDate[i + 1]);
    //           if (i === max - 1) {
    //             name += ' 本周'
    //           }
    //           scope.labels.push(name);
    //           resData.push({
    //             name: name,
    //             type: 'pie',
    //             radius: '30%',
    //             center: [(10 + 20 * i) + '%', '50%'],

    //             data: [
    //               {
    //                 value: data.chartsData[i].zero,
    //                 name: '没有参加',
    //                 itemStyle: {
    //                   normal: {
    //                     label: {
    //                       show: isShowLabel(data.chartsData[i].zero)
    //                     },
    //                     labelLine: {
    //                       show: isShowLabel(data.chartsData[i].zero),
    //                       length: 1
    //                     },
    //                     color: '#d7cdeb'
    //                   }
    //                 }
    //               },
    //               {
    //                 value: data.chartsData[i].once,
    //                 name: '参加1次',
    //                 itemStyle: {
    //                   normal: {
    //                     label: {
    //                       show: isShowLabel(data.chartsData[i].once)
    //                     },
    //                     labelLine: {
    //                       show: isShowLabel(data.chartsData[i].once),
    //                       length: 1
    //                     },
    //                     color: '#a9d4f3'
    //                   }
    //                 }
    //               },
    //               {
    //                 value: data.chartsData[i].twice,
    //                 name: '参加2次',
    //                 itemStyle: {
    //                   normal: {
    //                     label: {
    //                       show: isShowLabel(data.chartsData[i].twice)
    //                     },
    //                     labelLine: {
    //                       show: isShowLabel(data.chartsData[i].twice),
    //                       length: 1
    //                     },
    //                     color: '#fbd8bc'
    //                   }
    //                 }
    //               },
    //               {
    //                 value: data.chartsData[i].moreThanThreeTimes,
    //                 name: '3次或以上',
    //                 itemStyle: {
    //                   normal: {
    //                     label: {
    //                       show: isShowLabel(data.chartsData[i].moreThanThreeTimes)
    //                     },
    //                     labelLine: {
    //                       show: isShowLabel(data.chartsData[i].moreThanThreeTimes),
    //                       length: 1
    //                     },
    //                     color: '#f1a8ad'
    //                   }
    //                 }
    //               }
    //             ]
    //           });
    //         }
    //         return resData;
    //       };

    //       scope.$watch('data', function (data) {
    //         if (data) {

    //           var myChart = echarts.init(ele[0].querySelector('.st_pie'));

    //           var option = {
    //             title: {
    //               text: '每周活跃度统计',
    //               x: 'center'
    //             },
    //             tooltip: {
    //               trigger: 'item',
    //               formatter: "{a} <br/>{b} : {c} ({d}%)"
    //             },
    //             legend: {
    //               x: 'center',
    //               y: '15%',
    //               data: ['没有参加', '参加1次', '参加2次', '3次或以上']
    //             },
    //             toolbox: {
    //               show: false, // 暂且隐藏，因为每个饼图的标题不能在图表中显示
    //               feature: {
    //                 saveAsImage: {show: true}
    //               }
    //             },
    //             series: formatData(data)
    //           };

    //           myChart.setOption(option);

    //         }
    //       });


    //     }
    //   }
    // }])
});
