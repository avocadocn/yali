'use strict';

var image = require('../controllers/image');

module.exports = function(app) {
  app.get(/([\w\/\-]*\.(png|jpg|jpeg|bmp|gif))\/([\d]*)\/([\d]*)/, image.resize);
};