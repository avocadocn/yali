'use strict';

module.exports = function(app) {
    var index = require('../controllers/index');
    var schedule = require('../services/schedule');
    app.get('/', index.render);

    app.get('/about', index.about);
    app.get('/law', index.law);
    app.get('/privacy', index.privacy);
    app.get('/question', index.question);
    app.get('/contact', index.contact);
    //app.get('/test',index.test);
    //app.get('/count',index.count);
    app.get('/finish',schedule.finishCampaign);
    app.post('/feedback',index.feedback);
    app.get('/index/header',index.header);
};
