'use strict';

/**
 * Module dependencies.
 */
var meanConfig = require('../../config/config');
var mongoose = require('mongoose');
var ShortUrl = mongoose.model('ShortUrl');
var path = require('path');
var fs = require('fs');

exports.skipUrl = function(req, res) {
  var id = req.params.shortId;
  ShortUrl.findOne({shortId:id}, function(err, shortUrl) {
    if(err) {
      return res.status(500).send({msg:'服务器出错'});
    }
    if(!shortUrl) {
      return res.sendStatus(404);
    }
    // var url = shorturl.url;
    return res.redirect(shortUrl.url);
  })
}

exports.home = function(req, res) {
  res.sendfile('templates/index.html');
};
exports.template = function(req, res, next) {
  var dir = 'templates/'+req.params.template+'.html';
  if (!fs.existsSync(dir)) {
    res.status(404)
    var err = new Error();
    err.status = 404;
    next(err);
  }
  else {
    res.sendfile(dir);
  }
};

exports.introduce = function(req, res) {
  var deviceAgent = req.headers["user-agent"].toLowerCase();
  var agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
  var url = agentID ? 'templates/introduce.html' :'templates/index.html';
  res.sendfile(url);
};