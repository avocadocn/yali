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


function sessionJudge(req){
  var g = undefined;
  if(req.session.Global != undefined && req.session.Global != null && req.session.Global != ""){
    if(req.session.Global.role != "" && req.session.Global.role != undefined && req.session.Global.role != null){
      g = req.session.Global;
    }
  }
  return g;
}
exports.about = function(req, res) {
  res.render('about',{
    'Global':sessionJudge(req)
  });
};

exports.law = function(req, res) {
  res.render('law',{
    'Global':sessionJudge(req)
  });
};

exports.privacy = function(req, res) {
  res.render('privacy',{
    'Global':sessionJudge(req)
  });
};

exports.question = function(req, res) {
  res.render('question',{
    'Global':sessionJudge(req)
  });
};

exports.contact = function(req, res) {
  res.render('contact',{
    'Global':sessionJudge(req)
  });
};
exports.test = function(req, res) {
  res.render('test',{
    'Global':sessionJudge(req)
  });
};
