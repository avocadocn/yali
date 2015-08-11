'use strict';

var jwt = require('jsonwebtoken');

exports.verifying = function (app) {
  return function (req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
      jwt.verify(token, app.get('tokenSecret'), function (err, decoded) {
        if (err) {
          console.log(err);
          next();
        } else {
          if (decoded.exp > Date.now()) {
            req.tokenUser = {
              type: decoded.type,
              id: decoded.id
            };
          }
          next();
        }
      });
    } else {
      next();
    }

  };
};