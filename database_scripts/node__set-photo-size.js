'use strict';

var mongoose = require('mongoose');
var db = 'mongodb://127.0.0.1/donler-beta';
mongoose.connect(db);

require('../app/models/photo.js'); // just init photo model
var Photo = mongoose.model('Photo');

var path = require('path');

var async = require('async');
var gm = require('gm');

var publicPath = path.join(__dirname, '../public');
var pageSize = 20; // 分页处理照片数据，一次只处理20个，防止服务器内存剧增
var nowResultLength = 0; // 当前在处理的记录数，如果小于页长，则处理完后不再处理，结束脚本
var totalCount = 0, successCount = 0, failedCount = 0;
var nextQueryId;

var doPhotoTask = function (photo, mapCallback) {
  try {
    gm(path.join(publicPath, photo.uri)).size(function (err, size) {
      if (err) {
        failedCount++;
        mapCallback();
        return;
      }
      photo.width = size.width;
      photo.height = size.height;
      photo.save(function (err) {
        if (err) {
          failedCount++;
        } else {
          successCount++;
        }
        mapCallback();
      });

    });
  } catch (e) {
    failedCount++;
    mapCallback();
  }
};

var doPageTask = function (doWhilstCallback) {

  var query = {};
  if (nextQueryId) {
    query._id = {
      $gt: nextQueryId
    };
  }

  Photo
    .find(query)
    .sort('_id')
    .limit(pageSize)
    .exec()
    .then(function (photos) {
      console.log('现在处理完的照片数:', totalCount);
      console.log('成功数:', successCount);
      console.log('失败数:', failedCount);
      console.log('即将处理', photos.length, '张照片。');
      nextQueryId = photos[photos.length - 1]._id;
      nowResultLength = photos.length;
      totalCount += photos.length;
      async.map(photos, doPhotoTask, function (err, results) {
        doWhilstCallback();
      });
    })
    .then(null, function (err) {
      console.log(err);
      console.log(err.stack);
    });

};

async.doWhilst(
  doPageTask,
  function () {
    return nowResultLength === pageSize;
  },
  function (err) {
    console.log('本次任务处理总数:', totalCount);
    console.log('成功数:', successCount);
    console.log('失败数:', failedCount);
    console.log('任务完成，退出。');
    process.exit(0);
  }
);


