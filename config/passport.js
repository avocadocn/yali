'use strict';

var mongoose = require('mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    Company = mongoose.model('Company'),
    User = mongoose.model('User'),
    config = require('./config');

module.exports = function(passport) {

    // Serialize the user id to push into the session
    passport.serializeUser(function(user, done) {
        done(null, {'_id':user.id,'provider':user.provider});
    });

    // Deserialize the user object based on a pre-serialized token
    // which is the user id and provider
    passport.deserializeUser(function(id_provider, done) {
        if(id_provider.provider==='user'){
            User.findOne({
                _id: id_provider._id
            }, '-salt -hashed_password', function(err, user) {
                done(err, user);
            });
        }
        else if(id_provider.provider==='company') {
            Company.findOne({
                _id: id_provider._id
            }, '-salt -hashed_password', function(err, company) {
                done(err, company);
            });
        }
        else{
            done(null,null);
        }
    });

    // Use local strategy
    passport.use('company', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },
        function(username, password, done) {
            Company.findOne({
                username: username
            }, function(err, company) {
                if (err) {
                    return done(err);
                }
                if (!company) {
                    return done(null, false, {
                        message: 'Unknown user'
                    });
                }
                if (!company.status.active) {
                    return done(null, false, {
                        message: 'Company Not Actived!'
                    });
                }
                if (!company.authenticate(password)) {
                    return done(null, false, {
                        message: 'Invalid password'
                    });
                }
                return done(null, company);
            });
        }
    ));

    passport.use('user', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },
        function(username, password, done) {
            User.findOne({
                username: username
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if(!user.active){
                    return done(null, false, {
                        message: 'User Not Actived!'
                    });
                }
                if (!user) {
                    return done(null, false, {
                        message: 'Unknown user'
                    });
                }
                if (!user.authenticate(password)) {
                    return done(null, false, {
                        message: 'Invalid password'
                    });
                }
                return done(null, user);
            });
        }
    ));

};