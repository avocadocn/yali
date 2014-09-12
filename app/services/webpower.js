'use strict';

var soap = require('soap');
var async = require('async');
var encrypt = require('../middlewares/encrypt');

var website_config = require('../config/config');

var config = {
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



exports.sendStaffResetPwdMail = function (email, uid, host, callback) {

  var end_callback = callback;

  var reset_link = 'http://' + host + '/users/resetPwd?key=' + encrypt.encrypt(uid, website_config.SECRET) + '&uid=' + uid + '&time=' + encrypt.encrypt(new Date().toString(), website_config.SECRET);

  soap.createClient(config.wsdl, function (err, client) {

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
        // TO DO: 修改用户的重置密码链接(还没处理没有找到该用户的情况)
        client.editRecipient({
          login: config.login,
          campaignID: config.campaignID,
          recipientID: recipient.id,
          recipientData: {
            fields: [
              {
                name: 'user_reset_pwd_link',
                value: reset_link
              }
            ]
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
      },
      function (recipient_id, callback) {
        client.sendSingleMailing({
          login: config.login,
          campaignID: config.campaignID,
          mailingID: 12,
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

}