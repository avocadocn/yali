var mongoose = require('mongoose'),
  ErrorStatistics = mongoose.model('ErrorStatistics');

module.exports = function(err, req, res, next) {
  if (res.statusCode < 400) {
    res.status(500);
  }
  if (err.name !== 'Error') {
    var _err = err;
    var msg = err;
    console.log(_err);
  } else {
    var _err = err.stack;
    var msg = err.message;
    console.log(msg);
    console.log(_err);
  }
  if (res.statusCode === 403) {
    if (!req.xhr) {
      return res.redirect('/');
    } else {
      return res.send(403, { msg: msg });
    }
  } else if (res.statusCode === 404) {
    if (!req.xhr) {
      return res.status(404).render('404', {
        url: req.originalUrl,
        error: 'not found'
      });
    } else {
      return res.send(404, { msg: msg });
    }
  } else if (res.statusCode >= 500) {

    var log = new ErrorStatistics({
      error: {
        kind: res.statusCode.toString(),
        body: _err,
        headers: req.headers,
        method: req.method,
        url: req.url
      }
    });
    if (req.user) {
      log.error.target = {
        kind: req.user.provider,
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email
      };
      if (req.user.provider === 'company') {
        log.error.target.name = req.user.info.name;
      } else if (req.user.provider === 'user') {
        log.error.target.name = req.user.nickname;
      }
    }
    log.save(function(err) {
      if (err) console.log(err);
    });
    if (!req.xhr) {
      return res.status(res.statusCode).render('500');
    } else {
      return res.send(res.statusCode);
    }
  } else {
    if (!req.xhr) {
      return res.redirect('/');
    } else {
      return res.send(res.statusCode, { msg: msg });
    }
  }
};