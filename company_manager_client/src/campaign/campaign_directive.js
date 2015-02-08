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
          scope.sponsorCampaign = function() {
            console.log(scope.data);
          }
        }
      }
    }]);
});


