'use strict';

var FileHelper = {};

(function(){


  // 获取input=file元素的文件路径，通过callback(path)获取
  FileHelper.getFilePath = function(input, callback) {
    var file = input.files[0];
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(e) {
      callback(this.result);
    };
  };


}());