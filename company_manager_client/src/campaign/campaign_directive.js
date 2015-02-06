define(['./campaign', 'echarts', 'echarts/chart/bar'], function (campaign, echarts) {
  // St: statistics
  return campaign.directive('campaignStBar', ['campaignService', function (campaignService) {
    return {

      restrict: 'E',
      scope: {
        data: '='
      },
      templateUrl: '/company/manager/templates/campaign/st_bar.html',
      link: function (scope, ele, attrs, ctrl) {

        // todo 假数据，先实现前端
        var data = {
          campaignCounts: ['3', '5', '7', '11', '1'],
          memberCounts: ['20', '30', '70', '200', '10']
        };

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

    };
  }]);

});