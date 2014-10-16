'use strict';

var componentCtrl = require('../controllers/components');

module.exports = function (app, passport) {

  app.get('/components/:componentName/id/:componentId', componentCtrl.getComponentData);

  app.get('/components/:directiveName/template', componentCtrl.renderTemplate);


  // 比分组件
  app.post('/components/ScoreBoard/id/:componentId/setScore', componentCtrl.ScoreBoard.setScore);
  app.post('/components/ScoreBoard/id/:componentId/confirmScore', componentCtrl.ScoreBoard.confirmScore);

};