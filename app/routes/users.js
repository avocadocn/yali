'use strict';

// User routes use users controller
var users = require('../controllers/users');
var authorization = require('./middlewares/authorization');
var config = require('../../config/config');


module.exports = function(app, passport) {

    app.get('/users/signin', users.signin);
    app.get('/users/signin/:status', users.signin);
    app.get('/users/signout', authorization.requiresLogin, users.signout);
    app.get('/users/forgetPwd', users.renderForgetPwd);
    app.post('/users/forgetPassword', users.forgetPwd);
    app.get('/users/resetPwd', users.renderResetPwd);
    app.post('/users/resetPassword', users.resetPwd);
    // Setting the local strategy route
    app.post('/users/session', passport.authenticate('user', {
        failureRedirect: '/users/signin/failure',
        failureFlash: true
    }), users.authorize, users.loginSuccess);

    app.get('/users/home', authorization.requiresLogin,users.authorize, users.home);
    app.get('/users/home/:userId', authorization.requiresLogin,users.authorize, users.home);
    // Active produce
    app.get('/users/invite', users.invite);
    app.post('/users/dealActive', users.dealActive);
    app.get('/users/setProfile', users.setProfile);
    app.post('/users/dealSetProfile', users.dealSetProfile);
    app.get('/users/selectGroup', users.selectGroup);
    app.post('/users/dealSelectGroup', users.dealSelectGroup);
    app.get('/users/finishRegister', users.finishRegister);

    app.get('/users/campaign', authorization.requiresLogin, users.renderCampaigns);
    app.get('/users/getCampaigns', authorization.requiresLogin, users.getCampaigns);
    app.get('/users/getScheduleList', authorization.requiresLogin, users.renderScheduleList);

    app.get('/users/change_password',authorization.requiresLogin, users.renderChangePassword);
    app.get('/users/getAccount', authorization.requiresLogin, users.getAccount);
    app.post('/users/saveAccount', authorization.requiresLogin, users.saveAccount);
    app.post('/users/changePassword', authorization.requiresLogin, users.changePassword);
    app.get('/users/editInfo', authorization.requiresLogin, users.editInfo);
    app.get('/users/timeline', authorization.requiresLogin, users.timeLine);
    //加入、退出活动
    app.post('/users/joinCampaign', authorization.requiresLogin, users.joinCampaign);
    app.post('/users/quitCampaign', authorization.requiresLogin, users.quitCampaign);
    //加入、退出小队
    app.post('/users/joinGroup', authorization.requiresLogin, users.joinGroup);
    app.post('/users/quitGroup', authorization.requiresLogin, users.quitGroup);

    app.post('/users/vote', authorization.requiresLogin, users.vote);


    app.get('/users/editPhoto', authorization.requiresLogin, users.editPhoto);


    // for app
    app.post('/users/login', passport.authenticate('user'), users.authorize, users.appLoginSuccess);
    app.get('/users/logout', authorization.requiresLogin, users.appLogout);

    app.get('/users/campaigns', authorization.requiresLogin, users.getCampaignsForApp);
    app.get('/users/schedules', authorization.requiresLogin, users.getSchedules);
    app.get('/users/groups', authorization.requiresLogin, users.getGroups);

    app.get('/users/getTimelineForApp', authorization.requiresLogin, users.getTimelineForApp);

    app.post('/users/info', authorization.requiresLogin, users.getUserInfo);
    app.get('/users/briefInfo/:userId', authorization.requiresLogin, users.getBriefInfo);
    app.param('userId', users.user);

};

