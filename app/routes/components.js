'use strict';

var componentCtrl = require('../controllers/components');

module.exports = function (app, passport) {

  app.get('/components/:componentName/:componentId', componentCtrl.getComponentData);

};