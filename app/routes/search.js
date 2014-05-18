'use strict';


var search = require('../controllers/search');
var authorization = require('./middlewares/authorization');
module.exports = function(app, passport) {
    app.get('/search/company', authorization.requiresLogin, search.getCompany);
    app.post('/search/team', authorization.requiresLogin, search.getTeam);
    app.post('/search/user', authorization.requiresLogin, search.getUser);
    app.get('/search/member', authorization.requiresLogin,search.getMember);

    app.get('/search/search/team', authorization.requiresLogin, search.searchTeam);
};