'use strict';

/**
 * Module dependencies.
 */

// node system
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

// mongoose and models
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Company = mongoose.model('Company'),
  Group = mongoose.model('Group'),
  CompanyGroup = mongoose.model('CompanyGroup'),
  GroupMessage = mongoose.model('GroupMessage'),
  Department = mongoose.model('Department'),
  Config = mongoose.model('Config'),
  Campaign = mongoose.model('Campaign');

// 3rd
var validator = require('validator'),
  async = require('async'),
  gm = require('gm'),
  UUID= require('../middlewares/uuid');

// custom
var encrypt = require('../middlewares/encrypt'),
  department = require('../controllers/department'),
  mail = require('../services/mail'),
  sendcloud = require('../services/sendcloud'),
  webpower = require('../services/webpower'),
  schedule = require('../services/schedule'),
  moment = require('moment'),
  config = require('../config/config'),
  meanConfig = require('../../config/config'),
  message = require('../language/zh-cn/message'),
  model_helper = require('../helpers/model_helper'),
  photo_album_controller = require('./photoAlbum'),
  auth = require('../services/auth'),
  userScore = require('../services/user_score.js'),
  logController =require('../controllers/log');




var blockSize = 20;
var isMobile = function(req) {
  var deviceAgent = req.headers["user-agent"].toLowerCase();
  return deviceAgent.match(/(iphone|ipod|ipad|android)/);
};
/**
 * Show login form
 */
exports.signin = function(req, res) {
  var msg = {
    title : "用户登录"
  };
  if(req.params.status){
    switch(req.params.status){
      case 'failure':
        msg.msg = req.session.flash.error[req.session.flash.error.length-1];
        break;
      default:break;
    }
  }
  if(req.user) {
    res.redirect('/users/home');
  } else {
    res.render('users/signin', msg);
  }
};
/*
  忘记密码
*/
exports.renderForgetPwd = function(req, res){
  res.render('users/forgetPwd',{
    title:'忘记密码'
  });
}
//渲染修改资料页
exports.renderChangePassword = function(req,res){
  res.render('partials/change_passowrd');
}


exports.forgetPwd = function(req, res){
  User.findOne({email: req.body.email?req.body.email.toLowerCase():req.body.email}, function(err, user) {
    if(err || !user) {
      return  res.render('users/forgetPwd',{
                title:'忘记密码',
                err: '您输入的账号不存在'
              });
    } else {

      var sendByWebpower = function () {
        webpower.sendStaffResetPwdMail(
          user.email,
          user._id.toString(),
          req.headers.host,
          function (err) {
            if (err) {
              // TO DO: 发送失败待处理
              console.log(err);
            }
            res.render('users/forgetPwd', {
              title: '忘记密码',
              success:'1'
            });
          }
        );
      };

      mongoose.model('Config').findOne({ name: config.CONFIG_NAME }).exec()
      .then(function (config) {
        if (!config || !config.smtp || config.smtp === 'webpower') {
          sendByWebpower();
        } else if (config.smtp === '163') {
          mail.sendStaffResetPwdMail(user.email, user._id.toString(), req.headers.host);
          res.render('users/forgetPwd', {
            title: '忘记密码',
            success:'1'
          });
        } else if (config.smtp === 'sendcloud') {
          sendcloud.sendStaffResetPwdMail(user.email, user._id.toString(), req.headers.host);
          res.render('users/forgetPwd', {
            title: '忘记密码',
            success:'1'
          });
        }
      })
      .then(null, function (err) {
        console.log(err);
        sendByWebpower();
      });

    }
  });
}
exports.renderResetPwd = function(req, res){
  var key = req.query.key;
  var uid = req.query.uid;
  var time = req.query.time;
  time = new Date(encrypt.decrypt(time, config.SECRET));
  var validTime = new Date();
  validTime.setMinutes(new Date().getMinutes()-30);
  if(time<validTime){
    return  res.render('users/forgetPwd',{
          title:'忘记密码',
          err: '您的验证邮件已经失效，请重新申请'
        });
  }
  else if(encrypt.encrypt(uid, config.SECRET) ===key){
      res.render('users/resetPwd',{
        title:'重设密码',
        id: uid
      });
  }
  else{
      return  res.render('users/forgetPwd',{
        title:'忘记密码',
        err: '您的验证链接无效，请重新验证'
      });
  }

}
exports.resetPwd = function(req, res){
  User.findOne({_id: req.body.id}, function(err, user) {
    if(err || !user) {
      console.log('err');
      return  res.render('users/resetPwd',{
                title:'重设密码',
                err: '您输入的账号不存在'
              });
    } else {
      user.password = req.body.password;
      user.save(function(err){
        if(!err){
          res.render('users/resetPwd', {
            title: '重设密码',
            success: '1'
          });
        }
      });
    }
  });
}


/**
 * Logout
 */
exports.signout = function(req, res) {
  req.logout();
  res.redirect('/');
};


/**
 * Session
 */
exports.loginSuccess = function(req, res) {
  var logBody = {
    'log_type':'userlog',
    'userid' : req.user._id,
    'cid':req.user.cid,
    'role' : 'user',
    'ip' :req.headers['x-forwarded-for'] || req.connection.remoteAddress
  }
  logController.addLog(logBody);
  res.redirect('/users/home');
};
exports.autoLogin = function(req, res, next){
  User.findOne({_id:req.body.uid,app_token: req.body.app_token}, function(err, user) {
    if(err || !user) {
      console.log(err);
      return  res.send({ result: 0, msg: '登录失败'});
    } else {
      req.login(user, function(err) {
        if (err) {
         return next(err);
        }
        next();
      });
    }
  });

}

exports.appLoginSuccess = function(req, res) {
  //console.log(req.body.device,req.body.userid);
  //按条件更新用户的设备信息和推送id
  if(req.body.device && (req.body.userid != '' || req.body.token != '')){
    deviceRegister({
      'device_type':req.body.device.model,
      'device_id':req.body.device.uuid,
      'user_id':req.body.userid,
      'platform':req.body.device.platform,
      'version':req.body.device.version,
      'token':req.body.token
    },req.user._id);
  }else{
    console.log(req.body.status);
  }

  var app_token = UUID.id();
  var data = {
    _id: req.user._id,
    nickname: req.user.nickname,
    role: req.user.role,
    app_token: app_token
  };
  req.user.app_token = app_token;
  req.user.save(function(err){
    if(!err){
      saveLogRecord(req.user,req.headers['x-forwarded-for'] || req.connection.remoteAddress);
      res.send({ result: 1, msg: '登录成功', data: data });
    }
  });
}

exports.appSetToken = function (req, res) {
  if (req.role != 'OWNER') {
    res.status(403);
    next('forbidden');
    return;
  }
  if (req.body.device && req.body.token) {
    deviceRegister({
      'device_type':req.body.device.model,
      'device_id':req.body.device.uuid,
      'user_id':req.body.userid,
      'platform':req.body.device.platform,
      'version':req.body.device.version,
      'token':req.body.token
    }, req.user._id, function (err) {
      if (err) {
        res.send({ result: 0 });
      } else {
        res.send({ result: 1 });
      }
    });
  }
};

exports.appLogout = function(req, res) {
  if(req.body.device && (req.body.userid != '' || req.body.token != '')){
    deviceUnregister({
      'device_id':req.body.device.uuid,
      'user_id':req.body.userid,
      'platform': req.body.device.platform,
      'token': req.body.token
    },req.user._id);
  }else{
    console.log(req.body.status);
  }
  req.logout();
  res.send({ result: 1, msg: '注销成功' });
}


/**
 * 通过邀请链接或是邀请信的链接进入激活流程
 */
exports.invite = function(req, res) {
  if (req.user) {
    req.logout();
    res.locals.global_user = null;
  }

  var key = decodeURIComponent(req.query.key);
  var cid = req.query.cid;
  req.session.cid = req.query.cid; //给注册页显示部门用
  if(key == undefined || cid == undefined) {
    res.render('users/message', {title: 'error', message: 'bad request'});
  } else {
    Company
    .findOne({ _id: cid })
    .exec()
    .then(function(company) {
      if (!company) {
        throw 'Not Found';
      }
      if(key === company.invite_key){
        req.session.key = key;
        req.session.key_id = cid;

        // 如果邀请链接中附带uid，则将其查出并传递到视图里设置初始数据
        var invitedUser;
        async.waterfall([
          function (callback) {
            if (req.query.uid) {
              User.findById(req.query.uid).exec()
                .then(function (user) {
                  if (!user) {
                    callback(new Error('找不到邀请链接中uid对应的用户'));
                  } else {
                    invitedUser = user;
                    callback();
                  }
                })
                .then(null, function (err) {
                  callback(err);
                });
            } else {
              callback();
            }
          },
          function (callback) {
            if (isMobile(req)) {
              res.render('signup/invite_phone', {
                title: '个人注册',
                domains: company.email.domain,
                cname: company.info.official_name,
                invitedUser: invitedUser,
                inviteKey: company.invite_key
              });
            } else {
              res.render('signup/invite', {
                title: '个人注册',
                domains: company.email.domain,
                cname: company.info.official_name,
                invitedUser: invitedUser,
                inviteKey: company.invite_key
              });
            }
            callback();
          }
        ], function (err) {
          // 这里仅作错误处理，不接收结果
          if (err) {
            console.log(err.stack);
            res.render('users/message', {title: '无效的邀请链接', message: '抱歉，这是一个无效的邀请链接。'});
          }
        });
        
      }else{
        console.log('key错误');
        res.render('users/message', {title: 'error', message: 'bad request'});
      }
    })
    .then(null, function(err) {
      console.log(err);
      res.render('users/message', {title: 'error', message: 'bad request'});
    });
  }
};

exports.inviteQR = function(req, res) {
  if (req.user) {
    req.logout();
    res.locals.global_user = null;
  }
  // console.log('1');
  var key = decodeURIComponent(req.query.key);
  var cid = req.query.cid;
  var uid = req.query.uid;

  req.session.cid = req.query.cid; //给注册页显示部门用

  if (key == undefined || cid == undefined || uid === undefined) {
    res.render('users/message', {
      title: 'error',
      message: 'bad request'
    });
  } else {
    Company
      .findOne({
        _id: cid
      })
      .exec()
      .then(function(company) {
        if (!company) {
          throw 'Not Found';
        }
        if (key === company.invite_key) {
          req.session.key = key;
          req.session.key_id = cid;

          // 如果邀请链接中附带uid，则将其查出并传递到视图里设置初始数据
          User.findById(uid).exec()
            .then(function(user) {
              if (!user) {
                res.render('users/message', {
                  title: '无效的邀请链接',
                  message: '抱歉，这是一个无效的邀请链接。'
                });
              } else {
                if (user.cid.toString() === cid) {
                  var deviceAgent = req.headers["user-agent"].toLowerCase();
                  var agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
                  if (agentID) {
                    res.render('signup/invite_phone', {
                      title: '个人注册',
                      domains: company.email.domain,
                      cname: company.info.official_name,
                      uid: uid,
                      inviteKey: company.invite_key,
                      inviteQR: true
                    });
                  } else {
                    res.render('signup/invite', {
                      title: '个人注册',
                      domains: company.email.domain,
                      cname: company.info.official_name,
                      uid: uid,
                      inviteKey: company.invite_key,
                      inviteQR: true
                    });
                  }
                } else {
                  res.render('users/message', {
                    title: '无效的邀请链接',
                    message: '抱歉，这是一个无效的邀请链接。'
                  });
                }
              }
            });
        } else {
          console.log('key错误');
          res.render('users/message', {
            title: 'error',
            message: 'bad request'
          });
        }
      })
      .then(null, function(err) {
        console.log(err);
        res.render('users/message', {
          title: 'error',
          message: 'bad request'
        });
      });
  }
};

function userOperate(cid, key, res, req, index) {
  Company
  .findOne({ _id: cid })
  .exec()
  .then(function(company) {
    if (!company) {
      throw 'Not found company';
    }
    //只有在不重填信息的重发时不需要验证key 其它都要
    if(index===2 || company.invite_key===key) {
      var email = req.query.notinvited=='true'? req.body.email.toLowerCase() : req.body.host.toLowerCase() + '@' + req.body.domain;
      User.findOne({ username: email})
      .exec()
      .then(function(user) {
        if(index ==1){//未注册过,新建用户并保存
          if (user) {
            return res.render('signup/invite', {
              title: 'validate',
              domains: company.email.domain,
              message: '该邮箱已被注册'
            });
          }

          if (company.email.domain.indexOf(req.body.domain)>-1||company.email.domain.indexOf(email.split("@")[1])>-1) {
            var user = new User({
              email: email,
              username: email,
              cid: company._id,
              cname: company.info.name,
              company_official_name: company.info.official_name,
              nickname:req.body.nickname,
              password:req.body.password,
              realname: req.body.realname,
              phone: req.body.phone,
              role: 'EMPLOYEE'
            });
            //员工尚未激活时,他的部门信息里只能填入部门的id
            if(req.body.main_department_id != ''){
              if(req.body.child_department_id != ''){
                if(req.body.grandchild_department_id != ''){
                  user.department = {'_id':req.body.grandchild_department_id};
                }else{
                  user.department = {'_id':req.body.child_department_id};
                }
              }else{
                user.department = {'_id':req.body.main_department_id};
              }
            }
            user.save(function(err) {
              if (err) {
                console.log(err);
                return res.send(500,{'msg':'user save err.'});
              } else {
                company.save(function(err){
                  if(err) {
                    console.log(err);
                  } else {
                    //系统给员工发一封激活邮件
                    mongoose.model('Config').findOne({ name: config.CONFIG_NAME }, function (err, config) {
                      if (err || !config || !config.smtp || config.smtp === 'webpower') {
                        webpower.sendStaffActiveMail(email, user._id.toString(), company._id.toString(), req.headers.host, function (err) {
                          if (err) { console.log(err); }
                        });
                      } else if (config.smtp === '163') {
                        mail.sendStaffActiveMail(email, user._id.toString(), company._id.toString(), req.headers.host);
                      } else if (config.smtp === 'sendcloud') {
                        sendcloud.sendStaffActiveMail(email, user._id.toString(), company._id.toString(), req.headers.host);
                      }
                    });
                    if(req.session) {
                      delete req.session.key;
                      delete req.session.key_id;
                      delete req.session.cid;
                    }
                    if(req.body.quick){
                      return res.send({'result':1,'msg':'注册成功'});
                    }
                    else if(isMobile(req)){
                      return res.render('users/app_download');
                    }else{
                      return res.render('users/message', message.wait);
                    }
                  }
                });
              }
            });
          } else {
            res.render('signup/invite', {
              title: '验证失败',
              domains: company.email.domain,
              message: '信息填写错误'
            });
          }
        }
        else{//已注册过，重发邮件
          if (user) {
            //覆盖用户信息并保存
            if(index===4){
              user.nickname = req.body.nickname;
              user.password = req.body.password;
              user.realname = req.body.realname;
              user.phone = req.body.phone;
              user.save(function(err){
                if(err){
                  console.log(err);
                  return res.send(500,{'msg':'user save err.'});
                }
                else{
                  if(req.body.main_department_id != 'null'){
                    //员工尚未激活时,他的部门信息里只能填入部门的id
                    if(req.body.main_department_id != ''){
                      if(req.body.child_department_id != ''){
                        if(req.body.grandchild_department_id != ''){
                          user.department = {'_id':req.body.grandchild_department_id};
                        }else{
                          user.department = {'_id':req.body.child_department_id};
                        }
                      }else{
                        user.department = {'_id':req.body.main_department_id};
                      }
                    }
                  }
                }
              });
            }
            //-index ==2/4 的时候
            //重发邮件
            mongoose.model('Config').findOne({ name: config.CONFIG_NAME }, function (err, config) {
              if (err || !config || !config.smtp || config.smtp === 'webpower') {
                webpower.sendStaffActiveMail(email, user._id.toString(), company._id.toString(), req.headers.host, function (err) {
                  if (err) { console.log(err); }
                });
              } else if (config.smtp === '163') {
                mail.sendStaffActiveMail(email, user._id.toString(), company._id.toString(), req.headers.host);
              } else if (config.smtp === 'sendcloud') {
                sendcloud.sendStaffActiveMail(email, user._id.toString(), company._id.toString(), req.headers.host);
              }
            });
            delete req.session.key;
            delete req.session.key_id;
            delete req.session.cid;
            if(isMobile(req)){
              return res.render('users/app_download', message.wait);
            }else{
              return res.render('users/message', message.wait);
            }
          }
          else {
            return res.render('users/message', message.invalid);
          }
        }
      })
      .then(null, function(err) {
        console.log(err);
        return res.render('users/message', message.invalid);
      });
    }else{
      if(req.body.quick){
        return res.send({'result':0,'msg':'激活码填写错误'});
      }
      else {
        return res.render('users/message', {
          title: '验证错误',
          message: '激活码填写错误'
        });
      }

    }
  })
  .then(null, function(err) {
    console.log(err);
    return res.render('users/message', message.invalid);
  });
};

/**
 * 处理激活验证
 */
exports.dealActive = function(req, res, next) {
  if(req.query.notinvited=='true'){//非邀请步骤
    if(req.body.cid)
      userOperate(req.body.cid, req.body.inviteKey, res, req, 1);//step3 填写
    else{
      User.findOne({username:req.body.email?req.body.email.toLowerCase():req.body.email}, function(err, user){
        if(err||!user){
          console.log(err);
          return res.render('users/message', message.invalid);
        }else{
          userOperate(user.cid, null, res, req, 2);//在step1重发邮件
        }
      })
    }
  }
  else { //邀请链接来的
    var key = req.session.key;
    var cid = req.session.key_id;
    var index = req.body.index;
    //index为1:未注册过,2:不重填资料重新发邮件,3:重填资料重新发邮件
    if (req.body.inviteKey) {
      if (req.body.inviteKind === 'QR') {
        // 扫描用户的二维码进行注册
        userSave(cid, req.body.inviteKey, req.body.uid);
      }
      else {
        // 如果是附带邀请码的（从邀请信的链接中进入注册页面），不创建用户，只添加信息，激活并保存，不发激活邮件。
        // 并且不是扫描用户二维码注册
        checkCompanyInvitedKey(cid, req.body.inviteKey, req.body.inviteUserId);
      }

    } else {
      // 否则仍按原来逻辑执行
      userOperate(cid, key, res, req, index);
    }
  }

  function userSave(cid, key, uid) {
    Company.findById(cid).exec()
      .then(function(company) {
        if (!company) {
          return res.render('users/message', message.invalid);
        }
        if (company.invite_key === key) {

          User.findById(uid).exec()
            .then(function(user) {
              if (!user) {
                return res.render('users/message', message.invalid);
              } else {
                if (user.cid.toString() === cid) {
                  var email = req.body.host.toLowerCase() + '@' + req.body.domain;
                  User.findOne({
                      username: email
                    })
                    .exec()
                    .then(function(user) {
                      if (user) {
                        return res.render('signup/invite', {
                          title: 'validate',
                          domains: company.email.domain,
                          message: '该邮箱已被注册'
                        });
                      }
                      var user = new User({
                        email: email,
                        username: email,
                        cid: company._id,
                        cname: company.info.name,
                        company_official_name: company.info.official_name,
                        nickname: req.body.nickname,
                        password: req.body.password,
                        realname: req.body.realname,
                        phone: req.body.phone,
                        role: 'EMPLOYEE',
                        // mail_active: true,
                        invite_person: uid
                      });

                      // return res.render('users/message', message.invalid);
                      if (req.body.main_department_id != '') {
                        if (req.body.child_department_id != '') {
                          if (req.body.grandchild_department_id != '') {
                            user.department = {
                              '_id': req.body.grandchild_department_id
                            };
                          } else {
                            user.department = {
                              '_id': req.body.child_department_id
                            };
                          }
                        } else {
                          user.department = {
                            '_id': req.body.main_department_id
                          };
                        }
                      }
                      // console.log(user);
                      user.save(function(err) {
                        if (err) {
                          console.log(err);
                          res.render('users/message', {
                            title: '注册失败',
                            message: '注册失败。'
                          });
                        } else {
                          // res.render('users/message', {
                          //   title: '注册成功',
                          //   message: '注册成功!'
                          // });
                          mongoose.model('Config').findOne({
                            name: config.CONFIG_NAME
                          }, function(err, config) {
                            if (err || !config || !config.smtp || config.smtp === 'webpower') {
                              webpower.sendStaffActiveMail(email, user._id.toString(), company._id.toString(), req.headers.host, function(err) {
                                if (err) {
                                  console.log(err);
                                }
                              });
                            } else if (config.smtp === '163') {
                              mail.sendStaffActiveMail(email, user._id.toString(), company._id.toString(), req.headers.host);
                            } else if (config.smtp === 'sendcloud') {
                              sendcloud.sendStaffActiveMail(email, user._id.toString(), company._id.toString(), req.headers.host);
                            }
                          });
                          delete req.session.key;
                          delete req.session.key_id;
                          delete req.session.cid;
                          if (isMobile(req)) {
                            return res.render('users/app_download');
                          } else {
                            return res.render('users/message', message.wait);
                          }
                        }
                      })
                    })
                    .then(null, function(err) {
                      console.log(err);
                      return res.render('users/message', message.invalid);
                    });

                } else {
                  return res.render('users/message', message.invalid);
                }
              }
            })
            .then(null, function(err) {
              res.render('users/message', message.invalid);
            });
        } else {
          res.render('users/message', message.invalid);
        }
      })
      .then(null, function(err) {
        res.render('users/message', message.invalid);
      });
  }
  function checkCompanyInvitedKey(cid, inviteKey, inviteUserId) {
    Company.findById(cid).exec()
      .then(function (company) {
        if (company.invite_key === inviteKey) {
          activeInvitedUser();
        } else {
          res.render('users/message', message.invalid);
        }
      })
      .then(null, function (err) {
        next(err);
      });
  }

  function activeInvitedUser() {
    User.findOne({ email: req.body.email?req.body.email.toLowerCase():req.body.email }).exec()
      .then(function (user) {
        if (!user) {
          // 如果找不到用户，极有可能是用户修改了表单数据，这在前端是不被允许的
          res.render('users/message', { title: '激活失败', message: '激活失败。' });
        } else {
          user.username = user.email;
          user.mail_active = true;
          user.nickname = req.body.nickname;
          user.password = req.body.password;
          user.realname = req.body.realname;
          user.phone = req.body.phone;
          user.role = 'EMPLOYEE';

          // 此处应该确保先保存用户信息再参加部门，因为加入部门操作是使用findByIdAndUpdate
          // 而更新之后，再保存用户，则会保存user对象，该对象的department属性将会覆盖findByIdAndUpdate的对此的修改
          saveUser(user, function () {
            joinDepartment(user, console.error);
          });
        }
      })
      .then(null, function (err) {
        next(err);
      });
  }

  function joinDepartment(user, callback) {
    //员工尚未激活时,他的部门信息里只能填入部门的id
    if (req.body.main_department_id != '') {
      if (req.body.child_department_id != '') {
        if (req.body.grandchild_department_id != '') {
          user.department = {'_id': req.body.grandchild_department_id};
        } else {
          user.department = {'_id': req.body.child_department_id};
        }
      } else {
        user.department = {'_id': req.body.main_department_id};
      }
    }
    department.memberOperateByHand(user, user.department._id, callback);
  }

  function saveUser(user, callback) {
    user.save(function (err) {
      if (err) {
        next(err);
      } else {
        req.session.key = null;
        req.session.key_id = null;
        req.session.cid = null;
        if (isMobile(req)) {
          res.render('users/app_download');
        } else {
          res.render('users/message', {title: '注册成功', message: '注册成功!'});
        }

        //公司人员增加
        Company.update({'_id': user.cid._id}, {'$inc': {'info.membernumber': 1}}, function (err, company) {
          if (err || !company) {
            console.log(err);
          }
        });

        callback && callback();
      }
    });
  }
};

/**
 * 验证用户邮箱是否重复
 */
exports.mailCheck = function(req, res) {
  var email = req.body.login_email?req.body.login_email.toLowerCase():req.body.login_email;
  User.findOne({username:email},{active:1,mail_active:1},function(err,user){
    if(err){
      console.log(err);
      return res.send(500,{'msg':'DatabaseError'});
    }
    if(req.body.cid){
      Company.findOne({'_id':req.body.cid},function(err,company){
        if(company.email.domain.indexOf(email.split("@")[1])===-1){//这个邮箱后缀不对
          return res.send({'active':5});
        }
        else if(!user){//这个邮箱没用过
          return res.send({'active':1});
        }
        else if(user.mail_active === false){//这个邮箱激活了没验证
          return res.send({'active':2});
        }
        else //这个邮箱已激活、并注册完毕
          return res.send({'active':3});
      });
    }
    else if(!user){//这个邮箱没用过
      return res.send({'active':1});
    }
    else if(user.mail_active === false){//这个邮箱激活了没验证
      return res.send({'active':2});
    }
    else //这个邮箱已激活、并注册完毕
      return res.send({'active':3});
  });
};

/**
 * 邀请码
 */
exports.inviteKeyCheck = function(req, res) {
  var cid = req.body.cid;
  var inviteKey = req.body.inviteKey;
  if(!cid||!inviteKey){
    return res.status(400).send({'msg':'输入错误'});
  }
  Company.findOne({_id:cid}).exec().then(function(company){
    if(company){
      if(inviteKey===company.invite_key){
        return res.status(200).send({'invitekeyCheck':1});
      }else{
        return res.status(200).send({'invitekeyCheck':2});
      }
    }else{
      return res.status(400).send({'msg':'未查找到公司'});
    }
  })
  .then(null,function(err){
    log(err);
    return res.status(500).send({'msg':'数据库错误'});
  });
}

/**
 * 通过激活链接进入，无激活码的邮箱激活
 */
// exports.mailActive = function(req, res){
//   if (req.user) {
//     req.logout();
//     res.locals.global_user = null;
//   }
//   var key = req.query.key;
//   var uid = req.query.uid;
//   User.findOne({_id: uid}).exec(function(err, user) {
//     if(err) {
//       console.log(err);
//       res.render('users/message', message.dbError);
//     } else if(user) {
//       //todo -M
//       if(user.invite_active === true) {
//         res.render('users/message', message.actived);
//       } else {
//         if(encrypt.encrypt(uid, config.SECRET) === key) {
//           user.active= true;
//           user.mail_active = true;
//           user.save(function(err){
//             if(err){
//               console.log(err);
//               return res.send(500,{'msg':'user save err.'});
//             }
//           });
//           res.render('signup/personal_step_four', {
//             title: '激活成功',
//             uid: uid
//           });
//         } else {
//           res.render('users/message', message.invalid);
//         }
//       }
//     } else {
//       res.render('users/message', message.unregister);
//     }
//   });
// };

/**
 * 输入公司邀请码后最终的激活
 */
// exports.lastStepActive = function(req, res){
//   var key = req.body.key;
//   var uid = req.body.uid;
//   User.findOne({_id: uid}).populate('cid').exec(function(err, user) {
//     if(err) {
//       console.log(err);
//       console.log(err.stack);
//       res.render('users/message', message.dbError);
//     }
//     else if(user) {
//       //-todo -M
//       if(key===user.cid.invite_key){
//         user.invite_active = true;
//         //员工激活后,要把他的具体信息加入部门
//         //此处可以做个api
//         if(user.department != null && user.department != undefined && user.department.length > 1){
//           var callback = function(err, data) {
//             if (err) {
//               console.log(err);
//               console.log(err.stack);
//             }
//           }
//           var member = {
//             '_id':user._id,
//             'nickname':user.nickname,
//             'photo':user.photo,
//             'apply_status':'pass'
//           };
//           department.memberOperateByHand('join',member,user.department._id,callback);
//         }
//         user.save(function(err){
//           if(err){
//             console.log(err);
//             console.log(err.stack);
//             return res.send(500,{'msg':'user save err.'});
//           }
//           else{
//             //公司人员增加
//             Company.update({'_id':user.cid._id},{'$inc':{'info.membernumber':1}},function(err,company){
//               if(err){
//                 console.log(err);
//                 console.log(err.stack);
//               }
//             });
//             res.render('signup/setProfile', {
//               title: '激活成功',
//             });
//           }
//         });
//       }
//       else{
//         res.render('users/message', message.invalid);
//       }
//     }
//   });
// };


/**
 * 通过激活链接进入，完成激活
 */
exports.setProfile = function(req, res) {
  if (req.user) {
    req.logout();
    res.locals.global_user = null;
  }
  var key = req.query.key;
  var uid = req.query.uid;
  User.findOne({_id: uid}).populate('cid').exec(function(err, user) {
    if(err) {
      console.log(err);
      res.render('users/message', message.dbError);
    } else if(user) {
      if(user.active === true) {
        res.render('users/message', message.actived);
      } else {
        if(encrypt.encrypt(uid, config.SECRET) === key) {
          user.active= true;
          user.mail_active = true;
          //员工激活后,要把他的具体信息加入部门
          if(user.department != null && user.department != undefined){
            var callback = function(err, data) {
              if (err) {
                console.log(err);
              }
            }
            department.memberOperateByHand(user ,user.department._id, callback);
          }
          user.save(function(err){
            if(err){
              console.log(err);
              return res.send(500,{'msg':'user save err.'});
            }
            else{
              //公司人员增加
              Company.update({'_id':user.cid._id},{'$inc':{'info.membernumber':1}},function(err,company){
                if(err || !company){
                  console.log(err);
                }
              });
              //给公司发动态
              // var groupMessage = new GroupMessage();
              // groupMessage.message_type = 7;
              // groupMessage.company={
              //   cid : user.cid._id,
              //   name : user.cname,
              //   logo : user.cid.info.logo
              // };
              // groupMessage.user={
              //   user_id : user._id,
              //   name : user.nickname,
              //   logo : user.photo
              // };
              // groupMessage.save();
              //req.session.username = user.username;
            }
          });
          res.render('signup/setProfile', {
            title: '激活成功'
          });
        } else {
          res.render('users/message', message.invalid);
        }
      }
    } else {
      res.render('users/message', message.unregister);
    }
  });
};

exports.renderCampaigns = function(req, res){
  res.render('partials/user_campaign_list',{
      'provider':'user',
      'role':req.role
  });
};


exports.renderCommentCampaigns = function(req, res){
  res.render('partials/recent_comment_campaign',{
      'provider':'user',
      'role':req.role
  });
};



function fetchCampaign(req,res,team_ids,role) {
  var campaigns = [];
  var join = false;
  var logo ='';
  var link ='';
  var name;
  var option = {
    'active':true,
    'finish':false,
    '$or':[{'team':{'$in':team_ids}},{'cid':req.user.cid,'team':{'$size':0}}]
  }
  Campaign.find(option).sort({'start_time':-1})
  .populate('team')
  .populate('cid')
  .exec(function(err, campaign) {
    if (err || !campaign) {
      return res.send({
        'data':[],
        'role':role
      });
    } else {
      var length = campaign.length;
      for(var j = 0; j < length; j ++) {
        join = false;
        for(var k = 0;k < campaign[j].member.length; k ++) {
          if(req.user._id.toString() === campaign[j].member[k].uid) {
            join = true;
            break;
          }
        }
        var judge = false;
        if(campaign[j].deadline && campaign[j].member_max){
            judge = (new Date() > campaign[j].deadline || (campaign[j].member.length >= campaign[j].member_max) && campaign[j].member_max > 0 );
        }
        if(campaign[j].team.length === 0){//公司活动
          logo = campaign[j].cid[0].info.logo;
          link = '/company/home';
          name = campaign[j].cid[0].info.official_name;
        }
        else{
          if(campaign[j].team.length === 1){//小队活动
            logo = campaign[j].team[0].logo;
            link = '/group/page/'+campaign[j].team[0]._id;
            name = campaign[j].team[0].name;
          }
          else{                              //小队挑战
            if(team_ids.indexOf(campaign[j].team[0]._id)!== -1){ //是主办方
              logo = campaign[j].team[0].logo;
              link = '/group/page/'+campaign[j].team[0]._id;
              name = campaign[j].team[0].name;
            }
            else{                             //不是主办方
              logo = campaign[j].team[1].logo;
              link = '/group/page/'+campaign[j].team[1]._id;
              name = campaign[j].team[1].name;
            }
          }
        }

        campaigns.push({
          'over' : judge,
          'active':campaign[j].active, //截止时间到了活动就无效了//逻辑不对-M
          '_id': campaign[j]._id.toString(),
          'gid': campaign[j].gid,
          'group_type': campaign[j].group_type,
          'cname': campaign[j].cname,
          'content': campaign[j].content,
          'location': campaign[j].location,
          'member_length': campaign[j].member.length,
          'start_time': campaign[j].start_time,
          'end_time': campaign[j].end_time,
          'deadline':campaign[j].deadline,
          'join':join,
          'index':j,
          'theme':campaign[j].theme,
          'team':campaign[j].team,
          'logo':logo,
          'name':name,
          'link':link
        });
      }
      return res.send({
        'data':campaigns,
        'role':role
      });
    }
  });
}

function fetchTeam(team) {
  var rst = [];
  for(var i = 0; i < team.length; i ++) {
    rst.push(team[i]._id);
  }
  return rst;
}
//列出该user加入的所有小队的活动
//这是在员工日程里的,不用判断权限,因为关闭活动等操作
//必须让队长进入小队页面去完成,不能在个人页面进行
exports.getCampaigns = function(req, res) {
  var team_ids = [];
  var team;

  if(req.role!=='OWNER') {
    User.findOne({'_id':req.session.otheruid},function (err,user){
      if(err || !user) {
        return res.send({
          'data':[],
          'role':req.role
        });
      } else {
        team = user.team;
        team_ids = fetchTeam(team);
        fetchCampaign(req,res,team_ids,req.role);
      }
    });
  } else {
    team = req.user.team;
    team_ids = fetchTeam(team);
    fetchCampaign(req,res,team_ids,req.role);
  }
};



exports.renderScheduleList = function(req, res) {
  res.render('partials/schedule_list',{'role':req.role});
};



exports.home = function(req, res) {
  if(req.role!=='OWNER'){
    return res.redirect('/users/timeLine/'+req.profile._id);
  }
  var _user = {};
  var _nickname,_logo;
  if(req.role ==='OWNER'){
    _user = req.user;
  }
  else{
    _user = req.profile;
  }
  var leader_teams = [];
  var selected_teams = [];
  var user_teams = [];
  for(var i = 0; i < req.user.team.length; i ++) {
    user_teams.push(req.user.team[i]._id.toString());
  }
  var department = _user.department;
  if (!_user.department || !_user.department._id) {
    department = null;
  }
  var myteam = req.user.team;
  var _myteam = [];
  var myteamLength= myteam.length;
  for(var i = 0; i < myteamLength; i ++) {
    if(myteam[i].gid !== '0'){
      //下面查找的是该成员加入和未加入的所有active小队
      if(myteam[i].leader) {
        //判断此人是否是此队队长，并作标记
        _myteam.unshift({
          _id:myteam[i]._id,
          name:myteam[i].name,
          logo:myteam[i].logo,
          leader:myteam[i].leader
        });
      }
      else{
        _myteam.push({
          _id:myteam[i]._id,
          name:myteam[i].name,
          logo:myteam[i].logo,
          leader:myteam[i].leader
        });
      }
    }
  }
  res.render('users/home',{
    'title': req.role ==='OWNER'? '我的Donler主页': _user.nickname+'的Donler主页',
    'uid':_user._id,
    'leader_teams': leader_teams,
    'selected_teams' : selected_teams,
    'photo': _user.photo,
    'realname':_user.realname,
    'nickname': _user.nickname,
    'cname':_user.cname,
    'sign':_user.introduce,
    'role': req.role,
    'department': department,
    'myteam':_myteam,
    'user_role':req.user.role
  });
};

exports.editInfo = function(req, res) {
  return res.render('users/editInfo', {
    'title': '个人资料',
    'role':req.role,
    'this_user': req.profile,
    'moment': moment
  });
};


exports.renderSearchOpponents = function(req, res){
  if(req.user.provider==='company'){
    return res.redirect('/');
  }
  var myTeams = req.user.team;
  var sortTeams = function(teams){//整理成队长的在前
    var leaderHead = -1;
    //leaderHead指向最后一个他是队长的小队
    for(var i=0; i<teams.length; i++){
      if(teams[i].gid==='0'){
        teams.splice(i,1);
        i--;
      }
      else if(teams[i].leader===true){
        if(leaderHead===i+1) leaderHead++;
        else{//向前交换
          leaderHead++;
          var temp = teams[leaderHead];
          teams[leaderHead] = teams[i];
          teams[i] = temp;
        }
      }
    }
    return teams;
  };
  return res.render('users/search_opponents',{myTeams:sortTeams(myTeams)});
};

exports.timeLine = function(req,res){
  var uid = req.params.userId;
  var option = {
    'active':true,
    'cid':req.profile.cid,
    'campaign_unit.member._id':uid
  }
  if(req.role=='OWNER'){
    option.finish=true;
  }
  Campaign
  .count(option)
  .exec()
  .then(function(campaignsNum) {
      var myteam = [];
      req.profile.team.forEach(function(_team){
        if(_team.gid!=0){
          myteam.push(_team);
        }
      });
      var nowUser = {
        _id:req.profile._id,
        cid:req.profile.cid,
        nickname:req.profile.nickname,
        realname:req.profile.realname,
        department:req.profile.department,
        cname:req.profile.cname,
        introduce:req.profile.introduce,
        photo:req.profile.photo,
        phone:req.profile.phone,
        email:req.profile.email,
        teams:myteam,
        role :req.role,
        register_date:req.profile.register_date
      };

      // console.log(newTimeLines);
      return res.render('users/user_timeline',{'user':nowUser,'length':campaignsNum,'moment':moment});
  })
  .then(null, function(err) {
    console.log(err);
    return res.send({result:0,msg:'查询错误'});
  });
}


//用户加入小队
exports.joinGroup = function (req, res){
  var uid = req.user._id.toString();
  var tid = req.body.tid;
  User.findOne({
    _id: uid
  },
  function (err, user){
    if(err)
      return res.send(err);
    if(user){
      CompanyGroup.findOne({
        _id : tid
        },
        function (err,companyGroup) {
          if(err)
            return res.send(err);
          if(companyGroup){
            //先把个人资料先放入组员中
            if(model_helper.arrayObjectIndexOf(companyGroup.member,uid,'_id')>-1){
              return res.send({result: 0, msg:'您已经加入该小队'});
            }
            companyGroup.member.push({
              '_id':user._id,
              'nickname':user.nickname,
              'photo':user.photo
            });

            var provoke = companyGroup.score.provoke;
            var campaign = companyGroup.score.campaign;
            var member = companyGroup.score.member;
            var participator = companyGroup.score.participator;
            var comment = companyGroup.score.comment;
            var album = companyGroup.score.album;

            provoke = (provoke == undefined || provoke == null) ? 0 : provoke;
            campaign = (campaign == undefined || campaign == null) ? 0 : campaign;
            member = (member == undefined || member == null) ? 0 : member + 10;
            participator = (participator == undefined || participator == null) ? 0 : participator;
            comment = (comment == undefined || comment == null) ? 0 : comment;
            album = (album == undefined || album == null) ? 0 : album;

            companyGroup.score = {
              'provoke':provoke,
              'campaign':campaign,
              'member':member,
              'participator':participator,
              'comment':comment,
              'album':album
            }

            user.team.push({
              '_id' : companyGroup._id,
              'gid': companyGroup.gid,
              'group_type': companyGroup.group_type,
              'entity_type': companyGroup.entity_type,
              'name':companyGroup.name,
              'logo':companyGroup.logo
            });
            //保存小队
            companyGroup.save(function (err){
              if(err){
                console.log(err);
                return res.send({result: 0, msg:'保存小队出错'});
              }
              else{
                // 添加积分
                userScore.addScore(user, {
                  joinOfficialTeam: 1
                }, {
                  save: false
                }, function (err, user) {
                  if (err) {
                    log(err);
                    return;
                  }

                  user.save(function (err){
                    if(err){
                      console.log(err);
                      return res.send({result: 0, msg:'保存用户出错'});
                    }else{
                      // GroupMessage.findOne({'message_type':8,'user.user_id':uid,'team.teamid':tid},function(err,groupMessage){
                      //   if(!err&&groupMessage){
                      //     groupMessage.create_time = new Date();
                      //     groupMessage.save();
                      //   }
                      //   else{
                      //     var groupMessage = new GroupMessage();
                      //     groupMessage.message_type = 8;
                      //     groupMessage.team = {
                      //       teamid : companyGroup._id,
                      //       name : companyGroup.name,
                      //       logo : companyGroup.logo
                      //     };
                      //     groupMessage.user ={
                      //       user_id : user._id,
                      //       name : user.nickname,
                      //       logo : user.photo
                      //     };
                      //     groupMessage.save();

                      //   }
                      // });
                      // console.log('保存用户成功');
                      return res.send({result: 1, msg:'保存用户成功'});
                    }
                  });

                });

              }
            });
          }
      });
    }
  });
};

//用户退出小队 todo
exports.quitGroup = function (req, res){
  var uid = req.user._id.toString();
  var tid = req.body.tid;
  CompanyGroup.findOne({
    _id: tid
    },
    function (err, companyGroup){
      if (err)
        return res.send(err);
      if(companyGroup){
         //从companyGroup的memeber里删除此人
        var member_index = model_helper.arrayObjectIndexOf(companyGroup.member,uid,'_id');
        if(member_index>-1){
          companyGroup.member.splice(member_index,1);

          var provoke = companyGroup.score.provoke;
          var campaign = companyGroup.score.campaign;
          var member = companyGroup.score.member;
          var participator = companyGroup.score.participator;
          var comment = companyGroup.score.comment;
          var album = companyGroup.score.album;

          provoke = (provoke == undefined || provoke == null) ? 0 : provoke;
          campaign = (campaign == undefined || campaign == null) ? 0 : campaign;
          member = (member == undefined || member == null) ? 0 : member - 10;
          participator = (participator == undefined || participator == null) ? 0 : participator;
          comment = (comment == undefined || comment == null) ? 0 : comment;
          album = (album == undefined || album == null) ? 0 : album;

          companyGroup.score = {
            'provoke':provoke,
            'campaign':campaign,
            'member':member,
            'participator':participator,
            'comment':comment,
            'album':album
          }
        }
        else{
          return res.send({result: 0, msg:'您没有参加该小队'});
        }
        var leader_index = model_helper.arrayObjectIndexOf(companyGroup.leader,uid,'_id');
        if(leader_index>-1){
          companyGroup.leader.splice(leader_index,1);
        }
        companyGroup.save(function (err) {
          if(err){
            return res.send(err);
          }
          else{
            User.findOne({_id: uid},
              function (err, user){
                if(user){
                  //此处逻辑有错误
                  //从user的group的team中删除此小队
                  var team_index = model_helper.arrayObjectIndexOf(user.team,tid,'_id');
                  if(team_index>-1){
                    user.team.splice(team_index,1);
                  }
                  else{
                    return res.send({result: 0, msg:'您没有参加该小队'});
                  }

                  //修改user.role的逻辑部分
                  var l = false;//标识他是不是这个队的队长
                  var ol = false; // 标识是不是其它队的队长
                  var ok = false;//提高效率用
                  //这段代码性能很低,但是需要
                  for(var i =0; i< user.team.length; i ++) {
                      if(user.team[i]._id.toString() == tid.toString()){
                          user.team[i].leader = false;
                          l = user.team[i].leader;
                          if(ol)
                              break;//ol已标记过
                          ok =true;
                      }
                      else if(user.team[i].leader === true){
                              ol=true;//标记他为其它队长
                              if(ok)
                                  break;
                      }
                  }
                  if(!ol)
                    user.role = 'EMPLOYEE'; //如果不是其它队队长则贬为平民！
                  //----user.role

                  userScore.addScore(user, {
                    quitOfficialTeam: 1
                  }, {
                    save: false
                  }, function (err, user) {
                    if (err) {
                      log(err);
                      return;
                    }

                    user.save(function (err){
                      if(err){
                        console.log(err);
                        return res.send({result: 0, msg:'保存用户出错'});
                      }else{
                        user.save(function (err) {
                          if(err){
                            return res.send(err);
                          }
                          else {
                            return res.send({result:1, msg: '退出小队成功！'});
                          }
                        });
                      }
                    });

                  });

                }
                else
                  return res.send({result: 0, msg:'查无此人'});
            });
          }
        });
      }
      else
        return res.send({result: 0, msg:'无此小队'});
    });
};

//获取账户信息
exports.getAccount = function (req, res, next) {
  if(req.role !=='HR'&& req.role!=='OWNER'&&req.role!=='PARTNER' ){
    res.status(403);
    next('forbidden');
    return;
  }
  User.findOne({
      _id : req.params.userId
  },{'hashed_password':0,'salt':0}, function(err, user) {
      if(err) {
          console.log(err);
          res.send({'result':0,'msg':'数据错误'});
      }
      else {
          if (user) {
              res.send({'result':1,'msg':'用户查找成功','data': user});
          } else {
              res.send({'result':0,'msg':'不存在该用户'});
          }
      }
  });
};

//保存用户信息
exports.saveAccount = function (req, res, next) {
  if(req.role !=='HR'&& req.role!=='OWNER'){
    res.status(403);
    next('forbidden');
    return;
  }
  User
  .findById(req.params.userId)
  .exec()
  .then(function(user) {
    if (!user) {
      res.status(404);
      return next('not found');
    }
    for (var i in req.body.user) {
      user[i] = req.body.user[i];
    }
    user.save(function(err) {
      if (err) {
        return next(err);
      }
      if(req.body.did && !user.department._id || user.department._id.toString()!= req.body.did) {
        department.memberOperateByHand(user,req.body.did,function (err) {
          if (err) {
            log(err);
            res.sendStatus(500);
            return;
          }
          else {
            res.redirect('/users/home#/personal/' + req.params.userId);
          }
        });
      }
      else {
        res.redirect('/users/home#/personal/' + req.params.userId);
      }
    });

  })
  .then(null, function(err) {
    next(err);
  });
};

//修改密码
exports.changePassword = function (req, res, next) {
  if(req.role !=='HR'&& req.role!=='OWNER'){
    res.status(403);
    next('forbidden');
    return;
  }
  User.findOne({
      _id : req.params.userId

    },function(err, user) {
      if(err) {
        console.log(err);
        res.send({'result':0,'msg':'数据错误'});
      }
      else {
        if (user) {
          if(user.authenticate(req.body.nowpassword)==true){
            user.password = req.body.newpassword;
            user.save(function(err){
              if(err){
                console.log(err);
                res.send({'result':0,'msg':'密码修改失败'});
              }
              else {
                res.send({'result':1,'msg':'密码修改成功'});
              }
              return;
            });
          }
          else{
            res.send({'result':0,'msg':'密码不正确，请重新输入'});
          }
        }
        else {
          res.send({'result':0,'msg':'您没有登录'});
        }
      }
  });
};



exports.editPhoto = function(req, res, next) {
  if(req.role ==='PARTNER'){
    res.status(403);
    next('forbidden');
    return;
  }
  res.render('users/edit_photo', {
    photo: req.profile.photo,
    uid: req.profile._id
  });
};




exports.user = function(req, res, next, id) {
    User
        .findOne({
             _id: id
        })
        .exec(function(err, user) {
            if (err) return next(err);
            if (!user) return next(new Error('Failed to load User ' + id));
            req.profile = user;
            next();
        });
};


exports.getGroups = function(req, res) {
  CompanyGroup
  .find({ cid: req.user.cid })
  .exec()
  .then(function(company_groups) {
    var joined_groups = [];
    var unjoin_groups = [];

    company_groups.forEach(function(company_group) {
      for (var i = 0; i < company_group.member.length; i++) {
        if (req.user._id.toString() === company_group.member[i]._id.toString()) {
          joined_groups.push(company_group);
          return;
        }
      }
      unjoin_groups.push(company_group);
    });
    res.send({
      result: 1,
      msg: '获取小队列表成功',
      joined_groups: joined_groups,
      unjoin_groups: unjoin_groups
    });

  })
  .then(null, function(err) {
    console.log(err);
    res.send('获取小队列表失败');
  });


};










// for app

exports.getCampaignsForApp = function(req, res) {

  var user = req.user;

  Campaign
  .where('cid').all(user.cid)
  .populate('team')
  .sort('-start_time')
  .exec()
  .then(function(campaigns) {
    model_helper.sendCampaignsForApp(user, campaigns, res);
  })
  .then(null, function(err) {
    console.log(err);
    res.send({ result: 0, msg: '获取活动列表失败' });
  });


};



// 获取用户日程

exports.getSchedules = function(req, res) {
  Campaign
  .find({ 'member.uid': req.user._id })
  .sort('-start_time')
  .exec()
  .then(function(campaigns) {
    if (campaigns) {
      var responseData = [];
      campaigns.forEach(function(campaign) {
        var tempObj = {
          _id: campaign._id,
          content: campaign.content,
          start_time: campaign.start_time,
          end_time: campaign.end_time,
          location: campaign.location
        }
        responseData.push(tempObj);
      });
    }
    res.send({ result: 1, msg: '获取日程列表成功', data: responseData });
  })
  .then(null, function(err) {
    console.log(err);
    res.send({ result: 0, msg: '获取日程列表失败' });
  });
};

exports.getUserInfo = function(req, res) {
  User
  .findOne({ _id: req.body._id },{'nickname':1,'realname':1,'introduce':1,'cname':1,'department.name':1,'phone':1,'photo':1})
  .exec()
  .then(function(user) {
    if (user) {
      res.send({
        result: 1,
        msg: '获取用户信息成功',
        user: user
      });
    } else {
      throw 'not found';
    }
  })
  .then(null, function(err) {
    console.log(err);
    res.send({ result: 0, msg: '获取用户信息失败' });
  });
};

exports.editUserInfo = function(req, res, next) {
  User.findOne({_id: req.body._id},function(err,user) {
    if(err || !user){
      console.log('cannot find user');
      res.send({result:0, msg:'获取用户失败'});
    }
    if(req.body.editName==='nickname')
      user.nickname = req.body.editValue;
    else if (req.body.editName==='realname')
      user.realname = req.body.editValue;
    else if (req.body.editName==='introduce')
      user.introduce = req.body.editValue;
    else if (req.body.editName==='phone')
      user.phone = req.body.editValue;
    //todo photo
    user.save(function(err){
      if (!err) {
        res.send({result:1, msg:'修改成功'});
      }
      else{
        next(err);
      }
    });
  });
};

//获取用户简要信息供弹出层查看
exports.getBriefInfo = function(req,res){
  User.findOne({'_id': req.params.userId },{'_id':1,'realname':1,'photo':1,'nickname':1,'department':1,'phone':1,'email':1,'introduce':1},function(err,user){
    if (err || !user){
      console.log('cannot find user');
      return res.send({'result':0,'msg':'用户查询错误'});
    }else{
      // var htmlcontent ="<div class='popover_img'><a href='/users/home/"+user._id+"'><img class='size_80' src='"+user.photo+"'></img></a></div>";
      //   htmlcontent += "<div class='popover_content'><p><a href='/users/home/"+user._id+"'>"+user.nickname;
      //   if(user.realname)//如果填写真名
      //     htmlcontent+="("+user.realname+")";
      //   htmlcontent += "</a></p><p>部门:"+user.department+"</p>";
      //   if(user.phone)
      //     htmlcontent+="<p>电话:"+user.phone+"</p>";
      //   htmlcontent += "<p>Email:"+user.email+"</p></div>";
      //   if(user.introduce)//如果有简介则显示
      //     htmlcontent+="<div class='popover_brief'><p>简介："+user.introduce+"</p></div>";
      //   else
      //     htmlcontent+="<div class='popover_brief'><p>简介：这个人很懒啥都没留下-_-#</p></div>";
      // return res.send({
      //   result: 1,
      //   htmlcontent: htmlcontent
      // });
      res.render('partials/user_brief_card', { user: user });
    }
  });
};



exports.getTimelineForApp = function(req,res){
  var uid = req.params.userId;
  Campaign
  .find({ 'active' : true, 'finish' : true, '$or' : [{'member.uid' : uid}, {'camp.member.uid' : uid }]})
  .where('end_time').lt(new Date())
  .sort('-start_time')
  .skip(req.params.page*blockSize)
  .limit(blockSize)
  .populate('team').populate('cid').populate('photo_album')
  .exec()
  .then(function(campaigns) {
    if (campaigns && campaigns.length >= 0) {
      var time_lines = [];
      campaigns.forEach(function(campaign) {
        var _head, _type,_logo;
        if(campaign.camp.length>0){
          _head = campaign.team[0].name +'对' + campaign.team[1].name +'的比赛';
          _logo = model_helper.arrayObjectIndexOf(campaign.camp[0].member,uid,'uid')>-1 ?campaign.camp[0].logo :campaign.camp[1].logo;
        }
        else if(campaign.team.length==0){
          _head = '公司活动';
          _logo = campaign.cid[0].info.logo;
        }
        else{
          _head = campaign.team[0].name + '活动';
          _logo = campaign.team[0].logo;
        }
        var tempObj = {
          id: campaign._id,
          //head: _head,
          head:campaign.theme,
          logo:_logo,
          content: campaign.content,
          location: campaign.location,
          group_type: campaign.group_type,
          start_time: campaign.start_time,
          provoke:campaign.camp.length>0,
          // photo_list[i].thumbnail_uri是缩略图，200*200，photo_list[i].uri是原图
          photo_list: photo_album_controller.getLatestPhotos(campaign.photo_album, 4)
        };
        time_lines.push(tempObj);
      });
      res.send({ result: 1, msg: '获取用户活动足迹成功', time_lines: time_lines });
    }
    else{
      throw '没有找到活动';
    }
  })
  .then(null, function(err) {
    console.log(err);
    res.send({ result: 0, msg: '获取用户活动足迹失败' });
  });
}


var _apply = function(did,req,res,member){
  Department.findByIdAndUpdate({'_id':did},{'$push':{'member':member}},function(err,department){
    if(err || !department){
      if(res!=null)res.send(500);
    }else{
      //记得发站内信
      if(res!=null)res.send(200);
    }
  });
}

//申请加入某个部门
exports.applyToDepartment = function(req,res){
  var did = req.body.did;
  var member = {
    '_id':req.user._id,
    'nickname':req.user.nickname,
    'photo':req.user.photo,
    'apply_status':'wait'
  };
  _apply(did,req,res,member);
}


//手机app登录更新用户设备信息,推送相关信息等等
var deviceRegister = function (device_info, uid, callback){
  User.findOne({'_id':uid},function (err,user){
    if(err || !user){
      //TODO 生成错误日志
      console.log({'result':0,'msg':'USER_DEVICE_ERROR_USERFETCHFAILED'});
    }else{
      //TODO 登录信息录入后台统计
      var device = user.device;
      var find = false;
      if(device){//曾经绑定过
        for(var i = 0 ; i < device.length; i ++){
          if(device[i].platform === device_info.platform){
            if(device[i].device_type === device_info.device_type){
              if(device[i].device_id === device_info.device_id){    //如果device_id一样就要更新时间(比如两台Android手机)
                find = true;
                user.device[i].update_date = new Date();
                if (device_info.token && device_info.token !== user.device[i].token) {
                  user.device[i].token = device_info.token;
                }
                break;
              }
            }
          }
        }
        //以下两种情况就要新增设备信息
        //1.不同平台(一部iPhone,一部安卓)
        //2.相同平台,不同设备id
        if(!find){
          //如果不一样，就push
          user.device.push({
            platform:device_info.platform,
            version:device_info.version,
            device_id:device_info.device_id,
            device_type:device_info.device_type,
            user_id:device_info.user_id,                //只有Android的百度云推送才会用到
            update_date:new Date(),
            token: device_info.token ? device_info.token : null
          });
        }
      }else{//第一次绑定
        user.device = [];
        user.device.push({
          platform:device_info.platform,
            version:device_info.version,
            device_id:device_info.device_id,
            device_type:device_info.device_type,
            user_id:device_info.user_id,                //只有Android的百度云推送才会用到
            update_date:new Date(),
            token: device_info.token ? device_info.token : null
        });
      }
      user.save(function(err){
        if(err){
          console.log({'result':0,'msg':'USER_DEVICE_UPDATE_ERROR','data':err});
          callback && callback(err);
        }else{
          callback && callback(null);
        }
      });
    }
  });
}

//手机app退出 解绑用户设备信息,推送相关信息等等
var deviceUnregister = function(device_info,uid){
  User.findOne({'_id':uid},function (err,user){
    if(err || !user){
      //TODO 生成错误日志
      console.log({'result':0,'msg':'USER_DEVICE_ERROR_USERFETCHFAILED'});
    }else{
      //TODO 登录信息录入后台统计
      var device = user.device;
      console.log(device, device_info, 'dv,dvinfo');
      if(device){
        for(var i = 0 ; i < device.length; i ++){
          console.log(device[i].platform, device_info.platform, 'cp platform')
          if(device[i].platform == device_info.platform){
            if(device[i].platform==='Android'){
              if(device[i].user_id === device_info.user_id){
                user.device.splice(i,1);
              }
            }
            else{
              console.log(device[i].token, device_info.token, 'cp token')
              if(device[i].token === device_info.token){
                user.device.splice(i,1);
              }
            }
          }
        }
        user.save(function(err){
          if(err){
            console.log({'result':0,'msg':'USER_DEVICE_UPDATE_ERROR','data':err});
          }else{
            ;
          }
        });
      }
    }
  });
}

exports.updateCommentTime =function(req, res) {
  if(req.role=='OWNER'){
    req.user.last_comment_time = new Date();
    req.user.save(function(err){
      if(err){
        res.send({result:0});
      }else{
        res.send({result:1});
      }

    });
  }
  else{
    res.send({result:0});
  }
}

/**
 * 重发激活邮件
 * req.body:
 *   email: String // 公司邮箱
 */
exports.resendActiveEmail = function(req, res, next) {
  var sendInvalidMsg = function(msg) {
    res.status(400).send({msg: msg});
  };
  if (!req.body.email) {
    return sendInvalidMsg('缺少email');
  }
  else if (!validator.isEmail(email)) {
    return sendInvalidMsg('email无效');
  }
  var email = req.body.email.toLowerCase();
  Company.findOne({'info.email': email}).exec()
    .then(function(company) {
      // 是快速注册的公司
      if (company && company.status.verification === 1) {
        // 因为status.active默认为false，所以忽略
        // 按理说，未激活的公司不应该是被管理员屏蔽的状态
        if (company.status.mail_active) {
          res.status(400).send({msg: '已经激活，请直接登录', isActive: true});
        }
        else {
          resendCompanyActiveEmail(company);
          res.send({msg: '已经重新发送激活邮件', hasResend: true});
        }
      }
      else {
        // 不是快速注册
        return User.findOne({email: email}).exec().then(function(user) {
          if (!user) {
            res.status(400).send({msg: '该邮箱对应的用户不存在'});
            return;
          }

          if (user.mail_active) {
            res.status(400).send({msg: '已经激活，请直接登录', isActive: true});
          }
          else {
            resendUserActiveEmail(user);
            res.send({msg: '已经重新发送激活邮件', hasResend: true});
          }
        });
      }
    })
    .then(null, next);

  function resendCompanyActiveEmail(company) {
    Config.findOne({name: config.CONFIG_NAME}).exec()
      .then(function(config) {
        switch (config.smtp) {
        case '163':
          mail.sendQuickRegisterActiveMail(company.info.email, company.info.name, company.id, req.headers.host);
          break;
        case 'sendcloud':
          // 默认使用sendcloud发送
          // waterfall
        default:
          sendcloud.sendQuickRegisterActiveMail(company.info.email, company.info.name, company.id, req.headers.host);
        }
      })
      .then(null, function(err) {
        console.log(err.stack || err);
      });
  }

  function resendUserActiveEmail(user) {
    Config.findOne({name: config.CONFIG_NAME}).exec()
      .then(function(config) {
        switch (config.smtp) {
        case '163':
          mail.sendStaffActiveMail(user.email, user.id, user.cid.toString(), req.headers.host);
          break;
        case 'sendcloud':
          // 默认使用sendcloud发送
          // waterfall
        default:
          sendcloud.sendStaffActiveMail(user.email, user.id, user.cid.toString(), req.headers.host);
        }
      })
      .then(null, function(err) {
        console.log(err.stack || err);
      });
  }
};