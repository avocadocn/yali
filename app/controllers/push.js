//推送的具体操作
var mongoose = require('mongoose'),
    Push = require('../services/pushServer'),
    User = mongoose.model('User');

var opt = {
   ak: 'your ak here',
   sk: 'your sk here'
};
var client = new Push(opt);



function queryBindList(client) {
  var opt = {
    user_id: id0
  }
  client.queryBindList(opt, function(err, result) {
    if (err) {
      console.log(err);
      return;
    }
    console.log(result);
  })
}

function pushMsg(device_id,msg,msg_key) {
  var opt = {
    push_type: 1,
    user_id: device_id,
    messages: msg,
    msg_keys: msg_key
  }
  client.pushMsg(opt, function(err, result) {
    if (err) {
      console.log(err);
      return;
    }
    console.log(result);
  })
}

exports.pushCampaign = function(campaign){
  var uids = [];
  for(var i = 0 ; i < campaign.member.length; i ++){
    uids.push(campaign.member[i]._id);
  }
  //由于用户的device_id可能会经常变动,因此没有将device_id存入campaign的member里
  User.find({'_id':{'$in':uids}},{'nickname':1,'device_id':1},function (err, users){
    if(err || !users){
      console.log('SEND_USER_NOT_FOUND_ERROR');
    }else{
      //campaign.theme
      //campaign._id
      //campaign.content
      msg = JSON.stringify(["hello, push0", "hello, push1", "hello, push2"]);
      msg_key = JSON.stringify(["key0", "key1", "key2"]);
      for(var i = 0; i < users.length; i ++){
        if(users[i].device){
          if(users[i].device.device_id){
             pushMsg(users[i].device_id,msg,msg_key);
          }
        }
      }
    }
  });
}