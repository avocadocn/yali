'use strict';

/**
 * Generic require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
    if (!req.user) {
        return  res.redirect('/');
    }
    next();
};
exports.requiresUser = function(req, res, next) {
    if (!req.user || req.user.provider !=='user') {
        return  res.redirect('/users/signin');
    }
    next();
};
exports.requiresLeader = function(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.send(401, 'User is not authorized');
    }
    next();
};
exports.requiresCompany = function(req, res, next) {
    if (!req.user || req.user.provider !=='company') {
        return  res.redirect('/company/signin');
    }
    next();
};