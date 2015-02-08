define(['./campaign', 'echarts', 'echarts/chart/bar', 'echarts/chart/pie'], function (campaign, echarts) {
  // St: statistics
  return campaign.directive('campaignStBar', [function () {
    return {

      restrict: 'E',
      scope: {
        data: '='
      },
      templateUrl: '/company/manager/templates/campaign/st_bar.html',
      link: function (scope, ele, attrs, ctrl) {

        scope.$watch('data', function (data) {
          if (data) {
            var myChart = echarts.init(ele[0].querySelector('.st_bar'));

            var option = {
              title: {
                text: '公司小队活动'
              },
              tooltip: {
                trigger: 'axis'
              },
              legend: {
                data: ['活动次数', '活动人次']
              },
              toolbox: {
                show: true,
                feature: {
                  saveAsImage: {show: true}
                }
              },
              xAxis: [
                {
                  name: '周',
                  type: 'category',
                  data: ['1', '2', '3', '上周', '本周']
                }
              ],
              yAxis: [
                {
                  name: '活动次数',
                  type: 'value',
                  position: 'left'
                },
                {
                  name: '活动人次',
                  type: 'value',
                  position: 'right'
                }
              ],
              series: [
                {
                  name: '活动次数',
                  type: 'bar',
                  data: data.campaignCounts
                },
                {
                  name: '活动人次',
                  type: 'bar',
                  yAxisIndex: 1,
                  data: data.memberCounts
                }
              ]
            };

            // 为echarts对象加载数据
            myChart.setOption(option);
          }
        });

      }

    };
  }])
    .directive('campaignStPie', [function () {
      return {
        restrict: 'E',
        scope: {
          data: '='
        },
        templateUrl: '/company/manager/templates/campaign/st_pie.html',
        link: function (scope, ele, attrs, ctrl) {

          var formatData = function (data) {
            var resData = [];

            var max = Math.min(5, data.length);
            for (var i = 0; i < max; i++) {
              resData.push({
                name: '人数统计',
                type: 'pie',
                radius: '30%',
                center: [(10 + 20 * i) + '%', '60%'],
                data: [
                  {value: data[i].zero, name: '没有参加'},
                  {value: data[i].once, name: '参加1次'},
                  {value: data[i].twice, name: '参加2次'},
                  {value: data[i].moreThanThreeTimes, name: '3次或以上'}
                ]
              });
            }
            return resData;
          };

          scope.$watch('data', function (data) {
            if (data) {

              var myChart = echarts.init(ele[0].querySelector('.st_pie'));

              var option = {
                title: {
                  text: '每周活跃度统计',
                  x: 'center'
                },
                tooltip: {
                  trigger: 'item',
                  formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                  x: 'center',
                  y: '20%',
                  data: ['没有参加', '参加1次', '参加2次', '3次或以上']
                },
                toolbox: {
                  show: true,
                  feature: {
                    saveAsImage: {show: true}
                  }
                },
                series: formatData(data)
              };

              myChart.setOption(option);

            }
          });


        }
      }
    }])
    .directive('contenteditable', [function() {
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
    .directive('campaignStPieRing', [function () {
      return {
        restrict: 'E',
        scope: {
          data: '=',
          text: '='
        },
        templateUrl: '/company/manager/templates/campaign/st_pie_ring.html',
        link: function (scope, ele, attrs, ctrl) {

          var dataStyle = {
            normal: {
              label: {show: false},
              labelLine: {show: false}
            }
          };

          var placeHolderStyle = {
            normal: {
              color: 'rgba(0,0,0,0)',
              label: {show: false},
              labelLine: {show: false}
            },
            emphasis: {
              color: 'rgba(0,0,0,0)'
            }
          };

          var formatData = function (data) {
            var legendData = ['人:没有参加', '人:参加1次', '人:参加2次', '人:3次或以上'];
            var seriesLabel = [
              '人没有参加活动',
              '人参加1次活动',
              '人参加2次活动',
              '人参加3次或3次以上的活动'
            ];
            var series = [];

            var oriDataList = [data.zero, data.once, data.twice, data.moreThanThreeTimes];
            var sum = 0;
            oriDataList.forEach(function (item) {
              sum += item;
            });
            var rages = oriDataList.map(function (item) {
              return Math.round(item / sum * 100);
            });


            for (var i = 0; i < legendData.length; i++) {
              legendData[i] = oriDataList[i] + legendData[i];
              series.push({
                name: oriDataList[i] + seriesLabel[i],
                type: 'pie',
                clockWise: false,
                radius: [70 - 15 * i, 70 - 15 * (i + 1)],
                itemStyle: dataStyle,
                data: [
                  {
                    value: rages[i],
                    name: legendData[i]
                  },
                  {
                    value: 100 - rages[i],
                    itemStyle: placeHolderStyle
                  }
                ]
              });
            }

            return {
              legendData: legendData,
              series: series
            };
          };

          scope.$watch('data', function (data) {
            if (data) {

              var result = formatData(data);

              var option = {
                title: {
                  text: scope.text,
                  x: 'center',
                  y: 'center',
                  itemGap: 20,
                  textStyle: {
                    color: 'rgba(30,144,255,0.8)',
                    fontFamily: '微软雅黑',
                    fontSize: 18,
                    fontWeight: 'bolder'
                  }
                },
                tooltip: {
                  show: true,
                  position: [10, 40],
                  formatter: "{a}"
                },
                legend: {
                  orient: 'vertical',
                  x: ele[0].querySelector('.st_pie_ring').offsetWidth / 2,
                  y: 80,
                  itemGap: 1,
                  data: result.legendData
                },
                series: result.series
              };

              var myChart = echarts.init(ele[0].querySelector('.st_pie_ring'));
              myChart.setOption(option);


            }
          });
        }
      };
    }])
    .directive('sponsorCampaign', ['campaignService', function (campaignService) {
      return {
        restrict: 'E',
        scope: {
          data: '='
        },
        templateUrl: '/company/manager/templates/campaign/sponsor.html',
        link: function (scope, ele, attrs, ctrl) {
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
          scope.showMap = function () {

          }
          scope.sponsorCampaign = function () {
            // console.log(scope.data);
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
        }
      }
    }]);
});


