'use strict';

// User routes use users controller
var users = require('../controllers/users');
var authorization = require('./middlewares/authorization');
var utils = require('./middlewares/utils');
var config = require('../../config/config');


module.exports = function(app, passport) {

    app.get('/users/signin', users.signin);
    app.get('/users/signin/:status', users.signin);
    app.get('/users/signout', users.signout);
    app.get('/users/forgetPwd', users.renderForgetPwd);
    app.post('/users/forgetPassword', users.forgetPwd);
    app.get('/users/resetPwd', users.renderResetPwd);
    app.post('/users/resetPassword', users.resetPwd);
    // Setting the local strategy route
    app.post('/users/session', passport.authenticate('user', {
        failureRedirect: '/users/signin/failure',
        failureFlash: true
    }),  users.loginSuccess);

    app.get('/users/home', utils.nocache, authorization.userAuthorize, users.home);
    app.get('/users/home/:userId', utils.nocache, authorization.userAuthorize, users.home);
    // Active produce
    app.post('/users/mailCheck', users.mailCheck);
    app.get('/users/invite', users.invite);
    app.post('/users/dealActive', users.dealActive);
    app.get('/users/setProfile', users.setProfile);
    app.post('/users/dealSetProfile', users.dealSetProfile);
    app.get('/users/selectGroup', users.selectGroup);
    app.post('/users/dealSelectGroup', users.dealSelectGroup);
    app.get('/users/finishRegister', users.finishRegister);

    app.get('/users/campaign', authorization.userAuthorize, users.renderCampaigns);
    app.get('/users/getCampaigns/:userId', authorization.userAuthorize, users.getCampaigns);
    app.get('/users/getScheduleList/:userId', authorization.userAuthorize,users.renderScheduleList);

    app.get('/users/change_password/:userId',authorization.userAuthorize, users.renderChangePassword);
    app.get('/users/getAccount/:userId', authorization.userAuthorize, users.getAccount);
    app.post('/users/saveAccount/:userId', authorization.userAuthorize, users.saveAccount);
    app.post('/users/changePassword/:userId', authorization.userAuthorize, users.changePassword);
    app.get('/users/editInfo', users.editInfo);
    app.get('/users/timeline/:userId', authorization.userAuthorize, users.timeLine);
    //加入、退出小队
    app.post('/users/joinGroup', users.joinGroup);
    app.post('/users/quitGroup', users.quitGroup);




    app.get('/users/editPhoto/:userId', authorization.userAuthorize, users.editPhoto);


    // for app
    app.post('/users/login', passport.authenticate('user'), authorization.userAuthorize, users.appLoginSuccess);
    app.get('/users/logout', users.appLogout);

    app.get('/users/campaigns', authorization.userAuthorize, users.getCampaignsForApp);
    app.get('/users/schedules', authorization.userAuthorize, users.getSchedules);
    app.get('/users/groups', authorization.userAuthorize, users.getGroups);

    app.get('/users/getTimelineForApp', authorization.userAuthorize, users.getTimelineForApp);

    app.post('/users/info', authorization.userAuthorize, users.getUserInfo);
    app.get('/users/briefInfo/:userId', users.getBriefInfo);
    app.param('userId', users.user);

};

