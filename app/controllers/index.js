'use strict';
var schedule = require('../services/schedule'),
    mongoose = require('mongoose'),
    config = require('../config/config'),
    mail = require('../services/mail'),
    webpower = require('../services/webpower');
var sha1 = require('sha1');
var token = "donler";
exports.render = function(req, res) {
  // if(req.session.Global != undefined && req.session.Global != null && req.session.Global != ""){
  //   if(req.session.Global.role==="HR"){
  //     res.redirect('/company/home');
  //   }else{
  //     if(req.session.Global.role ==='USER'){
  //       res.redirect('/users/home');
  //     }else{
  //       res.render('index');
  //     }
  //   }
  // }else{
  //   res.render('index');
  // }
if (req.user) {
    if (req.user.provider === 'company') {
       return res.redirect('/company/home');
    }
    if (req.user.provider === 'user') {
      return res.redirect('/users/home');
    }
  }
  return res.render('index');
};

// exports.count = function(req,res){
//   schedule.countCampaign();
//   return res.send('小组活动统计更新成功');
// }
// exports.finish = function(req,res){
//   schedule.finishCampaign();
//   return res.send('活动自动完成更新成功');
// }
exports.header = function(req,res){
  var authenticated = false;
  if(req.Global){
    authenticated = true;
    res.send({
      'nav_name':req.Global.nav_name,
      'nav_logo':req.Global.nav_logo,
      'authenticated':authenticated,
      'role':req.Global.role
    });
  } else {
    res.send({
      'authenticated':authenticated
    });
  }
}


exports.about = function(req, res) {
  res.render('about');
};

exports.law = function(req, res) {
  res.render('law');
};

exports.privacy = function(req, res) {
  res.render('privacy');
};

exports.question = function(req, res) {
  res.render('question');
};

exports.contact = function(req, res) {
  res.render('contact');
};


exports.appdownload = function(req, res) {
  var deviceAgent = req.headers["user-agent"].toLowerCase();
  var weixin = deviceAgent.match(/micromessenger/);
  var iosAgentID = deviceAgent.match(/(iphone|ipod|ipad)/);
  var androidAgentID = deviceAgent.match(/android/);
  if (weixin) {
    return res.render('users/app_download',{weixin:true});
  }
  else if (iosAgentID) {
    return res.redirect('https://itunes.apple.com/cn/app/id916162839?mt=8');
  }
  else if(androidAgentID) {
    return res.redirect('/Donler.apk');
  }
  else {
    return res.render('users/app_download_pc');
  }
};
exports.feedback = function(req, res) {
  var sendByWebpower = function () {
    webpower.sendFeedBackMail(
      req.body.username,
      req.body.content,
      function (err) {
        if (err) {
          // TO DO: 发送失败待处理
          console.log(err);
          res.send({result:0,msg:'发送失败'});
        }
        res.send({result:1,msg:'发送成功'});
      }
    );
  };
  mongoose.model('Config').findOne({ name: config.CONFIG_NAME }).exec()
  .then(function (config) {
    if (!config || !config.smtp || config.smtp === 'webpower') {
      sendByWebpower();
    } else if (config.smtp === '163') {
      mail.sendFeedBackMail(req.body.username, req.body.content);
      res.send({result:1,msg:'发送成功'});
    }
  })
  .then(null, function (err) {
    console.log(err);
    sendByWebpower();
  });
}
exports.test = function(req, res) {
  res.render('test');
};
