'use strict';

exports.render = function(req, res) {
  res.render('index', {
      user: req.user ? JSON.stringify(req.user) : 'null'
  });
};


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
