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
        var data = {};

        var myChart = echarts.init(ele[0].querySelector('.st_bar'));

        var option = {
          title: {
            text: '公司小队活动',
            subtext: '活动次数/人次'
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
              mark: {show: true},
              dataView: {show: true, readOnly: false},
              magicType: {show: true, type: ['line', 'bar']},
              restore: {show: true},
              saveAsImage: {show: true}
            }
          },
          calculable: true,
          xAxis: [
            {
              type: 'category',
              data: ['1月', '2月', '3月', '4月', '5月']
            }
          ],
          yAxis: [
            {
              type: 'value'
            }
          ],
          series: [
            {
              name: '活动次数',
              type: 'bar',
              data: [2.0, 4.9, 7.0, 23.2, 25.6]
            },
            {
              name: '活动人次',
              type: 'bar',
              data: [2.6, 5.9, 9.0, 26.4, 28.7]
            }
          ]
        };

        // 为echarts对象加载数据
        myChart.setOption(option);

      }

    };
  }]);

});