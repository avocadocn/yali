'use strict';

// Company routes use company controller
var company = require('../controllers/company');
var authorization = require('./middlewares/authorization');
var config = require('../../config/config');

module.exports = function(app, passport) {

    //显示企业小队列表
    app.get('/company/signup', company.signup);
    app.get('/company/wait', company.wait);

    app.get('/company/signin', company.signin);
    app.get('/company/signout',company.signout);
    app.post('/company/session', passport.authenticate('company', {
        failureRedirect: '/company/signin',
        failureFlash: true
    }), company.authorize, company.loginSuccess);
    app.get('/company/forgetPwd', company.renderForgetPwd);
    app.post('/company/forgetPassword', company.forgetPwd);
    app.get('/company/resetPwd', company.renderResetPwd);
    app.post('/company/resetPassword', company.resetPwd);
    app.post('/company/mailCheck', company.mailCheck);
    app.post('/company/officialNameCheck', company.officialNameCheck);
    app.post('/company/usernameCheck', company.usernameCheck);


    app.get('/company/validate', company.validate);//点击公司激活链接

    app.get('/company/validate/error', company.validateError);

    app.get('/company/confirm', company.validateConfirm);//下面三个子页面当父页面
    app.get('/company/create_company_account', company.create_company_account);//创建公司账号
    app.get('/company/select', company.select);//选择组件
    app.get('/company/invite', company.invite);//发送邀请链接
    app.post('/company/addDomain', company.addDomain);// 添加邮箱后缀
    app.get('/company/add_group', company.add_company_group);//增加小队
    app.post('/company/saveGroup', company.saveGroup);//保存新增小队信息
    app.post('/company/groupSelect', company.groupSelect);
    app.post('/company', company.create);// 提交公司申请信息
    app.post('/company/createDetail', company.createDetail);// 验证通过后进一步提交公司注册信息

    //公司信息查看和修改
    app.get('/company/timeLine', authorization.requiresLogin, company.timeLine);
    app.post('/company/changeUser', authorization.requiresCompany, company.changeUser);
    app.get('/company/member', authorization.requiresLogin, company.renderMembers);
    app.get('/company/getAccount', authorization.requiresLogin, company.getAccount);
    app.get('/company/info', authorization.requiresLogin, company.Info);
    app.get('/company/teamInfo', authorization.requiresLogin, company.renderTeamInfo);
    app.get('/company/change_password', authorization.requiresLogin, company.renderChangePassword);
    app.post('/company/changePassword',authorization.requiresCompany, company.changePassword);
    app.post('/company/saveAccount', authorization.requiresCompany, company.saveAccount);
    //公司小队信息保存
    app.post('/company/saveGroupInfo',authorization.requiresCompany,company.saveGroupInfo);
    //公司小队查看修改
    app.get('/company/groupList', authorization.requiresLogin, company.renderGroupList);
    //企业发布活动
    app.post('/company/campaignSponsor', authorization.requiresCompany, company.sponsor);
    app.get('/company/campaigns', authorization.requiresLogin, company.renderCompanyCampaign);

    app.post('/company/appointLeader', authorization.requiresCompany, company.appointLeader);

    app.get('/company/home', authorization.requiresLogin,company.authorize,company.home);
    app.get('/company/home/:companyId', authorization.requiresLogin,company.authorize,company.home);
    // Setting up the companyId param
    app.param('companyId', company.company);

    app.get('/company/editLogo', company.editLogo);


};
