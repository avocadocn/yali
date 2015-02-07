define(['./campaign', 'echarts', 'echarts/chart/bar'], function (campaign, echarts) {
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
