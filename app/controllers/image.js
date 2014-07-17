'use strict';

// node system
var path = require('path'),
  fs = require('fs');

// 3rd
var gm = require('gm');

// custom
var config = require('../../config/config');


/**
 * 获取缩放图片，如果目标尺寸与原图不一致，则会选取原图中间最大区域裁剪
 *
 * @param {String} img_path 图片文件的绝对路径
 * @param {Number} width 目标宽度
 * @param {Number} height 目标高度
 * @param {Function} callback callback(err, handle), handle为gm对象
 */
var resizeWithCrop = exports.resizeWithCrop = function(img_path, width, height, callback) {

  var target_width = width;
  var target_height = height;

  try {
    gm(img_path)
      .size(function(err, value) {

        if (err) {
          return callback(err);
        }

        var ori_width = value.width;
        var ori_height = value.height;

        // tw/th - ow/oh => (tw*oh-th*ow)/(th*oh), 和0比较可忽略分母
        var compare_result = target_width * ori_height - target_height * ori_width;

        try {

          if (compare_result < 0) {

            var resize_width = ori_width * target_height / ori_height;
            var crop_x = (resize_width - target_width) / 2;

            var handle = gm(img_path)
              .resize(resize_width, target_height)
              .crop(target_width, target_height, crop_x, 0);

          } else {

            var resize_height = ori_height * target_width / ori_width;
            var crop_y = (resize_height - target_height) / 2;

            var handle = gm(img_path)
              .resize(target_width, resize_height)
              .crop(target_width, target_height, 0, crop_y);

          }

          callback(null, handle);

        } catch (e) {
          callback(e);
        }
      });
  } catch (e) {
    callback(e);
  }



};



exports.resize = function(req, res) {
  var uri_dir = req.params[0];
  var target_width = Number(req.params[2]);
  var target_height = Number(req.params[3]);

  if (isNaN(target_width) || isNaN(target_height)) {
    return res.send(400);
  }
  if (target_width < 0 || target_height < 0) {
    return res.send(400);
  }

  var file_path = path.join(config.root, 'public', uri_dir);

  if (!fs.existsSync(file_path)) {
    return res.send(404);
  }

  var sendImg = function(err, stdout, stderr) {
    if (err) {
      console.log(err);
      res.send(500);
    } else {
      stdout.pipe(res);
    }
  };

  resizeWithCrop(file_path, target_width, target_height, function(err, handle) {
    if (err) {
      console.log(err);
      return res.send(500);
    }
    handle.stream(sendImg);
  });

};