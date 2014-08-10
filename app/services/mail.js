'use strict';

var mailer = require('nodemailer'),
    encrypt = require('../middlewares/encrypt'),
    config = require('../config/config'),
    error = require('../controllers/error'),
    rootConfig = require('../../config/config'),
    jade = require('jade'),
    fs = require('fs');
var transport = mailer.createTransport('SMTP', config.MAIL_OPTION);

var siteProtocol = 'http://';
/**
 * Send an email
 * @param {Object} data 邮件对象
 */
var sendMail = function (data,target,err_type) {
  transport.sendMail(data, function (err) {
    if (err) {
      error.addErrorItem(target,err_type,err);
      // 写为日志
      console.log(err_type,err);
    }
  });
};

/**
 * 发送激活通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} name 公司名
 * @param {String} id HR的公司id
 */
exports.sendCompanyActiveMail = function (who, name, id, host) {
  var from = '动梨<service@donler.com>';
  var to = who;
  var subject = name + ' 动梨账号激活';
  var content = '<p>我们收到您在动梨的申请信息，请点击下面的链接来激活帐户：</p>' +
    '<a style="text-decoration: none; word-break: break-all;" href="http://' + host + '/company/validate?key=' + encrypt.encrypt(id,config.SECRET) + '&id=' + id + '">http://' + host + '/company/validate?key=' + encrypt.encrypt(id,config.SECRET) + '&id=' + id + '</a>';

    fs.readFile(rootConfig.root+'/app/views/partials/mailTemplate.jade', 'utf8', function (err, data) {
        if (err) throw err;
        var fn = jade.compile(data);
        var html = fn({'title':'注册激活','host':siteProtocol+host,'who':who,'content':content});
        sendMail({
          from: from,
          to: to,
          subject: subject,
          html: html
        });
    });
};

exports.sendStaffActiveMail = function(who, uid, cid, host) {
  var from = '动梨<service@donler.com>';
  var to = who;
  var subject = '动梨账号激活';
  var content = '<p>我们收到您在动梨的申请信息，请点击下面的链接来激活帐户：</p>' +
    '<a style="text-decoration: none; word-break: break-all;" href="http://' + host + '/users/setProfile?key=' + encrypt.encrypt(uid, config.SECRET) +
    '&uid=' + uid + '&cid=' + cid + '">http://' + host + '/users/setProfile?key=' + encrypt.encrypt(uid, config.SECRET) +
    '&uid=' + uid + '&cid=' + cid + '</a>';

    fs.readFile(rootConfig.root+'/app/views/partials/mailTemplate.jade', 'utf8', function (err, data) {
        if (err) throw err;
        var fn = jade.compile(data);
        var html = fn({'title':'注册激活','host':siteProtocol+host,'who':who,'content':content});
        sendMail({
          from: from,
          to: to,
          subject: subject,
          html: html
        },{
          type:'user',
          _id:uid,
          name:null,
          email:who
        },'USER_CREATE_EMAIL_SEND_ERROR');
    });
};
exports.sendStaffResetPwdMail = function(who, uid, host) {
  var from = '动梨<service@donler.com>';
  var to = who;
  var subject = '动梨密码重置';
  var content = '<p>我们收到您在动梨的密码重置申请信息，请点击下面的链接来重置密码（30分钟内有效）：</p>' +
    '<a style="text-decoration: none; word-break: break-all;" href="http://' + host + '/users/resetPwd?key=' + encrypt.encrypt(uid, config.SECRET) +
    '&uid=' + uid +'&time='+encrypt.encrypt(new Date().toString(), config.SECRET)+
    '">http://' + host + '/users/resetPwd?key=' + encrypt.encrypt(uid, config.SECRET) +
    '&uid=' + uid +'&time='+encrypt.encrypt(new Date().toString(), config.SECRET)+'</a>';

    fs.readFile(rootConfig.root+'/app/views/partials/mailTemplate.jade', 'utf8', function (err, data) {
        if (err) throw err;
        var fn = jade.compile(data);
        var html = fn({'title':'重置密码','host':siteProtocol+host,'who':who,'content':content});
        sendMail({
          from: from,
          to: to,
          subject: subject,
          html: html
        },{
          type:'user',
          _id:uid,
          name:null,
          email:who
        },'USER_PWD_RESET_EMAIL_SEND_ERROR');
    });
};
exports.sendCompanyResetPwdMail = function(who, uid, host) {
  var from = '动梨<service@donler.com>';
  var to = who;
  var subject = '动梨密码重置';
  var content = '<p>我们收到您在动梨的密码重置申请信息，请点击下面的链接来重置密码（30分钟内有效）：</p>' +
    '<a style="text-decoration: none; word-break: break-all;" href="http://' + host + '/company/resetPwd?key=' + encrypt.encrypt(uid, config.SECRET) +
    '&uid=' + uid +'&time='+encrypt.encrypt(new Date().toString(), config.SECRET)+
    '">http://' + host + '/company/resetPwd?key=' + encrypt.encrypt(uid, config.SECRET) +
    '&uid=' + uid +'&time='+encrypt.encrypt(new Date().toString(), config.SECRET)+'</a>';
    fs.readFile(rootConfig.root+'/app/views/partials/mailTemplate.jade', 'utf8', function (err, data) {
        if (err) throw err;
        var fn = jade.compile(data);
        var html = fn({'title':'重置密码','host':siteProtocol+host,'who':who,'content':content});
        sendMail({
          from: from,
          to: to,
          subject: subject,
          html: html
        },{
          type:'company',
          _id:uid,
          name:null,
          email:who
        },'COMPANY_PWD_RESET_EMAIL_SEND_ERROR');
    });
};