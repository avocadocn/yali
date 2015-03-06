'use strict';
var sha1 = require('sha1');
var token = "donler";
exports.index = function(req, res) {
  var signature = req.query.signature;
  var timestamp = req.query.timestamp;
  var nonce = req.query.nonce;
  var tmpArr = [token, timestamp, nonce];
  tmpArr.sort();
  var tmpStr = tmpArr.join('');
  tmpStr = sha1(tmpStr);
  
  if( tmpStr == signature ){
    return res.send(req.query.echostr);
  }else{
    return res.sendStatus(401);
  }
};

