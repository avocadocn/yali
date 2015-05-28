'use strict';

angular.module('donler', ['ngRoute','ui.bootstrap','pascalprecht.translate','wu.masonry', 'angular-carousel', 'donler.components']);


var app = angular.module('donler');
app.directive('match', ['$parse', function ($parse) {
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl) {
      scope.$watch(function() {
        return $parse(attrs.match)(scope) === ctrl.$modelValue;
      }, function(currentValue) {
        ctrl.$setValidity('mismatch', currentValue);
      });
    }
  };
}]);
app.directive('ngMin', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elem, attr, ctrl) {
            scope.$watch('member_max', function(){
                if(scope.member_min!=undefined){
                    ctrl.$setViewValue(ctrl.$viewValue);
                }
            });
            var minValidator = function(value) {
              var min = scope.$eval(attr.ngMin) || 0;
              if (value < min) {
                ctrl.$setValidity('ngMin', false);
                return value;
              } else {
                ctrl.$setValidity('ngMin', true);
                return value;
              }
            };

            ctrl.$parsers.push(minValidator);
            ctrl.$formatters.push(minValidator);
        }
    };
});

app.directive('ngMax', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elem, attr, ctrl) {
            scope.$watch('member_min', function(){
                if(scope.member_max!=undefined){
                    ctrl.$setViewValue(ctrl.$viewValue);
                }
            });
            var maxValidator = function(value) {
              var max = scope.$eval(attr.ngMax) || Infinity;
              if (value > max) {
                ctrl.$setValidity('ngMax', false);
                return value;
              } else {
                ctrl.$setValidity('ngMax', true);
                return value;
              }
            };

            ctrl.$parsers.push(maxValidator);
            ctrl.$formatters.push(maxValidator);
        }
    };
});
//弹出信息卡片的控制器
app.directive('bsPopover',function() {
  return{
    controller:['$http','$scope',function($http, $scope){
      $scope.showUserCard = function(member_id,pop_id) {
        if($scope.member_id===member_id)
          $('#pop'+pop_id).dl_card({content:$scope.htmlcontent});
        else{
          $scope.member_id = member_id;
          $http.get('/users/briefInfo/'+member_id).success(function(data, status){
            $scope.htmlcontent=data;
            $('#pop'+pop_id).dl_card({content:data});
          });
        }
      };
      $scope.showGroupCard = function(group_id,pop_id) {
        if($scope.group_id===group_id)
          $('#pop'+pop_id).dl_card({content:$scope.htmlcontent});
        else{
          $scope.group_id = group_id;
          $http.get('/group/briefInfo/'+group_id).success(function(data, status){
            $('#pop'+pop_id).dl_card({content:data});
            $scope.htmlcontent = data;
          });
        }
      };
    }],
  };
});
app.directive('contenteditable',function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attr, ngModel) {
      var read;
      if (!ngModel) {
        return;
      }
      ngModel.$render = function() {
        return element.html(ngModel.$viewValue);
      };
      var changeBind = function(e){
        var htmlContent = $.trim(element.html());
        if (ngModel.$viewValue !== htmlContent ) {
          if(htmlContent.replace(/<\/?[^>]*>/g, '').replace(/[\u4e00-\u9fa5]/g, '**').length>attr.mixMaxlength){
            ngModel.$setValidity('mixlength', false);
          }
          else{
            ngModel.$setValidity('mixlength', true);
          }
          return scope.$apply(read);
        }
      }
      var clearStyle = function(e){
        var before = e.currentTarget.innerHTML;
        setTimeout(function(){
            // get content after paste by a 100ms delay
            var after = e.currentTarget.innerHTML;
            // find the start and end position where the two differ
            var pos1 = -1;
            var pos2 = -1;
            for (var i=0; i<after.length; i++) {
                if (pos1 == -1 && before.substr(i, 1) != after.substr(i, 1)) pos1 = i;
                if (pos2 == -1 && before.substr(before.length-i-1, 1) != after.substr(after.length-i-1, 1)) pos2 = i;
            }
            // the difference = pasted string with HTML:
            var pasted = after.substr(pos1, after.length-pos2-pos1);
            // strip the tags: 
            var replace = pasted.replace(/style\s*=(['\"\s]?)[^\1]*?\1/gi,'').replace(/class\s*=(['\"\s]?)[^\1]*?\1/gi,'');
            // build clean content:
            var replaced = after.substr(0, pos1)+replace+after.substr(pos1+pasted.length);
            // replace the HTML mess with the plain content
            //console.log(replaced);
            e.currentTarget.innerHTML = replaced;
            changeBind(e);
        }, 100);
      }
      element.bind('focus', function() {
        element.bind('input',changeBind);
        element.bind('keydown',changeBind);
        element.bind('paste', clearStyle);
      });
      element.bind('blur', function(e) {
        element.unbind('input',changeBind);
        element.unbind('keydown',changeBind);
        element.unbind('paste', clearStyle);
        changeBind(e);
      });
      return read = function() {
        return ngModel.$setViewValue($.trim(element.html()));
      };
    }
  };
});
app.directive('mixMaxlength', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, ele, attrs, ctrl) {
      var length = parseInt(attrs['mixMaxlength']) || 10;
      scope.$watch(attrs.ngModel, function(newValue, oldValue) {
        if (newValue && newValue.replace(/[\u4e00-\u9fa5]/g, '**').length > length) {
          ctrl.$setValidity('mixlength', false);
          ele[0].onkeydown = function (evt) {
            switch (evt.keyCode) {
            case 8: // backspace
            case 46: // delete
              break;
            default:
              evt.preventDefault();
              break;
            }
          };
        } else {
          ctrl.$setValidity('mixlength', true);
          ele[0].onkeydown = null;
        }
      })
    }
  }
});
app.directive('bootstrapTagsinput', [function() {

  function getItemProperty(scope, property) {
    if (!property)
      return undefined;

    if (angular.isFunction(scope.$parent[property]))
      return scope.$parent[property];

    return function(item) {
      return item[property];
    };
  }

  return {
    restrict: 'EA',
    scope: {
      model: '=ngModel'
    },
    template: '<select multiple></select>',
    replace: false,
    link: function(scope, element, attrs) {
      $(function() {
        if (!angular.isArray(scope.model))
          scope.model = [];

        var select = $('select', element);
        var typeaheadSourceArray = attrs.typeaheadSource ? attrs.typeaheadSource.split('.') : null;
        var typeaheadSource = typeaheadSourceArray ?
            (typeaheadSourceArray.length > 1 ?
                scope.$parent[typeaheadSourceArray[0]][typeaheadSourceArray[1]]
                : scope.$parent[typeaheadSourceArray[0]])
            : null;

        select.tagsinput(scope.$parent[attrs.options || ''] || {
          typeahead : {
            source   : angular.isFunction(typeaheadSource) ? typeaheadSource : null
          },
          itemValue: getItemProperty(scope, attrs.itemvalue),
          itemText : getItemProperty(scope, attrs.itemtext),
          confirmKeys : getItemProperty(scope, attrs.confirmkeys) ? JSON.parse(attrs.confirmkeys) : [13],
          tagClass : angular.isFunction(scope.$parent[attrs.tagclass]) ? scope.$parent[attrs.tagclass] : function(item) { return attrs.tagclass; }
        });

        for (var i = 0; i < scope.model.length; i++) {
          select.tagsinput('add', scope.model[i]);
        }

        select.on('itemAdded', function(event) {
          if (scope.model.indexOf(event.item) === -1)
            scope.model.push(event.item);
        });

        select.on('itemRemoved', function(event) {
          var idx = scope.model.indexOf(event.item);
          if (idx !== -1)
            scope.model.splice(idx, 1);
        });

        // create a shallow copy of model's current state, needed to determine
        // diff when model changes
        var prev = scope.model.slice();
        scope.$watch("model", function() {
          var added = scope.model.filter(function(i) {return prev.indexOf(i) === -1;}),
              removed = prev.filter(function(i) {return scope.model.indexOf(i) === -1;}),
              i;

          prev = scope.model.slice();

          // Remove tags no longer in binded model
          for (i = 0; i < removed.length; i++) {
            select.tagsinput('remove', removed[i]);
          }

          // Refresh remaining tags
          select.tagsinput('refresh');

          // Add new items in model as tags
          for (i = 0; i < added.length; i++) {
            select.tagsinput('add', added[i]);
          }
        }, true);
      });
    }
  };
}]);

app.directive('ngThumb', ['$window',
  function($window) {
    var helper = {
      support: !!($window.FileReader && $window.CanvasRenderingContext2D),
      isFile: function(item) {
        return angular.isObject(item) && item instanceof $window.File;
      },
      isImage: function(file) {
        var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    };

    return {
      restrict: 'A',
      template: '<canvas/>',
      link: function(scope, element, attributes) {
        if (!helper.support) return;

        var params = scope.$eval(attributes.ngThumb);

        if (!helper.isFile(params.file)) return;
        if (!helper.isImage(params.file)) return;

        var canvas = element.find('canvas');
        var reader = new FileReader();

        reader.onload = onLoadFile;
        reader.readAsDataURL(params.file);

        function onLoadFile(event) {
          var img = new Image();
          img.onload = onLoadImage;
          img.src = event.target.result;
        }

        function onLoadImage() {
          var width = params.width || this.width / this.height * params.height;
          var height = params.height || this.height / this.width * params.width;
          canvas.attr({
            width: width,
            height: height
          });
          canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
        }
      }
    };
  }
]);

app.run(['$rootScope', 'anchorSmoothScroll', '$http', function ($rootScope,anchorSmoothScroll,$http) {
    $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    alertify.set({
      buttonFocus: "none",
      labels: {
        ok: '确认',
        cancel: '取消'
      }
    });
    $rootScope.bakckTop = function(){
      anchorSmoothScroll.scrollTo(0);
    }
    $rootScope.shortTrim = function(value){
      //中文
      if(escape(value).indexOf("%u")>=0){
        if(value.length>6){
          return value.substr(0,6)+'...';
        }else{
          return value;
        }
      //非中文
      }else{
        if(value.length>15){
          return value.substr(0,15)+'...';
        }else{
          return value;
        }
      }
    }
}]);

app.filter('dateView', function() {
  return function(input) {
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    var date = new Date(input);
    var intervalMilli = date.getTime() - today.getTime();
    var xcts = Math.floor(intervalMilli / (24 * 60 * 60 * 1000));
    var nowTime = (date.getHours()<10?('0'+date.getHours()):date.getHours())+':'+(date.getMinutes()<10?('0'+date.getMinutes()):date.getMinutes());
    // -2:前天 -1：昨天 0：今天 1：明天 2：后天， out：显示日期
    switch(xcts){
      case -2:
      return '前天'+nowTime;
      break;
      case -1:
      return '昨天'+nowTime;
      break;
      case 0:
      return '今天'+nowTime;
      break;
      case 1:
      return '明天'+nowTime;
      break;
      case 2:
      return '后天'+nowTime;
      break;
      default:
      return input;
    }
  }
});
app.filter('day', function() {
  return function(input) {
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    var date = new Date(input);
    var intervalMilli = date.getTime() - today.getTime();
    var xcts = Math.floor(intervalMilli / (24 * 60 * 60 * 1000));
    // -2:前天 -1：昨天 0：今天 1：明天 2：后天， out：显示日期
    switch(xcts){
    // case -2:
    //   return '前天';
    case -1:
      return '昨天';
    case 0:
      return '今天';
    case 1:
      return '明天';
    // case 2:
    //   return '后天';
    default:
      return (date.getMonth() + 1) + '-' + date.getDate();
    }
  }
});
app.filter('week', function() {
  return function(input) {
    // input will be ginger in the usage below
    switch (new Date(input).getDay()) {
      case 0:
        input = '周日';
        break;
      case 1:
        input = '周一';
        break;
      case 2:
        input = '周二';
        break;
      case 3:
        input = '周三';
        break;
      case 4:
        input = '周四';
        break;
      case 5:
        input = '周五';
        break;
      case 6:
        input = '周六';
        break;
      default:
        input = '';
    }
    return input;
  }
});
app.filter('monthPrefixZero', function () {
  return function (input) {
    if (input < 10) {
      return '0' + input;
    } else {
      return input;
    }
  };
});