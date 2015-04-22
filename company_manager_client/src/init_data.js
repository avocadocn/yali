define(['angular'], function(angular) {

  var initInjector = angular.injector(['ng']);
  var $http = initInjector.get('$http');
  var $q = initInjector.get('$q');

  // getCompanyInfoPromise, getHasLeaderPromise
  /**
   * 获取初始化数据，并使用app.value保存(如果有app参数)
   * @example
   *   var promisesObj = {
   *     company: getCompanyInfoPromise,
   *     hasLeader: getHasLeaderPromise
   *   };
   *   get(promisesObj).then(function(initData) {
   *     initData.should.equal({
   *       company: getCompanyInfoPromiseData,
   *       hasLeader: getHasLeaderPromiseData
   *     });
   *   });
   * @param {Object} promisesObj 获取数据的promises
   * @return {Promise} 返回一个promise，可以取得获取到的数据
   */
  var get = function(promisesObj) {
    var deferred = $q.defer();
    var promiseList = [];
    var keys = [];
    for (var key in promisesObj) {
      keys.push(key);
      promiseList.push(promisesObj[key]);
    }
    $q.all(promiseList).then(function(results) {
      var initData = {};
      for (var i = 0, len = results.length; i < len; i++) {
        var key = keys[i];
        initData[key] = results[i].data;
      }
      deferred.resolve(initData);
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  return {
    get: get
  };

});