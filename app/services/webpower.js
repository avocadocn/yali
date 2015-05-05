'use strict';

var soap = require('soap');
var async = require('async');
var encrypt = require('../middlewares/encrypt');

var website_config = require('../config/config');

var global_config = {
  wsdl: 'http://donler.dmdelivery.com/x/soap-v3/wsdl.php',
  login: {
    username: 'cahavar',
    password: 'Ghvimts5%'
  },
  campaignID: 1,
  mail: {
    user: {
      active: 14,
      reset_pwd: 12
    },
    company: {
      active: 15,
      reset_pwd: 13
    },
    feedback: 17
  }
};

/**
 * 发送邮件
 * @param  {Object} config webpower的配置
 * config: {
 *   login: {
 *     username: String,
 *     password: String
 *   },
 *   campaignID: Int,
 *   mailingID: Int
 * }
 * @param  {String} email  目标邮箱
 * @param  {Array} fields 添加的用户数据, [{name:'...', value:'...'}, {...}, ...]
 * @param  {Function} callback callback(err)
 */
var sendMail = function (config, email, fields, callback) {
  var end_callback = callback;

  soap.createClient(global_config.wsdl, function (err, client) {

    if (err) { return console.log(err); }

    async.waterfall([
      function (callback) {
        // 获取用户id
        client.getRecipientsByMatch({
          login: config.login,
          campaignID: config.campaignID,
          recipientData: {
            fields: [
              {
                name: 'email',
                value: email
              }
            ]
          }
        }, function (err, result) {
          if (err) { return callback(err); }
          else {
            // if not match, recipient = {}
            var recipient = result.getRecipientsByMatch_result.recipients;
            callback(null, recipient);
          }
        });
      },
      function (recipient, callback) {
        if (recipient) {
          client.editRecipient({
            login: config.login,
            campaignID: config.campaignID,
            recipientID: recipient.id,
            recipientData: {
              fields: fields
            }
          }, function (err, result) {
            if (err) { return callback(err); }
            else {
              if (result.editRecipient_result.status === 'OK') {
                callback(null, result.editRecipient_result.id);
              } else {
                console.log(result);
                callback('editRecipient failed');
              }
            }
          });
        } else {
          fields.push({
            name: 'email',
            value: email
          });
          client.addRecipient({
            login: config.login,
            campaignID: config.campaignID,
            groupIDs: { 'xsd:int': [81] },
            recipientData: {
              fields: fields
            }
          }, function(err, result) {
            if (err) { return callback(err); }
            else {
              if (result.addRecipient_result.status === 'OK') {
                callback(null, result.addRecipient_result.id);
              } else {
                console.log(result);
                callback('addRecipient failed');
              }
            }
          });
        }
      },
      function (recipient_id, callback) {
        client.sendSingleMailing({
          login: config.login,
          campaignID: config.campaignID,
          mailingID: config.mailingID,
          recipientID: recipient_id
        }, function (err, result) {
          if (err) { return callback(err); }
          else {
            // 如果发送成功, sendSingleMailing_result === true
            if (result.sendSingleMailing_result) {
              callback(null);
            } else {
              console.log(result);
              callback('sendSingleMailing failed');
            }
          }
        });

      }

    ], function (err, result) {
      if (end_callback) {
        end_callback(err);
      }
    });

  });
};



exports.sendStaffResetPwdMail = function (email, uid, host, callback) {

  var reset_link = 'http://' + host + '/users/resetPwd?key=' + encrypt.encrypt(uid, website_config.SECRET)
    + '&uid=' + uid + '&time=' + encrypt.encrypt(new Date().toString(), website_config.SECRET);

  var reset_config = {
    login: global_config.login,
    campaignID: global_config.campaignID,
    mailingID: global_config.mail.user.reset_pwd
  };

  sendMail(reset_config, email, [{
    name: 'user_reset_pwd_link',
    value: reset_link
  }], callback);

};

exports.sendCompanyResetPwdMail = function (email, uid, host, callback) {

  var reset_link = 'http://' + host + '/company/resetPwd?key=' + encrypt.encrypt(uid, website_config.SECRET)
    + '&uid=' + uid + '&time=' + encrypt.encrypt(new Date().toString(), website_config.SECRET);

  var reset_config = {
    login: global_config.login,
    campaignID: global_config.campaignID,
    mailingID: global_config.mail.company.reset_pwd
  };

  sendMail(reset_config, email, [{
    name: 'company_reset_pwd_link',
    value: reset_link
  }], callback);

};


exports.sendStaffActiveMail = function (email, uid, cid, host, callback) {

  var active_link = 'http://' + host + '/users/setProfile?key=' + encrypt.encrypt(uid, website_config.SECRET)
    + '&uid=' + uid + '&cid=' + cid;

  var active_config = {
    login: global_config.login,
    campaignID: global_config.campaignID,
    mailingID: global_config.mail.user.active
  };

  sendMail(active_config, email, [{
    name: 'user_active_link',
    value: active_link
  }], callback);

};

// exports.sendNewStaffActiveMail = function (email, uid, cid, host, callback) {

//   var active_link = 'http://' + host + '/users/mailActive?key=' + encrypt.encrypt(uid, website_config.SECRET)
//     + '&uid=' + uid + '&cid=' + cid;

//   var active_config = {
//     login: global_config.login,
//     campaignID: global_config.campaignID,
//     mailingID: global_config.mail.user.active
//   };

//   sendMail(active_config, email, [{
//     name: 'user_active_link',
//     value: active_link
//   }], callback);

// };

exports.sendFeedBackMail = function (email, content, callback) {


  var active_config = {
    login: global_config.login,
    campaignID: global_config.campaignID,
    mailingID: global_config.mail.feedback
  };

  sendMail(active_config, 'service@donler.com', [{
    name: 'feedback_user_email',
    value: email
  },{
    name: 'feedback_content',
    value: content
  }], callback);

};

/**
 * 快速注册邮箱验证
 * @param {String} who 接收人的邮件地址
 * @param {String} name 公司名
 * @param {String} id HR的公司id
 */
exports.sendQuickRegisterActiveMail = function(who, name, id, host) {
  var from = '动梨<service@donler.com>';
  var to = who;
  var subject = name + '快速注册激活';
  var description = '我们收到您在动梨的注册申请信息，请点击下面的链接来激活帐户：';
  var link = 'http://' + host + '/company/quickvalidate?key=' + encrypt.encrypt(id,config.SECRET) + '&id=' + id;
  fs.readFile(rootConfig.root+'/app/views/partials/mailTemplate.jade', 'utf8', function (err, data) {
    if (err) {
      console.log(err);
      console.log(err.stack);
      return;
    }
    var fn = jade.compile(data);
    var html = fn({
      'title': '快速注册激活',
      'host': siteProtocol + host,
      'who': who,
      'description': description
    });
    sendMail({
      from: from,

      to: to,
      subject: subject,
      html: html
    });
  });
};
/**
 * 公司操作指南
 * @param {String} who 接收人的邮件地址
 * @param {String} id HR的公司id
 */
exports.sendCompanyOperationGuideMail = function(who, id, host) {
  var from = '动梨<service@donler.com>';
  var to = who;
  var subject = '公司操作指南';
  var description = '公司操作指南';
  fs.readFile(rootConfig.root+'/app/views/partials/mailTemplate.jade', 'utf8', function (err, data) {
    if (err) {
      console.log(err);
      console.log(err.stack);
      return;
    }
    var fn = jade.compile(data);
    var html = fn({
      'title': '公司操作指南',
      'host': siteProtocol + host,
      'who': who,
      'description': description,
      'link': link
    });
    sendMail({
      from: from,

      to: to,
      subject: subject,
      html: html
    });
  });
};
/**
 * 邀请同事提示邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} id HR的公司id
 */
exports.sendInviteColleageMail = function(who, key, id, host) {
  var from = '动梨<service@donler.com>';
  var to = who;
  var subject = '邀请同事提示邮件';
  var description = '快去邀请您的同事来注册吧';
  var qrcodeURI = 'http://' + host +'/img/qrcode/'+id+'.png';
  var link = 'http://' + host + '/users/invite?key=' + key + '&cid=' + id;
  fs.readFile(rootConfig.root+'/app/views/partials/mailTemplate.jade', 'utf8', function (err, data) {
    if (err) {
      console.log(err);
      console.log(err.stack);
      return;
    }
    var fn = jade.compile(data);
    var html = fn({
      'title': '邀请邮件',
      'host': siteProtocol + host,
      'who': who,
      'description': description,
      'link': link,
      'qrcodeURI':qrcodeURI
    });
    sendMail({
      from: from,

      to: to,
      subject: subject,
      html: html
    });
  });
};

