'use strict';

var componentCtrl = require('../controllers/components');

module.exports = function (app, passport) {

  app.get('/components/:componentName/id/:componentId', componentCtrl.getComponentData);

  app.get('/components/:directiveName/template', componentCtrl.renderTemplate);

};