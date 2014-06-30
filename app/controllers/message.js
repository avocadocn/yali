'use strict';

//站内信

var mongoose = require('mongoose'),
    encrypt = require('../middlewares/encrypt'),
    crypto = require('crypto'),
    async = require('async'),
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
    case 0:
      param.collection.findOne(param.condition,param.limit,function(err,message){
        if(err || !message){
          param._err(err);
        }else{
          param.callback(message,param.other_param,param.req,param.res);
        }
      });
      break;
    case 1:
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
    case 0:
      param.collection.findByIdAndUpdate({'_id':param.condition},param.operate,function(err,message){
        if(err || !message){
          param._err(err);
        }else{
          param.callback(message);
        }
      });
    case 1:
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
  console.log('hahaha_add',param.other_param);
  param.collection.create(param.operate,function(err,message){
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
var oneToMember = function(param){
  var callback = function (message_content,other,req,res){
    console.log('hahaha',other[0].length);
    var counter = {'i':0};
    async.whilst(
      function() { return counter.i < other[0].length},
      function(__callback){
        var M = {
          'type':other[1],
          'rec_id':other[0][counter.i]._id,
          'MessageContent':message_content._id,
          'status':'unread'
        };
        var param = {
          'collection':Message,
          'operate':M,
          'callback':function(message,_counter,req,res){_counter.i++;__callback();},
          '_err':_err,
          'other_param':counter,
          'req':req,
          'res':res
        };
        _add(param);
      },
      function(err){
        if(err){
          return res.send({'result':1,'msg':'FAILURED'});
        }else{
          return res.send({'result':1,'msg':'SUCCESS'});
        }
      }
    );
  }
  var MC={
    'caption':param.caption,
    'content':param.content,
    'sender':param.sender,
    'team':param.team,
    'company_id':param.company_id,
    'deadline':(new Date())+time_out
  };
  var _param = {
    'collection':MessageContent,
    'operate':MC,
    'callback':callback,
    '_err':_err,
    'other_param':[param.members,param.type],
    'req':param.req,
    'res':param.res
  };
  _add(_param);
}

//HR给所有公司成员发送站内信
exports.hrSendToMember = function(req,res){

}




var time_out = 72*24*3600;



//组长给组员发送站内信
exports.leaderSendToMember = function(req,res){
  var team = req.body.team;

  var content = req.body.content,
      type = "public",
      sender = {
        '_id':req.user._id,
        'nickname':req.user.nickname,
        'leader':true
      };

  var callback = function(company_group,team,req,res){
    if(company_group){
      var members = company_group.member;
      var caption = 'Message From Leader!';
      var _param = {
        'members':members,
        'caption':caption,
        'content':content,
        'sender':sender,
        'team':[team.own],
        'company_id':null,
        'req':req,
        'res':res,
        'type':'team'
      }
      oneToMember(_param);
    }
  }
  var param= {
    'collection':CompanyGroup,
    'type':1,
    'condition':{'_id':team._id},
    'limit':{'member':1},
    'sort':null,
    'callback':callback,
    '_err':_err,
    'other_param':team,
    'req':req,
    'res':res
  };
  get(param);
};




exports.newCampaignCreate = function(req,res,team,cid){
  switch(team.size){
    //公司活动
    case 0:
      var condition = {'cid':cid};
      var callback = function(users,other,req,res){
        if(users){
          var caption = 'Message From Company!';
          var _param = {
            'members':users,
            'caption':caption,
            'content':null,
            'sender':null,
            'team':null,
            'company_id':cid,
            'req':req,
            'res':res,
            'type':'company'
          }
          oneToMember(_param);
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
        'other_param':null,
        'req':req,
        'res':res
      };
      get(param);
      break;
    //小队活动
    case 1:
      var condition = {'_id':team.own._id};
      var callback = function(company_group,team,req,res){
        if(company_group){
          var members = company_group.member;
          var caption = 'Team Campaign!';
          var _param = {
            'members':members,
            'caption':caption,
            'content':null,
            'sender':null,
            'team':[team.own],
            'company_id':null,
            'req':req,
            'res':res,
            'type':'team'
          }
          oneToMember(_param);
        }
      }
      var param= {
        'collection':CompanyGroup,
        'type':0,
        'condition':condition,
        'limit':{'member':1},
        'sort':null,
        'callback':callback,
        '_err':_err,
        'other_param':team,
        'req':req,
        'res':res
      };
      get(param);
      break;
    //小队比赛
    case 2:
      var condition = {'_id':{'$in':[team.own._id,team.opposite._id]}};
      var callback = function(company_groups,other,req,res){
        if(company_groups){
          var members = [];
          if(company_groups.length == 2){
            members = company_groups[0].member.concat(company_groups[1].member);
            console.log('成员',members);
          }
          var caption = "Competition Message!";

          var _param = {
            'members':members,
            'caption':caption,
            'content':null,
            'sender':null,
            'team':[team.own,team.opposite],
            'company_id':null,
            'req':req,
            'res':res,
            'type':'team'
          }
          oneToMember(_param);
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



//读取站内信
var getMessage = function(req,res,condition){
  var sort = {'create_date':-1};
  Message.find(condition).sort(sort).populate('MessageContent').exec(function (err, messages){
    if(err || !messages){
      _err(err);
      res.send({
        'msg':[],
        'team':req.user.team,
        'cid':req.user.cid,
        'uid':req.user._id
      });
    }else{
      var rst = [];
      for(var i = 0; i < messages.length; i ++){
        rst.push({
          '_id':messages[i]._id,
          'rec_id':messages[i].rec_id,
          'status':messages[i].status,
          'type':messages[i].type,
          'message_content':messages[i].MessageContent
        });
      }
      res.send({
        'msg':rst,
        'team':req.user.team,
        'cid':req.user.cid,
        'uid':req.user._id
      });
    }
  });
}

//修改站内信状态(比如用户点击了一条站内信就把它设为已读,或者删掉这条站内信)
exports.setMessageStatus = function(req,res){
  var status = req.body.status;
  var status_model = ['read','unread','delete'];
  if(status_model.indexOf(status) > -1){
    var msg_id = req.body.msg_id;
    var operate = {'$set':{'status':status}};
    var callback = function(value){
      res.send('MODIFY_OK');
    }
    var param = {
      'collection':Message,
      'type':0,
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

//手动获取私信
exports.messageGetByHand = function(req,res){
  var _type = req.body._type;
  var condition = {'type':_type,'$or':[{'rec_id':req.user._id},{'type':'global'}],'status':{'$ne':'delete'}};
  getMessage(req,res,condition);
}


//只读取未读站内信
exports.messageHeader = function(req,res){
  if(req.user.provider === 'user'){
    var condition = {'$or':[{'rec_id':req.user._id},{'type':'global'}],'status':{'$nin':['delete','read']}};
    getMessage(req,res,condition);
  }else{
    //公司暂时只获取系统公告(以后可以获取针对公司的站内信)
    var condition = {'type':'global','status':{'$nin':['delete','read']}};
    getMessage(req,res,condition);
  }
}


//读取所有站内信
exports.messageAll = function(req,res){
  if(req.user.provider === 'user'){
    var _private = req.body._private;
    if(_private == undefined || _private == true){
      var condition = {'$or':[{'rec_id':req.user._id},{'type':'global'}],'status':{'$nin':['delete']}};
      getMessage(req,res,condition);
    }else{
      var condition = {'type':'global','status':{'$nin':['delete']}};
      getMessage(req,res,condition);
    }
  }else{
    //公司暂时只获取系统公告(以后可以获取针对公司的站内信)
    var condition = {'type':'global','status':{'$nin':['delete']}};
    getMessage(req,res,condition);
  }
}


exports.home = function(req,res){
  if(req.session.role !=='GUESTHR' && req.session.role !=='GUEST' && req.session.role !=='GUESTLEADER'){
    res.render('partials/message');
  }else{
    res.send(403);
  }
}

exports.renderPrivate = function(req,res){
  if(req.session.role !=='GUESTHR' && req.session.role !=='GUEST' && req.session.role !=='GUESTLEADER'){
    res.render('partials/message/private');
  }else{
    res.send(403);
  }
}
exports.renderTeam = function(req,res){
  if(req.session.role !=='GUESTHR' && req.session.role !=='GUEST' && req.session.role !=='GUESTLEADER'){
    res.render('partials/message/team');
  }else{
    res.send(403);
  }
}
exports.renderCompany = function(req,res){
  if(req.session.role !=='GUESTHR' && req.session.role !=='GUEST' && req.session.role !=='GUESTLEADER'){
    res.render('partials/message/company');
  }else{
    res.send(403);
  }
}
exports.renderSystem = function(req,res){
  if(req.session.role !=='GUESTHR' && req.session.role !=='GUEST' && req.session.role !=='GUESTLEADER'){
    res.render('partials/message/system');
  }else{
    res.send(403);
  }
}
