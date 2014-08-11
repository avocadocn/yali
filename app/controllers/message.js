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


var time_out = 72*24*3600;

/**
  * 数据库查询
  * @param {String}   param.collection    待查询集合
  * @param {Number}   param.type          查询方式(0:单文档  1:多文档)
  * @param {Object}   param.condition     查询条件
  * @param {Object}   param.limit         查询限制
  * @param {Object}   param.sort          查询排序方式
  * @param {String}   param.populate      如不为空则按照populate方式进行查询,populate即为待populate的集合名称
  * @param {Function} param.callback      查询完返回正确结果后的处理函数
  * @param {Function} param._err          查询出现错误的处理函数
  * @param {Object}   param.other_param   可能需要的额外参数
  * @param {Object}   param.req           请求变量
  * @param {Object}   param.res           结果变量
 */
function get(param){
  switch(param.type){
    case 0:
      if(param.populate == undefined || param.populate == null){
        param.collection.findOne(param.condition,param.limit,function(err,message){
          if(err || !message){
            if(param._err!=null && typeof param._err == 'function'){
              param._err(err,param.req,param.res);
            }
          }else{
            if(param.callback!=null && typeof param.callback == 'function'){
              param.callback(message,param.other_param,param.req,param.res);
            }
          }
        });
      }else{
        param.collection.findOne(param.condition,param.limit).populate(param.populate).exec(function(err,message){
          if(err || !message){
            if(param._err!=null && typeof param._err == 'function'){
              param._err(err,param.req,param.res);
            }
          }else{
            if(param.callback!=null && typeof param.callback == 'function'){
              param.callback(message,param.other_param,param.req,param.res);
            }
          }
        });
      }
      break;
    case 1:
      if(param.populate == undefined || param.populate == null){
        param.collection.find(param.condition,param.limit).sort(param.sort).exec(function(err,messages){
          if(err || !messages){
            if(param._err!=null && typeof param._err == 'function'){
              param._err(err,param.req,param.res);
            }
          }else{
            if(param.callback!=null && typeof param.callback == 'function'){
              param.callback(messages,param.other_param,param.req,param.res);
            }
          }
        });
      }else{
        param.collection.find(param.condition,param.limit).sort(param.sort).populate(param.populate).exec(function(err,messages){
          if(err || !messages){
            if(param._err!=null && typeof param._err == 'function'){
              param._err(err,param.req,param.res);
            }
          }else{
            if(param.callback!=null && typeof param.callback == 'function'){
              param.callback(messages,param.other_param,param.req,param.res);
            }
          }
        });
      }
      break;
    default:break;
  }
}


/**
  * 数据库更新
  * @param {String}   param.collection    待更新集合
  * @param {Number}   param.type          更新的方式(0:根据id单文档更新  1:根据具体条件多文档更新)
  * @param {Object}   param.condition     更新条件
  * @param {Object}   param.operate       更新的具体操作条件
  * @param {Function} param.callback      更新完返回正确结果后的处理函数
  * @param {Function} param._err          更新出现错误的处理函数
  * @param {Object}   param.other_param   可能需要的额外参数
  * @param {Object}   param.req           请求变量
  * @param {Object}   param.res           结果变量
 */
function set(param){
  switch(param.type){
    case 0:
      param.collection.update({'_id':param.condition},param.operate,function(err,message){
        if(err || !message){
          if(param._err!=null && typeof param._err == 'function'){
            param._err(err,param.req,param.res);
          }
        }else{
          if(param.callback!=null && typeof param.callback == 'function'){
            param.callback(message,param.other_param,param.req,param.res);
          }
        }
      });
    case 1:
      param.collection.update(param.condition,param.operate,{multi: true},function(err,message){
        if(err || !message){
          if(param._err!=null && typeof param._err == 'function'){
            param._err(err,param.req,param.res);
          }
        }else{
          if(param.callback!=null && typeof param.callback == 'function'){
            param.callback(message,param.other_param,param.req,param.res);
          }
        }
      });
    default:break;
  }
}


/**
  * 数据库插入
  * @param {String}   param.collection    待插入集合
  * @param {Object}   param.operate       插入的具体操作条件
  * @param {Function} param.callback      更新完返回正确结果后的处理函数
  * @param {Function} param._err          更新出现错误的处理函数
  * @param {Object}   param.other_param   可能需要的额外参数
  * @param {Object}   param.req           请求变量
  * @param {Object}   param.res           结果变量
 */
function _add(param){
  param.collection.create(param.operate,function(err,message){
    if(err || !message){
      if(param._err!=null && typeof param._err == 'function'){
        param._err(err,param.req,param.res);
      }
    } else {
      if(param.callback!=null && typeof param.callback == 'function'){
        param.callback(message,param.other_param,param.req,param.res);
      }
    }
  })
}


/**
  * 数据库删除
  * @param {String}   param.collection    待删除集合
  * @param {Object}   param.condition     删除的查询条件
  * @param {Function} param.callback      删除完返回正确结果后的处理函数
  * @param {Function} param._err          删除出现错误的处理函数
  * @param {Object}   param.other_param   可能需要的额外参数
  * @param {Object}   param.req           请求变量
  * @param {Object}   param.res           结果变量
 */
function drop(param){
  param.collection.remove(param.condition,function(err,message){
    if(err || !message){
      if(param._err!=null && typeof param._err == 'function'){
        param._err(err,param.req,param.res);
      }
    }else{
      if(param.callback!=null && typeof param.callback == 'function'){
        param.callback(message);
      }
    }
  });
}

var _err = function(err,req,res){
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
          return res.send({'result':0,'msg':'FAILURED'});
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
    'campaign_id':param.campaign_id,
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

//HR给 所有公司成员/某一小队 发送站内信
exports.hrSendToMember = function(req,res){
  //给全公司员工发站内信
  var team = req.body.team;
  var content = req.body.content;
  var cid = req.body.cid;
  if(team.own._id == 'null'){
    var sender = {
          '_id':req.user._id,
          'nickname':req.user.info.official_name,
          'photo':req.user.info.logo,
          'role':'HR'
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
  //给某一小队发送站内信
  }else{
    var sender = {
      '_id':req.user._id,
      'nickname':req.user.info.name,
      'photo':req.user.info.logo,
      'role':'HR'
    },
    caption = 'Message From Company';
    sendToTeamMember(team,content,caption,sender,req,res);
  }
}



//组长给组员发送站内信的具体实现
var sendToTeamMember =function(team,content,caption,sender,req,res){
  var callback = function(company_group,team,req,res){
    if(company_group){
      var members = company_group[0].member;
      var _param = {
        'members':members,
        'caption':caption,
        'content':content,
        'sender':[sender],
        'team':[team.own],
        'company_id':null,
        'campaign_id':null,
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
}

//组长给组员发送站内信
exports.leaderSendToMember = function(req,res){
  var team = req.body.team;
  var content = req.body.content,
      sender = {
        '_id':req.user._id,
        'nickname':req.user.nickname,
        'photo':req.user.photo,
        'role':'LEADER'
      },
      caption = 'Message From Leader';
  sendToTeamMember(team,content,caption,sender,req,res);
};


//一对一发送站内信的具体实现
var toOne = function(req,res,param){
  var callback = function (message_content,receiver,req,res){
    var M = {
      'type':'private',
      'rec_id':receiver._id,
      'MessageContent':message_content._id,
      'status':'unread'
    };
    var param = {
      'collection':Message,
      'operate':M,
      'callback':function(message,other,req,res){return {'result':1,'msg':'SUCCESS'};},
      '_err':_err,
      'other_param':null,
      'req':req,
      'res':res
    };
    _add(param);
  }
  var MC={
    'type':param.type,
    'caption':param.caption,
    'content':param.content,
    'sender':[param.own],
    'team':param.team,
    'company_id':null,
    'campaign_id':param.campaign_id,
    'department_id':null,
    'deadline':(new Date())+time_out,
    'auto':((param.auto != undefined && param.auto != null) ? param.auto : false)
  };
  var _param = {
    'collection':MessageContent,
    'operate':MC,
    'callback':callback,
    '_err':_err,
    'other_param':param.receiver,
    'req':req,
    'res':res
  };
  _add(_param);
}


//一对一发送站内信
exports.sendToOne = function(req, res, param){
  param.team = [param.own_team,param.receive_team];
  toOne(req,res,param);
}


//给参加某活动/比赛的成员发送站内信
exports.sendToParticipator = function(req, res){
  var callback = function(campaign,join_team,req,res){
    var sender = {
      '_id':req.user._id,
      'nickname':req.user.provider == 'user' ? req.user.nickname : req.user.info.official_name,
      'photo':req.user.provider == 'user' ? req.user.photo : req.user.info.logo,
      'role':req.user.provider == 'user' ? 'LEADER' : 'HR'
    };

    if(campaign){
      var team;
      if(campaign.campaign_type > 1){
        team = {
          '_id':campaign.team[0]._id,
          'name':campaign.team[0].name,
          'logo':campaign.team[0].logo,
          'status':0
        };
      }
      var members = [];
      if([4,5,7].indexOf(campaign.campaign_type) > -1){
        team.status = 1;
        for(var i = 0; i < campaign.camp.length; i ++){
          for(var j = 0; j < campaign.camp[i].member.length; j ++){
            members.push({
              '_id':campaign.camp[i].member[j].uid
            });
          }
        }
      }else{
        if([2,6,8,9].indexOf(campaign.campaign_type) > -1){
          team.status = 0;
        }
        for(var i = 0; i < campaign.member.length; i ++){
          members.push({
            '_id':campaign.member[i].uid
          });
        }
        //多小队活动针对某一小队发消息
        if(campaign.campaign_type == 3){
          team._id = join_team._id;
          team.name = join_team.name;
          team.logo = join_team.logo;
          for(var i = 0; i < campaign.member.length; i ++){
            if(campaign.member[i].team._id.toString() === team._id.toString()){
              members.push({
                '_id':campaign.member[i].uid
              });
            }
          }
        }
      }
      console.log(members);
      var _param = {
        'members':members,
        'caption':campaign.theme,
        'content':req.body.content,
        'sender':[sender],
        'team':campaign.campaign_type > 1 ? [team] : [],
        'company_id':null,
        'campaign_id':req.body.campaign_id,
        'req':req,
        'res':res,
        'type':'team'
      }
      oneToMember(_param);
    }
  }
  var param= {
    'populate':'team',
    'collection':Campaign,
    'type':0,
    'condition':{'_id':req.body.campaign_id},
    'limit':{'member':1,'theme':1,'team':1,'camp':1,'campaign_type':1},
    'sort':null,
    'callback':callback,
    '_err':_err,
    'other_param':req.body.team,
    'req':req,
    'res':res
  };
  get(param);
}


// exports.newCampaignCreate = function(req,res,team,cid){
//   switch(team.size){
//     //公司活动
//     case 0:
//       var callback = function (message_content,cid,req,res){
//         res.send({'result':1,'msg':'SUCCESS'});
//       }
//       var MC={
//         'caption':'Company Campaign Message',
//         'content':null,
//         'sender':[],
//         'team':[],
//         'type':'company',
//         'company_id':cid,
//         'deadline':(new Date())+time_out
//       };
//       var _param = {
//         'collection':MessageContent,
//         'operate':MC,
//         'callback':callback,
//         '_err':_err,
//         'other_param':cid,
//         'req':req,
//         'res':res
//       };
//       _add(_param);
//       break;
//     //小队活动
//     case 1:
//       var condition = {'_id':team.own._id};
//       var callback = function(company_group,team,req,res){
//         if(company_group){
//           var members = company_group.member;
//           var caption = 'Team Campaign!';
//           var _param = {
//             'members':members,
//             'caption':caption,
//             'content':null,
//             'sender':[],
//             'team':[team.own],
//             'company_id':null,
//             'req':req,
//             'res':res,
//             'type':'team'
//           }
//           oneToMember(_param);
//         }
//       }
//       var param= {
//         'collection':CompanyGroup,
//         'type':0,
//         'condition':condition,
//         'limit':{'member':1},
//         'sort':null,
//         'callback':callback,
//         '_err':_err,
//         'other_param':team,
//         'req':req,
//         'res':res
//       };
//       get(param);
//       break;
//     //小队比赛
//     case 2:
//       var condition = {'_id':{'$in':[team.own._id,team.opposite._id]}};
//       var callback = function(company_groups,other,req,res){
//         if(company_groups){
//           var members = [];
//           if(company_groups.length == 2){
//             members = company_groups[0].member.concat(company_groups[1].member);
//             console.log('成员',members);
//           }
//           var caption = "Competition Message!";

//           var _param = {
//             'members':members,
//             'caption':caption,
//             'content':null,
//             'sender':[],
//             'team':[team.own,team.opposite],
//             'company_id':null,
//             'req':req,
//             'res':res,
//             'type':'team'
//           }
//           oneToMember(_param);
//         }
//       }
//       var param= {
//         'collection':CompanyGroup,
//         'type':1,
//         'condition':condition,
//         'limit':{'member':1},
//         'sort':null,
//         'callback':callback,
//         '_err':_err,
//         'other_param':null,
//         'req':req,
//         'res':res
//       };
//       get(param);
//       break;
//     default:break;
//   }
// }

//比赛结果确认时给队长发送站内信
exports.resultConfirm = function(req,res,olid,team,competition_id,theme){
  var content = null,
      sender = {
        '_id':req.user._id,
        'nickname':req.user.nickname,
        'photo':req.user.photo,
        'role':'LEADER'
      };
  var callbackMC = function (message_content,olid,req,res){
    var callbackM = function (message_content,other,req,res){
      return {'result':1,'msg':'SUCCESS'};
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
    'caption':theme,
    'content':content,
    'sender':[sender],
    'team':[team],
    'type':'private',
    'company_id':req.user.cid,
    'campaign_id':competition_id,
    'auto':true,
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


//按照条件获取未读站内信
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
                  getMessage(req,res,{'rec_id':req.user._id,'status':{'$nin':['delete','read']}},null);
                }
              }
            );
          }else{
            console.log('USER_ALREADY_HAS_MSG_AND_OLD');
            getMessage(req,res,{'rec_id':req.user._id,'status':{'$nin':['delete','read']}},null);
          }
        //该用户没有收到任何站内信
        }else{
          var counter = {'i':0};
          async.whilst(
            function() { return counter.i < message_contents.length},
            function(__callback){
              if(message_contents[counter.i].post_date > req.user.register_date){
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
              }else{
                counter.i++;
                __callback();
              }
            },
            function(err){
              if(err){
                return res.send({'result':1,'msg':'FAILURED'});
              }else{
                console.log('USER_HAS_NO_MSG_AND_NEW');
                getMessage(req,res,{'rec_id':req.user._id,'status':{'$nin':['delete','read']}},null);
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
      getMessage(req,res,{'rec_id':req.user._id,'status':{'$nin':['delete','read']}},null);
    }
  }
  var _condition;
  if(req.user.provider==='company'){
    _condition = {'type':'global'};//公司只获取系统消息
  }else{
    _condition = {'$or':[{'type':'company','company_id':cid},{'type':'global'}]};//用户获取公司和系统消息
  }
  var paramA = {
    'collection':MessageContent,
    'type':1,
    'condition':_condition,
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



//按照条件获取所有站内信
var getMessage = function(req,res,condition,callback){
  var sort = {'create_date':-1};
  Message.find(condition).sort(sort).populate('MessageContent').exec(function (err, messages){
    if(err || !messages){
      _err(err);
      res.send({
        'msg':[],
        'team':req.user.team,
        'cid':req.user.provider === 'company' ? req.user._id : req.user.cid,
        'uid':req.user._id,
        'provider':req.user.provider
      });
    }else{
      var rst = [];
      if(callback != null){
        for(var i = 0; i < messages.length; i ++){
          if(callback(messages[i].MessageContent)){
            rst.push({
              '_id':messages[i]._id,
              'rec_id':messages[i].rec_id,
              'status':messages[i].status,
              'type':messages[i].type,
              'message_content':messages[i].MessageContent
            });
          }
        }
      }else{
        for(var i = 0; i < messages.length; i ++){
          rst.push({
            '_id':messages[i]._id,
            'rec_id':messages[i].rec_id,
            'status':messages[i].status,
            'type':messages[i].type,
            'message_content':messages[i].MessageContent
          });
        }
      }
      res.send({
        'msg':rst,
        'team':req.user.team,
        'cid':req.user.provider === 'company' ? req.user._id : req.user.cid,
        'uid':req.user._id,
        'provider':req.user.provider
      });
    }
  });
}

//修改站内信状态(比如用户点击了一条站内信就把它设为已读,或者删掉这条站内信)
exports.setMessageStatus = function(req,res){
  var status = req.body.status;
  var _type = req.body.type;
  var status_model = ['read','unread','delete','undelete'];
  if(status_model.indexOf(status) > -1){
    var operate = {'$set':{'status':status}};
    var callback = function(value){
      res.send({'msg':'MODIFY_OK'});
    }
    var param = {
      'collection':Message,
      'operate':operate,
      'callback':callback,
      '_err':_err
    };
    if(_type === 'send'){
      param.collection = MessageContent;
    }
    if(!req.body.multi){
      var msg_id = req.body.msg_id;
      param.condition = msg_id;
      param.type = 0;
    }else{
      switch(_type){
        case 'all':
          param.condition = {'rec_id':req.user._id,'status':{'$ne':'delete'}};
        break;
        case 'private':
          param.condition = {'$or':[{'type':'private'},{'type':'global'}],'rec_id':req.user._id,'status':{'$ne':'delete'}};
        break;
        case 'send':
          param.condition = {'sender':{'$elemMatch':{'_id':req.user._id}},'status':{'$ne':'delete'}};
        break;
        default:
          param.condition = {'type':_type,'rec_id':req.user._id,'status':{'$ne':'delete'}};
        break;
      }
      param.type = 1;
    }
    set(param);
  }else{
    res.send({'msg':'STATUS_ERROR'});
  }
}


//列出已发送消息
exports.senderList = function(req,res){
  var _condition;
  switch(req.params.sendType){
    case 'private':
      var sid = req.user._id;
      _condition = {'sender':{'$elemMatch':{'_id':sid}},'status':'undelete'};
    break;
    case 'team':
      var teamId = req.params.sendId;
      _condition = {'team':{'$elemMatch':{'_id':teamId}},'status':'undelete'};
    break;
    default:break;
  }

  var callback = function(message_contents,other,req,res){
    res.send({'msg':'SUCCESS','message_contents':message_contents});
  }
  var paramA = {
    'collection':MessageContent,
    'type':1,
    'condition':_condition,
    'limit':null,
    'sort':{'post_date':-1},
    'callback':callback,
    '_err':_err,
    'other_param':null,
    'req':req,
    'res':res
  };
  get(paramA);
}

//手动获取私信
exports.messageGetByHand = function(req,res){
  var _type = req.body._type;
  var condition;
  switch(_type){
    case 'private':
      condition = {'$or':[{'type':'private'},{'type':'global'}],'rec_id':req.user._id,'status':{'$ne':'delete'}};
    break;
    case 'all':
      condition = {'rec_id':req.user._id,'status':{'$ne':'delete'}};
    break;
    default:
      condition = {'type':_type,'rec_id':req.user._id,'status':{'$ne':'delete'}};
    break;
  }
  getMessage(req,res,condition,null);
}


//只读取未读站内信
exports.messageHeader = function(req,res){
  //用户可以读取各种类型的站内信
  if(req.user.provider === 'user'){
    getPublicMessage(req,res,req.user.cid);
  //公司只能读取系统站内信
  }else{
    getPublicMessage(req,res,null);
  }
}


exports.home = function(req,res){
  if(req.role !=='GUESTHR' && req.role !=='GUEST' && req.role !=='GUESTLEADER'){

    var _send = {
      'role':req.role,
      'cid':req.user.provider === 'user'? req.user.cid : req.user._id,
      'team':req.params.teamId ? true : false,
      'teamId': req.companyGroup != undefined ? req.companyGroup._id : null,
      'teamName': req.companyGroup != undefined ? req.companyGroup.name : null,
      'teamLogo': req.companyGroup != undefined ? req.companyGroup.logo : null
    };
    _send.leader = false;
    if(req.params.teamId){
      _send.logo = _send.teamLogo;
      _send.name = _send.teamName;
      _send.teamId = req.params.teamId;
      if(req.user.provider==='user'){
        for(var i = 0 ; i < req.user.team.length; i ++){
          if(req.user.team[i]._id.toString() === _send.teamId.toString()){
            _send.leader = req.user.team[i].leader;
            break;
          }
        }
      }
    }
    else if(req.user.provider==='user'){
      _send.logo = req.user.photo;
      _send.name = req.user.nickname;
      _send.cid = req.user.cid;
    }
    else{
      _send.logo = req.user.info.logo;
      _send.name = req.user.info.official_name;
      _send.cid = req.user._id;
    }
    res.render('message/message',_send);
  }else{
    res.send(403);
  }
}
exports.renderAll = function(req,res){
  if(req.role !=='GUESTHR' && req.role !=='GUEST' && req.role !=='GUESTLEADER'){
    res.render('message/all',{'provider':req.user.provider});
  }else{
    res.send(403);
  }
}
exports.renderSender = function(req,res){
  res.render('message/send',{'provider':req.user.provider});
}

//这些以后站内信分类时会用到的
/*
exports.renderPrivate = function(req,res){
  if(req.role !=='GUESTHR' && req.role !=='GUEST' && req.role !=='GUESTLEADER'){
    res.render('message/private');
  }else{
    res.send(403);
  }
}
exports.renderTeam = function(req,res){
  if(req.role !=='GUESTHR' && req.role !=='GUEST' && req.role !=='GUESTLEADER'){
    res.render('message/team');
  }else{
    res.send(403);
  }
}
exports.renderCompany = function(req,res){
  if(req.role !=='GUESTHR' && req.role !=='GUEST' && req.role !=='GUESTLEADER'){
    res.render('message/company');
  }else{
    res.send(403);
  }
}
exports.renderSystem = function(req,res){
  if(req.role !=='GUESTHR' && req.role !=='GUEST' && req.role !=='GUESTLEADER'){
    res.render('message/system');
  }else{
    res.send(403);
  }
}
*/
