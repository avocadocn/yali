'use strict';

exports.render = function(req, res) {
  res.render('index', {
      user: req.user ? JSON.stringify(req.user) : 'null'
  });
};
// exports.test = function(req, res) {
//   var host = req.headers.host;
//   var who = 'afeiszh@gmail.com';
//   var content = '<p>我们收到您在动梨的申请信息，请点击下面的链接来激活帐户：</p><a href="'+host+'"></a>';
//   res.render('partials/mailTemplate', {'title':'注册激活','host':"http://"+host,'who':who,'content':content});
// };