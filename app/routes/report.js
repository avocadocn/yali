'use strict';


var report = require('../controllers/report');
var authorization = require('./middlewares/authorization');
module.exports = function(app, passport) {
    app.post('/report/pull', report.pullReport);
    app.post('/report/push', report.pushReport);
};