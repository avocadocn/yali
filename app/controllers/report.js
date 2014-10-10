//举报功能

'use strict';

var mongoose = require('mongoose'),
    Report = mongoose.model('Report');

exports.pullReport = function  (req, res) {
  // body...
}

exports.pushReport = function  (req, res) {
  if (!req.user) {
    return res.send({result:0,msg:'您没有权限进行举报！'});
  }
  var report = new Report();
  report.host_type = req.body.hostType;
  report.host_id = req.body.hostContent._id;
  report.report_type = req.body.reportType;
  var _poster = {
    type:req.user.provider
  }
  if(req.user.provider ==='company'){
    _poster.cid = req.user._id;
  }
  else{
    _poster.cid = req.user.cid;
    _poster.uid = req.user._id;
  }
  report.poster = _poster;
  report.save(function(err){
    if(!err){
      return res.send({result:1,msg:'举报成功，我们会尽快处理'});
    }
    else{
      return res.send({result:0,msg:'举报数据不正确，请重新尝试！'});
    }
  })

}