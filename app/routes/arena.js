'use strict';

// Arena routes use arena controller
var arena = require('../controllers/arena');
var authorization = require('./middlewares/authorization');
module.exports = function(app, passport) {

app.get('/arena/home', authorization.requiresLogin,  arena.home);
app.get('/arena', authorization.requiresLogin,  arena.home);
app.get('/arena/detail/:arenaId', authorization.requiresLogin,  arena.detail);
app.get('/arena/rob/:arenaId', authorization.requiresLogin, arena.rob);
app.post('/arena/addCampaignInfo/:arenaId', authorization.requiresLogin, arena.addCampaignInfo);
app.get('/arena/challenge/:arenaId', authorization.requiresLogin, arena.challenge);
app.param('arenaId',arena.arena);
};
