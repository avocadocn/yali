'use strict';

/**
 * Module dependencies.
 */
var express = require('express'),
  consolidate = require('consolidate'),
  mongoose = require('mongoose'),
  flash = require('connect-flash'),   //session operate
  helpers = require('view-helpers'),
  config = require('./config'),
  errorHandle = require('../app/middlewares/error_handle'),
  tokenService = require('../app/services/token'),
  i18n = require('i18n'),
  fs = require('fs');

var session = require('express-session'),
  RedisStore = require('connect-redis')(session);
module.exports = function (app, passport, db) {
  i18n.configure({
    locales: ['zh-cn'],
    directory: __dirname + '/locales',
    defaultLocale: 'zh-cn'
  });

  app.set('showStackError', true);
  app.set('tokenSecret', config.token.secret);
  app.set('tokenExpires', config.token.expires);

  // Prettify HTML
  app.locals.pretty = true;
  // cache=memory or swig dies in NODE_ENV=production
  app.locals.cache = 'memory';

  // Should be placed before express.static
  // To ensure that all assets and data are compressed (utilize bandwidth)
  app.use(express.compress({
    filter: function (req, res) {
      return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
    },
    // Levels are specified in a range of 0 to 9, where-as 0 is
    // no compression and 9 is best compression, but slowest
    level: 9
  }));

  // Only use logger for development environment
  if (process.env.NODE_ENV === 'development') {
    app.use(express.logger('dev'));
  }

  // assign the template engine to .jade files
  app.engine('jade', consolidate[config.templateEngine]);

  // set .jade as the default extension
  app.set('view engine', 'jade');

  // Set views path, template engine and default layout
  app.set('views', config.root + '/app/views');

  // Enable jsonp
  app.enable('jsonp callback');

  app.configure(function () {

    app.use(i18n.init);
    // Request body parsing middleware should be above methodOverride
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.methodOverride());

    var hour = 3600000;
    // Express/Redis session storage
    app.use(session({
      secret: config.sessionSecret,
      store: new RedisStore(),
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: hour * 24 * 7
      }
    }));


    //app.use(middleware.auth_user);

    // Dynamic helpers
    app.use(helpers(config.app.name));
    app.use(function (req, res, next) {
      // 记录start time:
      var exec_start_at = Date.now();
      // 保存原始处理函数:
      var _send = res.send;
      // 绑定我们自己的处理函数:
      res.send = function () {
        // 发送Header:
        res.set('X-Execution-Time', String(Date.now() - exec_start_at + "ms"));
        // 调用原始处理函数:
        return _send.apply(res, arguments);
      };
      next();
    });

    // Connect flash for flash messages
    app.use(flash());

    // Routes should be at the last
    app.use(app.router);
    // Setting the fav icon and static folder
    app.use(express.favicon(config.root + '/public/img/icons/favicon.ico'));
    app.use(express.static(config.root + '/public'));
    app.use(
      '/company/manager',
      express.static(config.root + '/company_manager_client')
    );
    app.use(errorHandle);
    app.use(function (req, res, next) {
      res.status(404);
      if (!req.xhr) {
        if (req.accepts('html')) {
          return res.sendfile('templates/404.html');
        }
        if (req.accepts('json')) {
          res.send({ error: 'Not found' });
          return;
        }
        res.type('txt').send('Not found');
      } else {
        return res.send({ msg: "Not found" });
      }
    });
  });
};






