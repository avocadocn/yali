'use strict';
var sha1 = require('sha1');
var token = "donler";
var xmlbuilder = require('xmlbuilder');
var http = require('http');
var model_helper = require('../helpers/model_helper');
var mongoose = require('mongoose'),
    RegistrationBoard = mongoose.model('RegistrationBoard'),
    Campaign = mongoose.model('Campaign');

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
var buildXml = function (to, from, msgType, funFlag, callback){
    var xml = xmlbuilder.create('xml')
        .ele('ToUserName')
        .dat(to)
        .up()
        .ele('FromUserName')
        .dat(from)
        .up()
        .ele('CreateTime')
        .txt(Date.now())
        .up()
        .ele('MsgType')
        .dat(msgType)
        .up();
    xml = callback(xml);
    return xml.ele('FuncFlag',{},funFlag).end({pretty:true});
}
exports.get = function(req, res) {
  if(checkSignature(req.query)){
    return res.send(req.query.echostr);
  }else{
    return res.status(401).send('');
  }
};
exports.registration = function(req, res) {
  // console.log(req.query.campaign);
  if(req.user){
    var _user = {
      _id: req.user._id,
      nickname: req.user.nickname,
      photo: req.user.photo
    };
    var registrationFlag = false;
    RegistrationBoard.findOne({host_type:'campaign',host_id:req.query.campaign}).exec().then(function (registration) {
      var now = Date.now();
      // console.log(registration);
      if(registration&& now>=registration.min_time &&now<=registration.max_time&&model_helper.arrayObjectIndexOf(registration.logs,_user._id,'_id')==-1){
        Campaign.findOne({_id:req.query.campaign}).exec().then(function (campaign) {
          if(campaign&&model_helper.arrayObjectIndexOf(campaign.memebers,_user._id,'_id')>-1) {
            registration.logs.push(_user);
            registration.save(function (err) {
              if(err) {
                console.log(err);
              }
              else{
                registrationFlag = true;
              }
              return res.render('weixin/registration',{user:_user, registrationFlag:registrationFlag});
            })
          }
          else{
            return res.render('weixin/registration',{user:_user, registrationFlag:false});
          }

        })
        .then(null,function (err) {
          console.log(err);
          return res.render('weixin/registration',{user:_user, registrationFlag:false});
        });
      }
      else{
        return res.render('weixin/registration',{user:_user, registrationFlag:false});
      }
    })
    .then(null,function (err) {
      console.log(err);
      return res.render('weixin/registration',{user:_user, registrationFlag:false});
    });
    
  }
  else {
    res.render('weixin/signin');
  }
};
exports.postXml = function (req, res) {
    var xml = buildXml('gh_45400176b0c8', 'oP_oBj8JboYSwgKR3hnqpp3akaI4', 'text', '0', function(xml) {
      return xml.ele('ScanCodeInfo')
        .ele('ScanResult')
        .dat('registration:54fe6085fc3e810000cf96f4')
        .up()
        .ele('ScanType')
        .dat('txt');
    });
    var options = {
      host: 'localhost',
      port: 3000,
      method: 'POST',
      path: "/weixin?signature=aeed65c1a7df158d40ac54fa7cf317220419d96e&timestamp=1425637277&nonce=1737582504&encrypt_type=aes&msg_signature=e6338f7bef6025d064a50a6b3a5a69eb56bca067",
      headers: {
        'Content-Type': 'text/xml',
        'Content-Length': xml.length
      }
    };
  var req = http.request(options, function (res) {

      var resBody = '';
      res.on('data', function (chunk) {
          resBody += chunk;
      });
  });

  // console.log(xml);
  req.write(xml);
  req.end();
  res.send(200);
}
exports.post = function(req, res) {
  if(checkSignature(req.query)) {
    var xmlMsg = req.body.xml;
    // console.log(xmlMsg)
    switch(xmlMsg.MsgType[0]) {
      case 'event':
        switch(xmlMsg.Event[0]) {
          case 'scancode_waitmsg':
            // console.log(xmlMsg.ScanCodeInfo[0]);
            // console.log(xmlMsg.ScanCodeInfo[0].ScanType[0]);
            var scanResult = xmlMsg.ScanCodeInfo[0].ScanResult[0];
            // console.log(scanResult);
            if(scanResult.indexOf('registration:')==0){
              var RegistrationUrl ="http://www.55yali.com/weixin/registration?campaign=" + scanResult.slice(13)+"&openid="+xmlMsg.FromUserName[0];
              var xml = buildXml(xmlMsg.FromUserName, xmlMsg.ToUserName, 'text', '0', function(xml) {
                return xml.ele('Content')
                  .dat(RegistrationUrl);
              });
              // console.log(xml);
              res.contentType('text/xml');
              return res.send(xml);
            }
            break;
          case 'VIEW':
            console.log(xmlMsg.EventKey);
            break;
        }
        break;
      case 'text':
        console.log(xmlMsg.Content[0]);
        break;
    }
    
    return res.send("");
  }else {
    return res.status(401).send('');
  }
};

