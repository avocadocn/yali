'use strict';

exports.render = function(req, res) {
  if(req.session.Global != undefined && req.session.Global != null && req.session.Global != ""){
    if(req.session.Global.role==="HR"){
      res.redirect('/company/home');
    }else{
      if(req.session.Global.role != ""){
        res.redirect('/users/home');
      }else{
        res.render('index', {
          'Global':undefined
        });
      }
    }
  }else{
    res.render('index', {
        'Global':undefined
    });
  }
};


exports.header = function(req,res){
  console.log('dsds');
  var authenticated = false;
  if(req.Global){
    authenticated = true;
    res.send({
      'nav_name':Global.nav_name,
      'nav_logo':Global.nav_logo,
      'authenticated':authenticated,
      'role':Global.role
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
