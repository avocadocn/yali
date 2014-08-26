'use strict';


var push = require('../controllers/push');
module.exports = function(app, passport) {
  app.get('/test/push/:platform', push.pushTest);
};