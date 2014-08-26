'use strict';

var image = require('../controllers/image');

module.exports = function(app) {
  app.get(/^([\w\/\-]*\.(png|jpg|jpeg|bmp|gif))\/([\d]*)\/([\d]*)$/, image.resizeWithCrop);

  app.get(/^([\w\/\-]*\.(png|jpg|jpeg|bmp|gif))\/resize\/([\d]*)\/([\d]*)$/, image.resizeWithoutCrop);

  app.get(/^([\w\/\-]*\.(png|jpg|jpeg|bmp|gif))\/resize\/([\d]*)\/([\d]*)\/(stretch)$/, image.resizeWithoutCrop);
};