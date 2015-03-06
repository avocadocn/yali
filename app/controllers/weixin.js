'use strict';
var sha1 = require('sha1');
var token = "donler";
var checkSignature =function (query) {
  var signature = query.signature;
  var timestamp = query.timestamp;
  var nonce = query.nonce;
  var tmpArr = [token, timestamp, nonce];
  tmpArr.sort();
  var tmpStr = tmpArr.join('');
  tmpStr = sha1(tmpStr);
  if( tmpStr == signature ){
    return true;
  }else{
    return false;
  }
}
exports.get = function(req, res) {
  if(checkSignature(req.query)){
    return res.send(req.query.echostr);
  }else{
    return res.sendStatus(401);
  }
};
exports.post = function(req, res) {
  if(checkSignature(req.query)){
    console.log(req.body);
    return res.send(200);
  }else{
    return res.sendStatus(401);
  }
};

