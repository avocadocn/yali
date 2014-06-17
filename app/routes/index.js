'use strict';

module.exports = function(app) {
    var index = require('../controllers/index');
    app.get('/', index.render);

    app.get('/about', index.about);
    app.get('/law', index.law);
    app.get('/privacy', index.privacy);
    app.get('/question', index.question);
    app.get('/contact', index.contact);
    app.get('/test',index.test);
};
