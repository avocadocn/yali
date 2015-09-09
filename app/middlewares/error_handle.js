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
      return res.send({ msg: msg });
    }
  } else if (res.statusCode === 404) {
    if (!req.xhr) {
      return res.sendfile('templates/404.html');
    } else {
      return res.send({ msg: msg });
    }
  } else if (res.statusCode >= 500) {
    if (!req.xhr) {
      return res.sendfile('templates/500.html');
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

