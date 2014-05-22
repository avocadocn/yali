'use strict';

exports.render = function(req, res) {
  console.log('SESSION',req.session.test);
  res.render('index', {
      user: req.user ? JSON.stringify(req.user) : 'null'
  });
};
