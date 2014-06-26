'use strict';

//站内信

var mongoose = require('mongoose'),
    encrypt = require('../middlewares/encrypt'),
    crypto = require('crypto'),
    meanConfig = require('../../config/config'),
    GroupMessage = mongoose.model('GroupMessage'),
    Campaign = mongoose.model('Campaign'),
    User = mongoose.model('User'),
    Company = mongoose.model('Company'),
    Message = mongoose.model('Message'),
    CompanyGroup = mongoose.model('CompanyGroup');



/*
* type:      查询方式
* condition: 查询条件
* limit:     过滤条件
* callback:  队查询结果进行处理的回调函数
* sort:      排序方式
* _err:      错误处理函数
*/
function get(type,condition,limit,sort,callback,_err){
  switch(type){
    case '0':
      Message.findOne(condition,limit,function(err,message){
        if(err || !message){
          _err(err);
        }else{
          callback(message);
        }
      });
      break;
    case '1':
      Message.find(condition,limit).sort(sort).exec(function(err,messages){
        if(err || !messages){
          _err(err);
        }else{
          callback(messages);
        }
      });
      break;
    default:break;
  }
}

/*
* type:      更新方式
* condition: 查询条件
* operate:   更新方法
* callback:  回调函数
* _err:      错误处理函数
*/
function set(type,condition,operate,callback,_err){
  switch(type){
    case '0':
      Message.findByIdAndUpdate({'_id':condition},operate,function(err,message){
        if(err || !message){
          _err(err);
        }else{
          callback();
        }
      });
    case '1':
      Message.update(condition,operate,{multi: true},function(err,message){
        if(err || !message){
          _err(err);
        }else{
          callback();
        }
      });
    default:break;
  }
}


function add(condition,callback,_err){
  Message.insert(condition,{safe:true},function(err,message){
    if(err || !message){
      _err(err);
    } else {
      callback();
    }
  })
}

function drop(condition,callback,_err){
  Message.remove(condition,function(err,message){
    if(err || message){
      _err(err);
    }else{
      callback();
    }
  });
}


//组长给组员发送站内信
exports.leaderSendToMember = function(req,res){

};
