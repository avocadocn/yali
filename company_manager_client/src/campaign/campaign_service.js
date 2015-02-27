define(['./campaign'], function (campaign) {
  return campaign.factory('campaignService', ['$http', 'apiBaseUrl', function ($http, apiBaseUrl) {
    return {
      getChartsData: function (cid, chart) {
        return $http.get(apiBaseUrl + '/companies/' + cid + '/charts', {
          params: {
            chart: chart
          }
        });
      },
      /**
       * 获取活动类型
       */
      getCampaignMolds: function (cid) {
        return $http.get(apiBaseUrl + '/campaigns/mold/company/' + cid);
      },
      /**
       * 发活动
       * @param  {[object]}   campaign 
       */
      sponsor: function (campaign, callback) {
        return $http.post(apiBaseUrl + '/campaigns', campaign)
        .success(function (data, status) {
          callback();
        })
        .error(function (data, status) {
          callback(data.msg);
        });
      },
      /**
       * [getCampaigns description]
       * @param  {string} cid
       * @param  {array} tids
       * @param  {string} result
       * @param  {array} attrs
       * @param  {string} sort
       * @param  {date} from
       * @param  {date} to
       * @param  {number} limit
       */
      getCampaigns: function (cid, tids, result, attrs, sort, to, from, page_id, limit) {
        var params = {};
        if(cid) params.cid = cid;
        if(tids) params.tids = tids;
        if(result) params.result = result;
        if(attrs) params.attrs = attrs;
        if(sort) params.sort = sort;
        if(from) params.from = from;
        if(to) params.to = to;
        if(page_id) params.page_id = page_id;
        if(limit) params.limit = limit;
        else params.limit = 20;
        return $http.get(apiBaseUrl + '/campaigns', {
          params: params
        });
      }
    };
  }]);
});