'use strict';

// User routes use users controller
var users = require('../controllers/users');
var authorization = require('./middlewares/authorization');
var express = require('express');
var config = require('../../config/config');
var photoBodyParser = express.bodyParser({
    uploadDir: config.root + '/temp_uploads/',
    limit: 1024 * 500 });

module.exports = function(app, passport) {

    app.get('/users/signin', users.signin);
    app.get('/users/signout', authorization.requiresLogin, users.signout);
    // Setting the local strategy route
    app.post('/users/session', passport.authenticate('user', {
        failureRedirect: '/users/signin',
        failureFlash: true
    }), users.loginSuccess);

    app.get('/users/home', authorization.requiresLogin, users.home);

    // Active produce
    app.get('/users/invite', users.invite);
    app.post('/users/dealActive', users.dealActive);
    app.get('/users/setProfile', users.setProfile);
    app.post('/users/dealSetProfile', users.dealSetProfile);
    app.get('/users/selectGroup', users.selectGroup);
    app.post('/users/dealSelectGroup', users.dealSelectGroup);
    app.get('/users/finishRegister', users.finishRegister);


    app.get('/users/getGroupMessages', authorization.requiresLogin, users.getGroupMessages);
    app.get('/users/getCampaigns', authorization.requiresLogin, users.getCampaigns);

    app.get('/users/getAccount', authorization.requiresLogin, users.getAccount);
    app.post('/users/saveAccount', authorization.requiresLogin, users.saveAccount);
    app.post('/users/changePassword', authorization.requiresLogin, users.changePassword);
    app.get('/users/editInfo', authorization.requiresLogin, users.editInfo);

    app.post('/users/joinCampaign', authorization.requiresLogin, users.joinCampaign);
    app.post('/users/quitCampaign', authorization.requiresLogin, users.quitCampaign);

    app.post('/users/vote', authorization.requiresLogin, users.vote);

    app.post('/users/tempPhoto', authorization.requiresLogin, photoBodyParser, users.tempPhoto);
    app.post('/users/savePhoto', authorization.requiresLogin, users.savePhoto);

    app.get('/users/editPhoto', authorization.requiresLogin, users.editPhoto);

    app.get('/userPhoto/:id/:width/:height', users.getPhoto);


    // for app
    app.post('/users/login', passport.authenticate('user', {
        failureRedirect: '/mobile/#app/login',
        failureFlash: true
    }), users.appLoginSuccess);

};

