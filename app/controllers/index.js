'use strict';
  var schedule = require('../services/schedule');
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

exports.count = function(req,res){
  schedule.countCampaign();
  return res.send('小组活动统计更新成功');
}
exports.finish = function(req,res){
  schedule.finishCampaign();
  return res.send('活动自动完成更新成功');
}
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
exports.test = function(req, res) {
  res.render('test');
};
