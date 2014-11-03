'use strict';


var search = require('../controllers/search');
var authorization = require('./middlewares/authorization');
module.exports = function(app, passport) {
    app.post('/search/company', search.getCompany);
    app.post('/search/team', search.getTeam);
    app.post('/search/user', search.getUser);
    app.get('/search/user/:userId', search.getUserInfo);
    app.post('/search/recommandTeam', search.recommandTeam);
    app.get('/search/:companyId/member', authorization.companyAuthorize, search.getMember);
    app.get('/search/sameCityTeam/:teamId',search.sameCityTeam);
};