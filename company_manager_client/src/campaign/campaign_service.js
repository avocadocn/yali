define(['./campaign'], function (campaign) {
  return campaign.factory('campaignService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      getChartsData: function (cid) {
        return $http.get(apiBaseUrl + '/companies/' + cid + '/charts');
      }
    };
  }]);
});