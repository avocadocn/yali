'use strict';

/**
 * Module dependencies.
 */
var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    passport = require('passport'),
    mkdirp = require('mkdirp');
/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

// Load configurations
// Set the node environment variable if not set before
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Initializing system variables
var config = require('./config/config'),
    mongoose = require('mongoose');
var config = require('./config/config');


var app = express();
// Express settings
require('./config/express')(app, passport, db);

// Bootstrap db connection
var db = mongoose.connect(config.db);

// Bootstrap models
var models_path = __dirname + '/app/models';
var walk = function(path) {
    fs.readdirSync(path).forEach(function(file) {
        var newPath = path + '/' + file;
        var stat = fs.statSync(newPath);
        if (stat.isFile()) {
            if (/(.*)\.(js$|coffee$)/.test(file)) {
                require(newPath);
            }
        } else if (stat.isDirectory()) {
            walk(newPath);
        }
    });
};
walk(models_path);

// Bootstrap routes
var routes_path = __dirname + '/app/routes';
var walk = function(path) {
    fs.readdirSync(path).forEach(function(file) {
        var newPath = path + '/' + file;
        var stat = fs.statSync(newPath);
        if (stat.isFile()) {
            if (/(.*)\.(js$|coffee$)/.test(file)) {
                require(newPath)(app, passport);
            }
        // We skip the app/routes/middlewares directory as it is meant to be
        // used and shared by routes as further middlewares and is not a
        // route by itself
        } else if (stat.isDirectory() && file !== 'middlewares') {
            walk(newPath);
        }
    });
};
walk(routes_path);

// Start the app by listening on <port>
var port = process.env.PORT || config.port;
console.log('Express app started on port ' + port);
app.listen(port);

// Expose app
exports = module.exports = app;

// 创建被git排除的目录
mkdirp.sync(path.join(__dirname, 'temp_uploads/'));
mkdirp.sync(path.join(__dirname, 'public/img/user/photo/'));
mkdirp.sync(path.join(__dirname, 'public/img/group/logo/'));
mkdirp.sync(path.join(__dirname, 'public/img/group/family/'));
mkdirp.sync(path.join(__dirname, 'public/img/company/logo/'));
mkdirp.sync(path.join(__dirname, 'public/img/photo_album/'));


