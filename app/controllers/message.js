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
    'type':'private',
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
  var cid = req.body.cid;
  var content = req.body.content,
      sender = {
        '_id':req.user._id,
        'nickname':req.user.info.name,
        'leader':false
      };
  var callback = function (message_content,cid,req,res){
    res.send({'result':1,'msg':'SUCCESS'});
  }
  var MC={
    'caption':'Message From Company',
    'content':content,
    'sender':[sender],
    'team':[],
    'type':'company',
    'company_id':cid,
    'deadline':(new Date())+time_out
  };
  var _param = {
    'collection':MessageContent,
    'operate':MC,
    'callback':callback,
    '_err':_err,
    'other_param':cid,
    'req':req,
    'res':res
  };
  _add(_param);
}




var time_out = 72*24*3600;



//组长给组员发送站内信
exports.leaderSendToMember = function(req,res){
  var team = req.body.team;
  var content = req.body.content,
      sender = {
        '_id':req.user._id,
        'nickname':req.user.nickname,
        'leader':true
      };
  var callback = function(company_group,team,req,res){
    if(company_group){
      var members = company_group[0].member;
      var caption = 'Message From Leader!';
      var _param = {
        'members':members,
        'caption':caption,
        'content':content,
        'sender':[sender],
        'team':[team.own],
        'company_id':null,
        'req':req,
        'res':res,
        'type':'team'
      }
      console.log('BEFORE',_param.members);
      oneToMember(_param);
    }
  }
  var param= {
    'collection':CompanyGroup,
    'type':1,
    'condition':{'_id':team.own._id},
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


exports.sendToParticipator = function(req, res, campaign_id){
  var callback = function(campaign,other,req,res){

    var sender = {
      '_id':req.user._id,
      'nickname':req.user.nickname,
      'leader':true
    };

    if(campaign){
      var team;

      for(var i = 0; i < campaign.team.length; i ++){
        for(var j = 0; j < req.user.team.length; j ++){
          if(req.user.team[j]._id.toString() === campaign.team[i]._id.toString()){
            team = {
              '_id':req.user.team[j]._id,
              'name':req.user.team[j].name,
              'provoke_status':0
            };
            break;
          }
        }
      }

      var members = [];
      for(var i = 0; i < campaign.member.length; i ++){
        members.push({
          '_id':campaign.member[i].uid
        });
      }
      var caption = 'Message From Campaign!';
      var _param = {
        'members':members,
        'caption':caption,
        'content':campaign.theme,
        'sender':[sender],
        'team':[team],
        'company_id':null,
        'req':req,
        'res':res,
        'type':'team'
      }
      oneToMember(_param);
    }
  }
  var param= {
    'collection':Campaign,
    'type':0,
    'condition':{'_id':campaign_id},
    'limit':{'member':1,'theme':1,'team':1},
    'sort':null,
    'callback':callback,
    '_err':_err,
    'other_param':null,
    'req':req,
    'res':res
  };
  get(param);
}


exports.newCampaignCreate = function(req,res,team,cid){
  switch(team.size){
    //公司活动
    case 0:
      var callback = function (message_content,cid,req,res){
        res.send({'result':1,'msg':'SUCCESS'});
      }
      var MC={
        'caption':'Company Campaign Message',
        'content':null,
        'sender':[],
        'team':[],
        'type':'company',
        'company_id':cid,
        'deadline':(new Date())+time_out
      };
      var _param = {
        'collection':MessageContent,
        'operate':MC,
        'callback':callback,
        '_err':_err,
        'other_param':cid,
        'req':req,
        'res':res
      };
      _add(_param);
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
            'sender':[],
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
            'sender':[],
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
exports.resultConfirm = function(req,res,olid,team,competition_id){
  var content = competition_id,
      sender = {
        '_id':req.user._id,
        'nickname':req.user.nickname,
        'leader':true
      };
  var callbackMC = function (message_content,olid,req,res){
    var callbackM = function (message_content,other,req,res){
      res.send({'result':1,'msg':'SUCCESS'});
    }
    var M={
      'rec_id':olid,
      'MessageContent':message_content._id,
      'type':'private',
      'status':'unread'
    };
    var _param = {
      'collection':Message,
      'operate':M,
      'callback':callbackM,
      '_err':_err,
      'other_param':null,
      'req':req,
      'res':res
    };
    _add(_param);
  }
  var MC={
    'caption':'Result Confirm Message',
    'content':content,
    'sender':[sender],
    'team':[team],
    'type':'private',
    'company_id':req.user.cid,
    'deadline':(new Date())+time_out
  };
  var _param = {
    'collection':MessageContent,
    'operate':MC,
    'callback':callbackMC,
    '_err':_err,
    'other_param':olid,
    'req':req,
    'res':res
  };
  _add(_param);
}



var getPublicMessage = function(req,res,cid){
  var callbackA = function(message_contents,other,req,res){
    if(message_contents.length > 0){
      var mcs = [];
      for(var i = 0; i < message_contents.length; i ++){
        mcs.push({
          '_id':message_contents[i]._id,
          'type':message_contents[i].type,
          'create_date':message_contents[i].post_date
        });
      }
      var callbackB = function(messages,mcs,req,res){
        //该用户有站内信
        if(messages.length > 0){
          var exist_mc_ids = [];  //该用户已经存在的MessageContent_id
          var new_mcs = [];    //新的站内信id,要创建新的Message
          for(var i = 0; i < messages.length; i ++){
            exist_mc_ids.push(messages[i].MessageContent);
          }
          var find = false;
          for(var j = 0; j < mcs.length; j ++){

            for(var k = 0; k < exist_mc_ids.length; k ++){
              if(mcs[j]._id.toString() === exist_mc_ids[k].toString()){
                find = true;
                break;
              }
            }
            if(!find){
              new_mcs.push(mcs[j]);
            }
          }


          if(new_mcs.length > 0){
            var counter = {'i':0};
            async.whilst(
              function() { return counter.i < new_mcs.length},
              function(__callback){
                var M = {
                  'rec_id':req.user._id,
                  'MessageContent':new_mcs[counter.i]._id,
                  'type':new_mcs[counter.i].type,
                  'status':'unread',
                  'create_date':new_mcs[counter.i].create_date
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
                  console.log('USER_ALREADY_HAS_MSG_AND_NEW');
                  getMessage(req,res,{'rec_id':req.user._id,'status':{'$nin':['delete','read']}});
                }
              }
            );
          }else{
            console.log('USER_ALREADY_HAS_MSG_AND_OLD');
            getMessage(req,res,{'rec_id':req.user._id,'status':{'$nin':['delete','read']}});
          }
        //该用户没有收到任何站内信
        }else{
          var counter = {'i':0};
          async.whilst(
            function() { return counter.i < message_contents.length},
            function(__callback){
              var M = {
                'rec_id':req.user._id,
                'MessageContent':message_contents[counter.i]._id,
                'type':message_contents[counter.i].type,
                'status':'unread',
                'create_date':message_contents[counter.i].post_date
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
                console.log('USER_HAS_NO_MSG_AND_NEW');
                getMessage(req,res,{'rec_id':req.user._id,'status':{'$nin':['delete','read']}});
              }
            }
          );
        }
      }

      var paramB = {
        'collection':Message,
        'type':1,
        'condition':{'rec_id':req.user._id},
        'limit':null,
        'sort':{'post_date':-1},
        'callback':callbackB,
        '_err':_err,
        'other_param':mcs,
        'req':req,
        'res':res
      };
      get(paramB);
    }else{ //没有任何公共消息
      console.log('NO_NEW_PUBLIC_MSG');
      getMessage(req,res,{'rec_id':req.user._id,'status':{'$nin':['delete','read']}});
    }
  }
  var paramA = {
    'collection':MessageContent,
    'type':1,
    'condition':{'company_id':cid,'$or':[{'type':'company'},{'type':'global'}]},  //公司消息和系统消息都是当作全局来对待的
    'limit':{'_id':1,'type':1,'post_date':1},
    'sort':{'post_date':-1},
    'callback':callbackA,
    '_err':_err,
    'other_param':null,
    'req':req,
    'res':res
  };
  get(paramA);
}


//获取私人或者小队站内信(点到点/点到个别)
var getMessage = function(req,res,condition){
  var sort = {'create_date':-1};
  Message.find(condition).sort(sort).populate('MessageContent').exec(function (err, messages){
    if(err || !messages){
      _err(err);
      res.send({
        'msg':[],
        'team':req.user.team,
        'cid':req.user.provider === 'company' ? req.user._id : req.user.cid,
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
        'cid':req.user.provider === 'company' ? req.user._id : req.user.cid,
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
  var condition = {'type':_type,'rec_id':req.user._id,'status':{'$ne':'delete'}};
  getMessage(req,res,condition);
}


//只读取未读站内信
exports.messageHeader = function(req,res){
  if(req.user.provider === 'user'){
    getPublicMessage(req,res,req.user.cid);
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
