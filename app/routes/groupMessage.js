'use strict';

var groupMessage = require('../controllers/groupMessage');
var express = require('express');
var config = require('../../config/config');

module.exports = function(app) {
  app.get('/groupMessage/:type', groupMessage.getMessage);
}