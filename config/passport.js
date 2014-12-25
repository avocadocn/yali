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
                        message: '用户不存在，请检查您的用户名'
                    });
                }
                else if (!company.status.mail_active) {
                    return done(null, false, {
                        message: '您的公司账号尚未激活,请到邮箱内激活'
                    });
                }
                else if (!company.status.active) {
                    return done(null, false, {
                        message: '您的公司账号已被关闭'
                    });
                }
                else if (!company.authenticate(password)) {
                    return done(null, false, {
                        message: '密码错误,请重新输入'
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
                username: username.toLowerCase()
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                else if (!user) {
                    return done(null, false, {
                        message: '用户不存在，请检查您的用户名'
                    });
                }
                else if (!user.authenticate(password)) {
                    return done(null, false, {
                        message: '密码错误,请重新输入'
                    });
                }
                else if(!user.mail_active||!user.invite_active){
                    return done(null, false, {
                        message: '账号未激活,请至邮箱点击链接激活'
                    });
                }
                else if(!user.active){
                    return done(null, false, {
                        message: '您的账号已被管理员关闭。'
                    });
                }
                else if(user.disabled){
                    return done(null, false, {
                        message: '账号已关闭。'
                    });
                }
                return done(null, user);
            });
        }
    ));

};