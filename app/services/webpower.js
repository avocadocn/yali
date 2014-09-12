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
      reset_pwd: 12
    }
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
                callback('editRecipient failed');
              }
            }
          });
        } else {
          client.addRecipient({
            login: config.login,
            campaignID: config.campaignID,
            groupIDs: { 'xsd:int': [81] },
            recipientData: {
              fields: fields.push({
                name: 'email',
                value: email
              })
            }
          }, function(err, result) {
            if (err) { return callback(err); }
            else {
              if (result.addRecipient_result.status === 'OK') {
                callback(null, result.addRecipient_result.id);
              } else {
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
              callback('sendSingleMailing failed');
            }
          }
        });

      }

    ], function (err, result) {
      end_callback(err);
    });

  });
};



exports.sendStaffResetPwdMail = function (email, uid, host, callback) {

  var reset_link = 'http://' + host + '/users/resetPwd?key=' + encrypt.encrypt(uid, website_config.SECRET) + '&uid=' + uid + '&time=' + encrypt.encrypt(new Date().toString(), website_config.SECRET);

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




