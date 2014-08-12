var mongoose = require('mongoose'),
  ErrorStatistics = mongoose.model('ErrorStatistics');

exports.errorHandle = function(err, req, res, next) {
  if (res.statusCode === 403) {
    if (!req.xhr) {
      return res.redirect('/');
    } else {
      return res.send(403, { msg: err });
    }
  } else if (res.statusCode === 404) {
    if (!req.xhr) {
      return res.status(404).render('404', {
        url: req.originalUrl,
        error: err
      });
    } else {
      return res.send(404, { msg: err });
    }
  } else {
    var log = new ErrorStatistics({
      error: {
        kind: res.statusCode.toString(),
        body: JSON.stringify(err)
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
    log.save(console.log);
    if (!req.xhr) {
      return res.status(500).render('500');
    } else {
      return res.send(500, { msg: err });
    }
  }
};