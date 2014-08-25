'use strict';

// node system
var path = require('path'),
  fs = require('fs');

// 3rd
var gm = require('gm');

// custom
var config = require('../../config/config');


exports.resizeWithCrop = function(req, res) {
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
    }
    else {
      stdout.pipe(res);
    }
  };

  gm(file_path)
  .size(function(err, value) {
    var ori_width = value.width;
    var ori_height = value.height;

    // tw/th - ow/oh => (tw*oh-th*ow)/(th*oh), 和0比较可忽略分母
    var compare_result = target_width * ori_height - target_height * ori_width;

    if (compare_result < 0) {

      var resize_width = ori_width * target_height / ori_height;
      var crop_x = (resize_width - target_width) / 2;

      gm(file_path)
      .resize(resize_width, target_height)
      .crop(target_width, target_height, crop_x, 0)
      .stream(sendImg);

    } else {

      var resize_height = ori_height * target_width / ori_width;
      var crop_y = (resize_height - target_height) / 2;

      gm(file_path)
      .resize(target_width, resize_height)
      .crop(target_width, target_height, 0, crop_y)
      .stream(sendImg);

    }

  });


};

exports.resizeWithoutCrop = function(req, res) {
  var uri_dir = req.params[0];
  var target_width = Number(req.params[2]);
  var target_height = Number(req.params[3]);
  var stretch = req.params[4];

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
    }
    else {
      stdout.pipe(res);
    }
  };

  if (stretch) {
    gm(file_path)
    .resize(target_width, target_height)
    .stream(sendImg);
  } else {
    gm(file_path)
    .size(function(err, value) {
      var ori_width = value.width;
      var ori_height = value.height;

      // tw/th - ow/oh => (tw*oh-th*ow)/(th*oh), 和0比较可忽略分母
      var compare_result = target_width * ori_height - target_height * ori_width;

      if (compare_result < 0) {

        var resize_width = target_width;

        gm(file_path)
        .resize(resize_width)
        .stream(sendImg);

      } else {

        var resize_height = target_height;

        gm(file_path)
        .resize(null, resize_height)
        .stream(sendImg);

      }

    });
  }


};

