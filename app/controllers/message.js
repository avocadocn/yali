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
    MessageContent = mongoose.model('MessageContent'),
    CompanyGroup = mongoose.model('CompanyGroup');



/*
* collection:目标文档
* type:      查询方式
* condition: 查询条件
* limit:     过滤条件
* callback:  队查询结果进行处理的回调函数
* sort:      排序方式
* _err:      错误处理函数
*/



function get(param){
  switch(param.type){
    case '0':
      param.collection.findOne(param.condition,param.limit,function(err,message){
        if(err || !message){
          param._err(err);
        }else{
          param.callback(message,param.other_param,param.req,param.res);
        }
      });
      break;
    case '1':
      param.collection.find(param.condition,param.limit).sort(param.sort).exec(function(err,messages){
        if(err || !messages){
          param._err(err);
        }else{
          param.callback(messages,param.other_param,param.req,param.res);
        }
      });
      break;
    default:break;
  }
}

/*
* collection:目标文档
* type:      更新方式
* condition: 查询条件
* operate:   更新方法
* callback:  回调函数
* _err:      错误处理函数
*/
function set(param){
  switch(param.type){
    case '0':
      param.collection.findByIdAndUpdate({'_id':param.condition},param.operate,function(err,message){
        if(err || !message){
          param._err(err);
        }else{
          param.callback();
        }
      });
    case '1':
      param.collection.update(param.condition,param.operate,{multi: true},function(err,message){
        if(err || !message){
          param._err(err);
        }else{
          param.callback(message);
        }
      });
    default:break;
  }
}


function _add(param){
  param.collection.insert(param.operate,{safe:true},function(err,message){
    if(err || !message){
      if(param._err!=null && typeof param._err == 'function'){
        param._err(err);
      }
    } else {
      if(param.callback!=null && typeof param.callback == 'function'){
        param.callback(message,param.other_param,param.req,param.res);
      }
    }
  })
}

function drop(param){
  param.collection.remove(param.condition,function(err,message){
    if(err || message){
      param._err(err);
    }else{
      param.callback(message);
    }
  });
}

var _err = function(err){
  console.log(err);
}





//无论是组长对组员、hr对员工还是生成新活动后对该活动所属组所有组员发送站内信,都可以调用此函数
var oneToMember = function(members,content,send_id,team_id,company_id,req,res){
  var callback = function (message_content,other,req,res){
    for(var i = 0; i < members.length; i ++){
      var M = {
        'rec_id':members[i]._id,
        'MessageContent':message_content._id,
        'status':'unread'
      };
      var param = {
        'collection':Message,
        'operate':M,
        'callback':null,
        '_err':_err,
        'other_param':null,
        'req':req,
        'res':res
      };
      _add(param);
    }
    //由于异步性质,不能保证所有队员的消息都存储完毕
    res.send("ADD_SUCCESS");
  }
  var MC={
    'content':content,
    'type':'public',
    'send_id':send_id,
    'team_id':team_id,
    'company_id':company_id,
    'deadline':(new Date())+time_out;
  };
  var param = {
    'collection':MessageContent,
    'operate':MC,
    'callback':callback,
    '_err':_err,
    'other_param':members,
    'req':req,
    'res':res
  };
  _add(param);
}

//HR给所有公司成员发送站内信
exports.hrSendToMember = function(req,res){

}




var time_out = 72*24*3600;

//组长给组员发送站内信
var leaderSendToMember = function(req,res){
  var members = req.body.members;
  var content = req.body.content,
      type = "public",
      send_id = req.user._id,
      team_id = req.body.tid;
  oneToMember(members,content,send_id,team_id,null,req,res);
};




var newCampaignCreate = function(req,res){
  var team = req.body.team;        //是对象
  var content = req.body.content;  //也是对象
  var cid = req.body.cid;

  switch(team.size){
    //公司活动
    case 0:
      var condition = {'cid':cid};
      var callback = function(users,other,req,res){
        if(users){
          oneToMember(users,content,null,null,cid,req,res);
        }
      }
      var param= {
        'collection':User,
        'type':1,
        'condition':condition,
        'limit':{'_id':1,'nickname':1},
        'sort':null,
        'callback':callback,
        '_err':_err,
        'other_param':other_param,
        'req':req,
        'res':res
      };
      get(param)
      break;
    //小队活动
    case 1:
      var condition = {'_id':team._id_own};
      var callback = function(company_group,other,req,res){
        if(company_group){
          var members = company_group.member;
          oneToMember(members,content.content_own,null,team._id_own,null,req,res);
        }
      }
      var param= {
        'collection':CompanyGroup,
        'type':1,
        'condition':condition,
        'limit':{'member':1},
        'sort':null,
        'callback':callback,
        '_err':_err,
        'other_param':null,
        'req':req,
        'res':res
      };
      get(param);
      break;
    //小队比赛
    case 2:
      var condition = {'_id':team._id_own};
      var callback = function(company_group,other,req,res){
        if(company_group){
          var members = company_group.member;
          oneToMember(members,content.content_own,null,team._id_own,null,req,res);
        }
      }
      var param= {
        'collection':CompanyGroup,
        'type':1,
        'condition':condition,
        'limit':{'member':1},
        'sort':null,
        'callback':callback,
        '_err':_err,
        'other_param':null,
        'req':req,
        'res':res
      };
      get(param);
      break;
    default:break;
  }
}

//比赛结果确认时给队长发送站内信
exports.resultConfirm = function(req,res){

}



//员工登录时读取站内信
var getMessage = function(_private,req,res){
  var sort = {'create_date':-1};
  if(_private){
    var condition = {'rec_id':req.user._id};
    Message.find(condition).sort(sort).populate('MessageContent').exec(function (err, messages){
      if(err || !messages){
        _err(err);
      }else{
        var rst = [];
        for(var i = 0; i < messages.length; i ++){
          rst.push({
            'rec_id':messages[i].rec_id,
            'status':messages[i].status,
            'message_content':messages[i].MessageContent
          });
        }
        res.send(rst);
      }
    });
  }else{
    var condition = {'rec_id':null};
    var rst = [];
    Message.find(condition).sort(sort).populate('MessageContent').exec(function (err, meassages){
      if(err || !messages){
        _err(err);
      } else {
        for(var i = 0; i < messages.length; i ++) {
          rst.push({
            'status':messages[i].status,
            'message_content':messages[i].MessageContent
          });
        }
        res.send(rst);
      }
    });
  }
}

//修改站内信状态(比如用户点击了一条站内信就把它设为已读)
var setMessageStatus = function(status,req,res){
  var status_model = ['read','unread','delete'];
  if(status_model.indexOf(status) > -1){
    var msg_id = req.body.msg_id;
    var operate = {'$set':{'status':status}};
    var callback = function(){
      res.send('MODIFY_OK');
    }
    var param = {
      'collection':Message,
      'type':0.
      'condition':msg_id,
      'operate':operate,
      'callback':callback,
      '_err':_err
    };
    set(param);
  }else{
    res.send('STATUS_ERROR');
  }
}

exports.messageInit = function(req,res){
  if(req.user.provider === 'user'){

  }
}