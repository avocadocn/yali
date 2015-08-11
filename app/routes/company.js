'use strict';

// Company routes use company controller
var company = require('../controllers/company');

module.exports = function(app, passport) {
    app.get('/company/manager', company.renderHrManagerPage);
    app.get('/company/manager/login', company.renderLoginPage);
};
