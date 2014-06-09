'use strict';

var logo = require('../controllers/logo');
var authorization = require('./middlewares/authorization');
var express = require('express');
var config = require('../../config/config');
var bodyParser = express.bodyParser({
    uploadDir: config.root + '/temp_uploads/',
    limit: 1024 * 1024 * 5 });

module.exports = function(app) {

  app.post('/logo/update', authorization.requiresLogin, bodyParser, logo.updateLogo);

  app.get('/logo/:target/:id/:width/:height', logo.readLogo);

};