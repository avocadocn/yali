define(['./campaign'], function (campaign) {
  return campaign.factory('campaignService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      getChartsData: function (cid, chart) {
        return $http.get(apiBaseUrl + '/companies/' + cid + '/charts', {
          params: {
            chart: chart
          }
        });
      }
    };
  }]);
});