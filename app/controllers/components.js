'use strict';

var mongoose = require('mongoose');

exports.getComponentData = function (req, res, next) {

  // to do: 验证请求参数的合法性

  // 获取组件数据
  mongoose.model(req.params.componentName).findById(req.params.componentId).exec()
    .then(function (component) {
      if (!component) {
        return res.send(404);
      }
      component.getData(function (data) {
        res.send({ result: 1, componentData: data });
      });
    })
    .then(null, function (err) {
      next(err);
    });

};


