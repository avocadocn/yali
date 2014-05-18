'use strict';

module.exports = function(app) {
    // Home route
    var region = require('../controllers/region');
    app.get('/region', region.regionAsJSON);
};
