'use strict';

/**
 * Module dependencies.
 */
var express = require('express'),
  consolidate = require('consolidate'),
  mongoose = require('mongoose'),
  mongoStore = require('connect-mongo')(express),
  flash = require('connect-flash'),   //session operate
  helpers = require('view-helpers'),
  config = require('./config'),
  middleware = require('./middleware'),
  errorHandle = require('../app/middlewares/error_handle'),
  tokenService = require('../app/services/token'),
  i18n = require('i18n'),
  fs = require('fs');

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
    // The cookieParser should be above session
    app.use(express.cookieParser());
    app.use(i18n.init);
    // Request body parsing middleware should be above methodOverride
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.methodOverride());

    // Express/Mongo session storage
    app.use(express.session({
      secret: config.sessionSecret,
      /*
       store: new RedisStore({
       db: db.connection.db,
       port: config.port
       })
       */
      store: new mongoStore({
        db: db.connection.db,
        collection: config.sessionCollection
      })
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

    // Use passport sessions
    app.use(passport.initialize());
    app.use(passport.session());

    app.use(function (req, res, next) {

      if (req.user && req.user.provider === 'user' && !req.user.company_official_name) {
        mongoose.model('Company')
          .findById(req.user.cid)
          .exec()
          .then(function (company) {
            req.user.company_official_name = company.info.official_name;
            req.user.save(function (err) {
              if (err) {
                console.log(err);
              }
              res.locals.global_user = req.user;
              next();
            })
          })
          .then(null, function (err) {
            console.log(err);
            res.locals.global_user = req.user;
            next();
          })

      } else {
        res.locals.global_user = req.user;
        next();
      }
    });

    // Connect flash for flash messages
    app.use(flash());

    // Routes should be at the last
    app.use(app.router);

    // Setting the fav icon and static folder
    app.use(express.favicon());
    app.use(express.static(config.root + '/public'));

    app.use(errorHandle);

    app.use(tokenService.verifying(app));
    app.use(function (req, res, next) {
      if (req.url.indexOf('/company/manager/templates') === -1) {
        return next();
      }
      var unAuth = function () {
        res.status(401).send({ isLogin: false });
      };
      if (!req.tokenUser || req.tokenUser.type !== 'company') {
        unAuth();
      } else {
        next();
      }
    });

    app.use(
      '/company/manager',
      express.static(config.root + '/company_manager_client')
    );

  });
};
