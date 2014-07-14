'use strict';

// User routes use users controller
var users = require('../controllers/users');
var authorization = require('./middlewares/authorization');
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
    }), authorization.userAuthorize, users.loginSuccess);

    app.get('/users/home', authorization.userAuthorize, users.home);
    app.get('/users/home/:userId', authorization.userAuthorize, users.home);
    // Active produce
    app.get('/users/invite', users.invite);
    app.post('/users/dealActive', users.dealActive);
    app.get('/users/setProfile', users.setProfile);
    app.post('/users/dealSetProfile', users.dealSetProfile);
    app.get('/users/selectGroup', users.selectGroup);
    app.post('/users/dealSelectGroup', users.dealSelectGroup);
    app.get('/users/finishRegister', users.finishRegister);

    app.get('/users/campaign', authorization.userAuthorize, users.renderCampaigns);
    app.get('/users/getCampaigns', authorization.userAuthorize, users.getCampaigns);
    app.get('/users/getScheduleList', authorization.userAuthorize, users.renderScheduleList);

    app.get('/users/:userId/change_password',authorization.userAuthorize, users.renderChangePassword);
    app.get('/users/:userId/getAccount', authorization.userAuthorize, users.getAccount);
    app.post('/users/:userId/saveAccount', authorization.userAuthorize, users.saveAccount);
    app.post('/users/changePassword', authorization.userAuthorize, users.changePassword);
    app.get('/users/editInfo', authorization.userAuthorize, users.editInfo);
    app.get('/users/timeline/:userId', authorization.userAuthorize, users.timeLine);
    //加入、退出活动
    app.post('/users/joinCampaign', authorization.userAuthorize, users.joinCampaign);
    app.post('/users/quitCampaign', authorization.userAuthorize, users.quitCampaign);
    //加入、退出小队
    app.post('/users/joinGroup', authorization.userAuthorize, users.joinGroup);
    app.post('/users/quitGroup', authorization.userAuthorize, users.quitGroup);

    app.post('/users/vote', authorization.userAuthorize, users.vote);


    app.get('/users/editPhoto', authorization.userAuthorize, users.editPhoto);


    // for app
    app.post('/users/login', passport.authenticate('user'), authorization.userAuthorize, users.appLoginSuccess);
    app.get('/users/logout', users.appLogout);

    app.get('/users/campaigns', authorization.userAuthorize, users.getCampaignsForApp);
    app.get('/users/schedules', authorization.userAuthorize, users.getSchedules);
    app.get('/users/groups', authorization.userAuthorize, users.getGroups);

    app.get('/users/getTimelineForApp', authorization.userAuthorize, users.getTimelineForApp);

    app.post('/users/info', authorization.userAuthorize, users.getUserInfo);
    app.get('/users/briefInfo/:userId', authorization.userAuthorize, users.getBriefInfo);
    app.param('userId', users.user);

};

