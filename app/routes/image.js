'use strict';

var image = require('../controllers/image');

module.exports = function(app) {
  app.get(/([\w\/\-]*\.(png|jpg))\/([\d]*)\/([\d]*)/, image.resize);
};