define(['angular'], function(angular) {
  return angular.module('AMap', []).service('mapSevice', ['$q', function($q) {
    var hasInit = false;
    var loading = false;
    var _AMap;
    var maxRetryTime = 5;

    var hasGetLocalCity = false;
    var searchRes;

    var initCity = function(AMap) {
      var deferred = $q.defer();

      //加载城市查询插件
      AMap.service(["AMap.CitySearch"], function() {
        //实例化城市查询类
        var citysearch = new AMap.CitySearch();
        //自动获取用户IP，返回当前城市
        citysearch.getLocalCity(function(status, result) {
          if (status === 'complete' && result.info === 'OK') {
            if (result && result.city && result.bounds) {
              hasGetLocalCity = true;
              searchRes = result;
              deferred.resolve(searchRes);
            }
          }
          else {
            deferred.reject(result);
          }
        });
      });

      return deferred.promise;
    };

    return {
      /**
       * 使用地图进行工作
       * @param  {Function} callback function(err, AMap)
       */
      work: function() {
        var deferred = $q.defer();
        if (!hasInit) {
          hasInit = true;
          loading = true;

          var initialize = function() {
            // 这其实并不是好的做法，无中生有一个全局变量
            // 如果这个初始化的回调函数提供一个AMap参数就好多了
            _AMap = AMap;
            loading = false;
            deferred.resolve(AMap);
          };

          window.initialize = initialize;
          var script = document.createElement('script');
          script.src = 'http://webapi.amap.com/maps?v=1.3&key=077eff0a89079f77e2893d6735c2f044&callback=initialize';
          document.body.appendChild(script);
        }
        else {
          if (loading) {
            var retryCount = 0;

            function retry() {
              if (loading) {
                if (retryCount < maxRetryTime) {
                  setTimeout(function() {
                    retry();
                    retryCount++;
                  }, 500);
                }
                else {
                  deferred.reject(new Error('加载地图超时'));
                }
              }
              else {
                deferred.resolve(_AMap);
              }
            }
            retry();
          }
          else {
            deferred.resolve(_AMap);
          }
        }

        return deferred.promise;
      },

      /**
       * 获取当前城市信息
       */
      getLocalCity: function() {
        return $q(function(resolve, reject) {
          if (hasGetLocalCity) {
            resolve(searchRes);
          }
          else {
            initCity(_AMap).then(resolve, reject);
          }
        });
      }

    };
  }]).directive('mapSearch', ['mapSevice', '$q', function(mapSevice, $q) {

    var link = function(scope, ele, attrs, ctrl) {
      var controller = {};
      var map;

      /**
       * 搜索城市，在页面元素中显示，并且在回调中返回搜索结果
       * @param  {String}   locationName 位置名称
       * @return {Promise}
       */
      controller.search = function(locationName) {
        var deferred = $q.defer();
        if (!map) {
          mapSevice.work().then(function(AMap) {
            var mapEle = ele[0];
            if (scope.width) {
              mapEle.style.width = scope.width;
            }
            if (scope.height) {
              mapEle.style.height = scope.height;
            }
            map = new AMap.Map(mapEle);
          }, deferred.reject);
        }

        mapSevice.work().then(function(AMap) {
          AMap.service(["AMap.PlaceSearch"], function() {
            var placeSearch;
            mapSevice.getLocalCity().then(function(res) {
              // 搜索城市成功
              placeSearch = new AMap.PlaceSearch({city: res.city});
              doSearch(placeSearch);
            }, function(err) {
              placeSearch = new AMap.PlaceSearch();
              doSearch(placeSearch);
            });

            function doSearch(placeSearch) {
              placeSearch.search(locationName, function(status, result) {
                switch(status) {
                case 'complete':
                  deferred.resolve(result);
                  break;
                case 'error':
                  deferred.reject(result);
                  break;
                case 'no_data':
                  deferred.resolve(null);
                  break;
                default:
                  deferred.resolve(null);
                }
              });
            }
          });
        }, deferred.reject);

        return deferred.promise;
      };

      scope.$watch('ctrl', function(ctrl) {
        if (ctrl) {
          for (var key in controller) {
            ctrl[key] = controller[key];
          }
        }
      });



    };

    return {
      restrict: 'E',
      replace: true,
      template: '<div class="dl_map"></div>',
      scope: {
        ctrl: '=',
        width: '@',
        height: '@'
      },
      link: link
    };
  }]);
});


