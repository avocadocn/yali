'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  meanConfig = require('../../config/config');

exports.renderSignupPage = function(req, res) {
  var deviceAgent = req.headers["user-agent"].toLowerCase();
  var agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
  var url = agentID ? 'templates/signup/signup_phone.html' :'templates/signup/signup_website.html';
  res.sendfile(url);
};

exports.renderSignupSuccessPage = function(req, res) {
  var deviceAgent = req.headers["user-agent"].toLowerCase();
  var agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
  var url = agentID ? 'templates/signup/signup_phone_ok.html' :'templates/signup/signup_website_ok.html';
  res.sendfile(url);
};

exports.renderSignupFailPage = function(req, res) {
  var deviceAgent = req.headers["user-agent"].toLowerCase();
  var agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
  var url = agentID ? 'templates/signup/signup_phone_error.html' :'templates/signup/signup_website_error.html';
  res.sendfile(url);
};