'use strict';

/**
 * Generic require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
    if (!req.user) {
        return res.send(403, 'forbidden!');
    }
    next();
};
exports.requiresUser = function(req, res, next) {
    if (!req.user || req.user.provider !=='user') {
        return res.send(403, 'forbidden!');
    }
    next();
};
exports.requiresCompany = function(req, res, next) {
    if (!req.user || req.user.provider !=='company') {
        return res.send(403, 'forbidden!');
    }

    next();
};