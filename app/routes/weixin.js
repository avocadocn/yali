'use strict';

var weixin = require('../controllers/weixin');
module.exports = function(app) {
  app.get('/weixin',weixin.index);
}