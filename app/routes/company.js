'use strict';

// Company routes use company controller
var company = require('../controllers/company');

module.exports = function(app, passport) {

    app.get('/company/signup', company.signup);
    app.get('/company/wait', company.wait);

    app.get('/company/signin', company.signin);
    app.post('/company/session', passport.authenticate('company', {
        failureRedirect: '/company/signin',
        failureFlash: true
    }), company.loginSuccess);

    app.get('/company/validate', company.validate);//点击公司激活链接

    app.get('/company/validate/error', company.validateError);
    app.get('/company/confirm', company.validateConfirm);//验证通过后进入创建公司账号信息页面


    app.get('/company/sendInvateCode', company.sendInvateCode);
    app.get('/company/editInfo', company.editInfo);
    app.get('/company/select', company.select);
    app.get('/company/invite', company.invite);//点击员工邀请链接

    app.post('/company/groupSelect', company.groupSelect);
    
    app.post('/company', company.create);// 提交公司申请信息
    
    app.post('/company/createDetail', company.createDetail);// 验证通过后进一步提交公司注册信息

    

    // Setting up the companyId param
    app.param('companyId', company.company);
};
