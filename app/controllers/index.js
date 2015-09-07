'use strict';

/**
 * Module dependencies.
 */
var meanConfig = require('../../config/config');
var mongoose = require('mongoose');
var ShortUrl = mongoose.model('ShortUrl');


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
exports.template = function(req, res) {
  res.sendfile('templates/'+req.params.template+'.html');
};
