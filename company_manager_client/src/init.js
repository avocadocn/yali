define(['angular', 'app', 'init_data', 'routes'], function(angular, app, initData) {

  var initInjector = angular.injector(['ng']);
  var $http = initInjector.get('$http');
  var $q = initInjector.get('$q');

  var apiBaseUrl = 'http://' + window.location.hostname + ':3002';
  app.constant('apiBaseUrl', apiBaseUrl);

  var token = localStorage.getItem('x-access-token');
  var cid = localStorage.getItem('cid');

  if (cid && token) {
    $http.defaults.headers.common['x-access-token'] = token;
    // 获取公司数据
    var getCompanyInfoPromise = $http.get(apiBaseUrl + '/companies/' + cid);
    var getHasLeaderPromise = $http.get(apiBaseUrl + '/companies/' + cid + '/hasLeader');

    initData.get({
      company: getCompanyInfoPromise,
      hasLeader: getHasLeaderPromise
    }).then(function(initData) {
      app.value('initData', {
        company: initData.company,
        hasLeader: initData.hasLeader.hasLeader
      });
      angular.bootstrap(document, ['app']);
    }).then(null, function(res) {
      if (res.status === 401) {
        app.value('initData', {
          company: null,
          hasLeader: null
        });
        angular.bootstrap(document, ['app']);
        location.pathname = '/company/manager/login';
      }
      else {
        alert('获取公司数据失败，请刷新页面重试');
      }
    });

  }
  else {
    app.value('initData', {
      company: null,
      hasLeader: null
    });
    angular.bootstrap(document, ['app']);
  }
});