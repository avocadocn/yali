var http = require('http');
var util = require('util');
var encrypt = require('../middlewares/encrypt');
var host = "127.0.0.1";
var config = require('../config/config');

var debug = false;
function urlencode (str) {
  // http://kevin.vanzonneveld.net
  str = (str + '').toString();
  // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
  // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
  return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
  replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
}


var cb = function(a,b){
  console.log(a,b);
}

exports.pushTest = function(req,res){
  var _res = res;
  var data = {
    campaign_id:'03432dsgsd0342fdjksjg03243',
    campaign_theme:'nihaoa',
    campaign_content:'huffhdgjdf',
    members:[{
      _id:'323s',
      nickname:'erd',
      user_id:'vdf3435'
    },{
      _id:'324s',
      nickname:'yud',
      user_id:'df34dfd'
    },{
      _id:'325s',
      nickname:'mno',
      user_id:'m978fd2'
    }]
  }
  data.campaign_id_key = encrypt.encrypt(data.campaign_id,config.SECRET);
  var bodyArgsArray = [];
  for (var i in data) {
    if (data.hasOwnProperty(i)) {
      if(typeof data[i] == 'object'){
        bodyArgsArray.push(i + '=' + urlencode(JSON.stringify(data[i])));
      }else{
        bodyArgsArray.push(i + '=' + urlencode(data[i]));
      }
    }
  }
  var bodyStr = bodyArgsArray.join('&');

  if (debug) {
      console.log('body length = ' + bodyStr.length + ', body str = ' + bodyStr);
  }
  var options = {
      host: host,
      port: 4000,
      method: 'POST',
      path: "/push/test/"+req.params.platform,
      headers: {
                'Access-Control-Allow-Origin':'*',
                'Access-Control-Allow-Headers':'Content-Type,Content-Length, Authorization, Accept,X-Requested-With',
                'Access-Control-Allow-Methods':'PUT,POST,GET,DELETE,OPTIONS',
                'X-Powered-By':'3.2.1',
                'Content-Length': bodyStr.length,
                'Content-Type':'application/x-www-form-urlencoded'
               }
  };
  var req = http.request(options, function (res) {
      if (debug) {
          console.log('status = ' + res.statusCode);
          console.log('res header = ');
          console.dir(res.headers);
      }

      var resBody = '';
      res.on('data', function (chunk) {
          resBody += chunk;
      });

      res.on('end', function () {
          if (debug) {
              console.log('res body: ' + resBody);
          }
          //var jsonObj = JSON.parse(resBody);
          try {
            var jsonObj = JSON.parse(resBody);
          } catch(e) {
            console.log(e);
            return;
          }
          var errObj = null;
          var id ={request_id: null};
          id.request_id = jsonObj['request_id'];
          if (res.statusCode != 200) {
              var error_code = 'Unknown';
              if (jsonObj['error_code'] !== undefined) {
                  error_code = jsonObj['error_code'];
              }

              var error_msg = 'Unknown';
              if (jsonObj['error_msg'] !== undefined) {
                  error_msg = jsonObj['error_msg'];
              }

              var request_id = 'Unknown';
              if (jsonObj['error_msg'] !== undefined) {
                  request_id = jsonObj['request_id'];
              }

              errObj = new Error('Push error code: ' + error_code +
                                  ', error msg: ' + error_msg +
                                  ', request id: ' + request_id);
          }
          console.log(jsonObj);
          return _res.send(jsonObj);
      });
  });
  req.on('error', function (e) {
      if (debug) {
          console.log('error : ' + util.inspect(e));
      }
      console.log(e, null);
  });
  req.write(bodyStr);
  req.end();
}



exports.pushCampaign = function(platform,data,cb){
  data.campaign_id_key = encrypt.encrypt(data.campaign_id,config.SECRET);
  var bodyArgsArray = [];
  for (var i in data) {
    if (data.hasOwnProperty(i)) {
      bodyArgsArray.push(i + '=' + urlencode(data[i]));
      }
  }
  var bodyStr = bodyArgsArray.join('&');

  if (debug) {
      console.log('body length = ' + bodyStr.length + ', body str = ' + bodyStr);
  }
  var options = {
      host: host,
      method: 'POST',
      path: "/push/campaign/"+platform,
      headers: {'Content-Length': bodyStr.length,
                'Content-Type':'application/x-www-form-urlencoded'
               }
  };
  var req = http.request(options, function (res) {
      if (debug) {
          console.log('status = ' + res.statusCode);
          console.log('res header = ');
          console.dir(res.headers);
      }

      var resBody = '';
      res.on('data', function (chunk) {
          resBody += chunk;
      });

      res.on('end', function () {
          if (debug) {
              console.log('res body: ' + resBody);
          }
          //var jsonObj = JSON.parse(resBody);
          try {
            var jsonObj = JSON.parse(resBody);
          } catch(e) {
            cb && cb(e);
            return;
          }
          var errObj = null;
          var id ={request_id: null};
          id.request_id = jsonObj['request_id'];
          if (res.statusCode != 200) {
              var error_code = 'Unknown';
              if (jsonObj['error_code'] !== undefined) {
                  error_code = jsonObj['error_code'];
              }

              var error_msg = 'Unknown';
              if (jsonObj['error_msg'] !== undefined) {
                  error_msg = jsonObj['error_msg'];
              }

              var request_id = 'Unknown';
              if (jsonObj['error_msg'] !== undefined) {
                  request_id = jsonObj['request_id'];
              }

              errObj = new Error('Push error code: ' + error_code +
                                  ', error msg: ' + error_msg +
                                  ', request id: ' + request_id);
          }

          cb(errObj, jsonObj);
      });
  });
  req.on('error', function (e) {
      if (debug) {
          console.log('error : ' + util.inspect(e));
      }
      cb(e, null);
  });

  req.write(bodyStr);
  req.end();
}