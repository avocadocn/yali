'use strict';
var mongoose = require('mongoose'),
    Industry = mongoose.model('Industry');

var industriesCache = [];

exports.getIndustries = function (req, res) {
  if(industriesCache.length===0) {
    Industry.find({level:1})
    .populate('child_industry')
    .exec()
    .then(function(industries) {
      industriesCache = industries;
      return res.status(200).send(industries);
    })
    .then(null, function(err) {
      if(err) {
        console.log(err);
        return res.status(500).send({msg:'获取行业失败'});
      }
    })
  }
  else {
    return res.status(200).send(industriesCache);
  }
};