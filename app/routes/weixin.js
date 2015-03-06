'use strict';

var weixin = require('../controllers/weixin');
var xmlParser = require('../helpers/xmlParser');
module.exports = function(app) {
  app.get('/weixin',weixin.get);
  app.post('/weixin',xmlParser.xmlBodyParser,weixin.post);
}