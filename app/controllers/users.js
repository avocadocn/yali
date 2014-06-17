'use strict';

/**
 * Module dependencies.
 */

// node system
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

// mongoose and models
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Company = mongoose.model('Company'),
  Group = mongoose.model('Group'),
  CompanyGroup = mongoose.model('CompanyGroup'),
  GroupMessage = mongoose.model('GroupMessage'),
  Campaign = mongoose.model('Campaign'),
  Competition = mongoose.model('Competition');

// 3rd
var validator = require('validator'),
  async = require('async'),
  gm = require('gm');

// custom
var encrypt = require('../middlewares/encrypt'),
  mail = require('../services/mail'),
  schedule = require('../services/schedule'),
  moment = require('moment'),
  config = require('../config/config'),
  meanConfig = require('../../config/config'),
  message = require('../language/zh-cn/message'),
  model_helper = require('../helpers/model_helper');







/**
 * Show login form
 */
exports.signin = function(req, res) {
  var msg = {
    title : "用户登录"
  };
  if(req.params.status){
    switch(req.params.status){
      case 'failure':
        msg.msg = "用户名不存在或者密码错误!";
        break;
      default:break;
    }
  }
  if(req.user) {
    res.redirect('/users/home');
  } else {
    res.render('users/signin', msg);
  }
};
/*
  忘记密码
*/
exports.renderForgetPwd = function(req, res){
  res.render('users/forgetPwd',{
    title:'忘记密码'
  });
}
exports.forgetPwd = function(req, res){
  User.findOne({email: req.body.email}, function(err, user) {
    if(err || !user) {
      return  res.render('users/forgetPwd',{
                title:'忘记密码',
                err: '您输入的账号不存在'
              });
    } else {
      mail.sendStaffResetPwdMail(user.email, user._id.toString(), req.headers.host);
      res.render('users/forgetPwd', {
        title: '忘记密码',
        success:'1'
      });
    }
  });
}
exports.renderResetPwd = function(req, res){
  var key = req.query.key;
  var uid = req.query.uid;
  var time = req.query.time;
  time = new Date(encrypt.decrypt(time, config.SECRET));
  var validTime = new Date();
  validTime.setMinutes(new Date().getMinutes()-30);
  if(time<validTime){
    return  res.render('users/forgetPwd',{
          title:'忘记密码',
          err: '您的验证邮件已经失效，请重新申请'
        });
  }
  else if(encrypt.encrypt(uid, config.SECRET) ===key){
      res.render('users/resetPwd',{
        title:'重设密码',
        id: uid
      });
  }
  else{
      return  res.render('users/forgetPwd',{
        title:'忘记密码',
        err: '您的验证链接无效，请重新验证'
      });
  }

}
exports.resetPwd = function(req, res){
  User.findOne({_id: req.body.id}, function(err, user) {
    if(err || !user) {
      console.log('err');
      return  res.render('users/resetPwd',{
                title:'重设密码',
                err: '您输入的账号不存在'
              });
    } else {
      user.password = req.body.password;
      user.save(function(err){
        if(!err){
          res.render('users/resetPwd', {
            title: '重设密码',
            success: '1'
          });
        }
      });
    }
  });
}
/**
 * Logout
 */
exports.signout = function(req, res) {
  if(req.session.nowtid != null || req.session.nowtid != undefined){
    delete req.session.nowtid;
  }
  if(req.session.nowgid != null || req.session.nowgid != undefined){
    delete req.session.nowgid;
  }
  if(req.session.nowuid != null || req.session.nowuid != undefined){
    delete req.session.nowuid;
  }
  if(req.session.role != null || req.session.role != undefined){
    delete req.session.role;
  }
  req.logout();
  res.redirect('/');
};

/**
 * Session
 */
exports.loginSuccess = function(req, res) {
  res.redirect('/users/home');
};

exports.appLoginSuccess = function(req, res) {
  var data = {
    _id: req.user._id,
    nickname: req.user.nickname,
    role: req.user.role
  };
  res.send({ result: 1, msg: '登录成功', data: data });
}

exports.appLogout = function(req, res) {
  req.logout();
  res.send({ result: 1, msg: '注销成功' });
}

exports.authorize = function(req, res, next) {
  if(!req.params.userId || req.params.userId === req.user._id.toString()){
    req.session.role = 'OWNER';
    req.session.nowuid = req.user._id;
  }
  else if(req.params.userId && req.user._id.toString() === req.profile.cid.toString()){
    req.session.role = 'HR';
    req.session.nowuid = req.params.userId;
  }
  else if(req.params.userId && req.profile.cid.toString() === req.user.cid.toString()){
    req.session.role = 'PARTNER';
    req.session.nowuid = req.params.userId;
  }else{
    return res.send(403, 'forbidden!');
  }
  next();
};


/**
 * 通过邀请链接进入激活流程
 */
exports.invite = function(req, res) {
  var key = req.query.key;
  var cid = req.query.cid;
  if(key == undefined || cid == undefined) {
    res.render('users/message', {title: 'error', message: 'bad request'});
  } else {
    if (encrypt.encrypt(cid, config.SECRET) === key) {
      Company
      .findOne({ _id: cid })
      .exec()
      .then(function(company) {
        if (!company) {
          throw 'Not Found';
        }
        req.session.key = key;
        req.session.key_id = cid;
        res.render('users/invite', {
          title: 'validate',
          domains: company.email.domain
        });
      })
      .then(null, function(err) {
        console.log(err);
        res.render('users/message', {title: 'error', message: 'bad request'});
      });

    }
  }
};



function userOperate(cid, key, res, req) {

  if (encrypt.encrypt(cid, config.SECRET) === key) {

    Company
    .findOne({ _id: cid })
    .exec()
    .then(function(company) {
      if (!company) {
        throw 'Not found company';
      }

      User
      .findOne({ username: req.body.host + '@' + req.body.domain })
      .exec()
      .then(function(user) {
        if (user) {
          return res.render('users/invite', {
            title: 'validate',
            domains: company.email.domain,
            message: '该邮箱已被注册'
          });
        }

        var email = req.body.host + '@' + req.body.domain;
        if(company.login_email !== email) {
          if (company.email.domain.indexOf(req.body.domain) > -1) {
            var user = new User({
              email: email,
              username: email,
              cid: company._id,
              cname: company.info.name
            });
            user.save(function(err) {
              if (err) {
                console.log(err);
              } else {
                company.info.membernumber = company.info.membernumber + 1;
                company.save(function(err){
                  if(err) {
                    console.log(err);
                  } else {
                    //系统再给员工发一封激活邮件
                    mail.sendStaffActiveMail(user.email, user._id.toString(), company._id.toString(), req.headers.host);
                    res.render('users/message', message.wait);
                  }
                });
              }
            });
          } else {
            res.render('users/invite', {
              title: 'validate',
              domains: company.email.domain,
              message: '请使用企业邮箱'
            });
          }

        } else {
          res.render('users/invite', {
            title: 'validate',
            domains: company.email.domain,
            message: '员工邮箱与企业邮箱不能相同'
          });
        }

      })
      .then(null, function(err) {
        console.log(err);
        res.render('users/message', message.invalid);
      });

    })
    .then(null, function(err) {
      console.log(err);
      res.render('users/message', message.invalid);
    });

  } else {
    res.render('users/message', message.invalid);
  }


}
/**
 * 处理激活验证
 */
exports.dealActive = function(req, res) {
  var key = req.session.key;
  var cid = req.session.key_id;
  userOperate(cid, key, res, req);
};

/**
 * 通过激活链接进入，完善个人信息
 */
exports.setProfile = function(req, res) {
  var key = req.query.key;
  var uid = req.query.uid;
  User.findOne({_id: uid}, function(err, user) {
    if(err) {
      console.log(err);
      res.render('users/message', message.dbError);
    } else if(user) {
      if(user.active === true) {
        res.render('users/message', message.actived);
      } else {
        req.session.nowcid = req.query.cid;
        if(encrypt.encrypt(uid, config.SECRET) === key) {
          res.render('users/setProfile', {
            title: '设置个人信息',
            key: key,
            uid: uid
          });
        } else {
          res.render('users/message', message.invalid);
        }
      }
    } else {
      res.render('users/message', message.unregister);
    }
  });
};

/**
 * 处理个人信息表单
 */
exports.dealSetProfile = function(req, res) {
  User.findOne(
    {_id : req.query.uid}
  , function(err, user) {
    if(err) {
      console.log(err);
      res.render('users/message', message.dbError);
    }
    else {
      if(user) {
        if(user.active === false) {
          user.nickname = req.body.nickname;
          user.password = req.body.password;
          user.realName = req.body.realName;
          user.department = req.body.department;
          user.phone = req.body.phone;
          user.role = 'EMPLOYEE';

          user.save(function(err) {
            if(err) {
              console.log(err);
              res.render('users/message', message.dbError);
            }
            req.session.username = user.username;
            res.redirect('/users/selectGroup');
          });
        } else {
          res.render('users/message', message.actived);
        }
      } else {
        res.render('users/message', message.unregister);
      }
    }
  });

};

/**
 * 选择组件页面
 */
exports.selectGroup = function(req, res) {
  User.findOne({ username: req.session.username }, function(err, user) {
    if(err) {
      console.log(err);
      res.render('users/message', message.dbError);
    } else if(user) {
      if(user.active === true) {
        res.render('users/message', message.actived);
      } else {
        res.render('users/selectGroup', { title: '选择你的兴趣小组', group_head: '个人' });
      }
    } else {
      res.render('users/message', message.unregister);
    }
  });
}

/**
 * 处理选择组件表单
 */
exports.dealSelectGroup = function(req, res) {
  if(req.body.selected == undefined) {
    return res.redirect('/users/selectGroup');
  } else {
    ;
  }
  User.findOne({'username': req.session.username}, function(err, user) {
    if(user) {
      if (err) {
        res.status(400).send('用户不存在!');
        return;
      } else if(user) {
        if(user.active === false) {

          user.group = req.body.selected;


          user.active = true;
          user.save(function(err){
            if(err){
              console.log(err);
              res.render('users/message', message.dbError);
            }


            //其实只要根据team_id来查询即可,根本不需要 cid 和 gid, 但是
            //通过cid和gid来限制查询条件可以很大程度上提高查询的性能
            for( var i = 0; i < user.group.length && user.group[i]._id != '0'; i ++) {
              for( var j =0; j < user.group[i].team.length; j ++) {
                CompanyGroup.findOne({'cid':user.cid,'gid':user.group[i]._id ,'_id':user.group[i].team[j].id}, function(err, company_group) {
                  company_group.member.push({
                    '_id':user._id,
                    'nickname':user.nickname,
                    'photo':user.photo
                  });
                  company_group.save(function(err){
                    if(err){
                      console.log(err);
                    }
                  });
                });
              }
            }
          });
          res.redirect('/users/finishRegister');
        } else {
          res.render('users/message', message.actived);
        }
      }
    } else {
      res.render('users/message', message.unregister);
    }
  });
};

/**
 * 完成注册
 */
exports.finishRegister = function(req, res) {
  res.render('users/signin', {title: '激活成功,请登录!', message: '激活成功,请登录!'});
};


//列出该user加入的所有小组的动态
exports.getGroupMessages = function(req, res) {
  if(req.session.role!=='OWNER'){
    return res.send(403,'forbidden');
  }
  var group_messages = [];
  var i = 0;
  var companyLogo;
  console.log('really?');


  async.whilst(
    function() { return i < req.user.group.length; },

    function(callback) {
      var team_ids = [];
      var team_names = [];
      var tid,tname;
      for(var k = 0; k < req.user.group[i].team.length; k ++){
        //如果team是active的，则push进去
        tid=req.user.group[i].team[k].id;
        tname = req.user.group[i].team[k].name;
        //console.log(tid,req.user.group[i].team[k].id);
        team_ids.push(tid);
        team_names.push(tname);
        //此处若加查询，异步会出错Todo M
        /*
        CompanyGroup.findOne({
          '_id':tid
        },function(err,companyGroup){
          if(err){
            console.log(err);
            return res.send(err)
          }else{
            if(companyGroup.active === true)
              team_ids.push(tid);
          }
        });
        */
      }
      GroupMessage.find({'team' :{'$in':team_ids}})
      .populate('team').sort({'date':-1})
      .exec(function(err, group_message) {
        if (group_message.length > 0) {
          if (err) {
            console.log(err);
            return res.send([]);
          } else {

            var length = group_message.length;
            for(var j = 0; j < length; j ++) {

              var positive = 0;
              var negative = 0;
              var my_team_id,my_team_name;
              var find = true;
              var host = true;

              //如果是比赛动态
              if(group_message[j].provoke.active) {
                for(var k = 0; k < group_message[j].team.length && find; k ++) {
                  for(var l = 0; l < req.user.group[i].team.length; l ++) {
                    if(group_message[j].team[k]._id.toString() === req.user.group[i].team[l].id.toString()) {
                      my_team_id = req.user.group[i].team[l].id;
                      my_team_name = req.user.group[i].team[l].name;
                      positive = group_message[j].provoke.camp[k].vote.positive;
                      negative = group_message[j].provoke.camp[k].vote.negative;
                      find = false;
                      host = (k === 0);
                      break;
                    }
                  }
                }

              } else {
                //如果是普通活动动态
                for(var l = 0; l < team_ids.length; l ++) {
                  if(group_message[j].team[0]._id.toString() === team_ids[l].toString()) {
                    my_team_id = team_ids[l];
                    my_team_name = team_names[l];
                    break;
                  }
                }
              }
              //console.log('logo'+ j +':' + group_message[j].team[0].logo,host);
              //console.log('group_message_id'+ j +':' + group_message[j]._id);
              group_messages.push({
                'positive' : positive,
                'negative' : negative,
                'my_team_name' : my_team_name,
                'my_team_id': my_team_id,
                'host': host,                  //是不是发赛方
                '_id': group_message[j]._id,
                'cid': group_message[j].cid,
                'group': group_message[j].group,
                'active': group_message[j].active,
                'date': group_message[j].date,
                'poster': group_message[j].poster,
                'content': group_message[j].content,
                'location' : group_message[j].location,
                'start_time' : group_message[j].start_time ? group_message[j].start_time.toLocaleDateString() : '',
                'end_time' : group_message[j].end_time ? group_message[j].end_time.toLocaleDateString() : '',
                'provoke': group_message[j].provoke,
                'logo':host ? group_message[j].team[0].logo : group_message[j].team[1].logo,
                'provoke_accept': false
              });
            }
          }
        }
        i++;
        callback();
      });
      Company.findOne({'_id':req.user.cid}).exec(function(err,company){
        companyLogo = company.info.logo;
      });
    },


    function(err) {
      if (err) {
        console.log(err);
        res.send([]);
      } else {
        res.send({'group_messages':group_messages,'role':req.session.role,'companyLogo':companyLogo});
      }
    }
  );
};

exports.renderCampaigns = function(req, res){
  res.render('partials/campaign_list',{
      'role':req.session.role,
      'provider':'user'
  });
};




function fetchCampaign(req,res,team_ids,role) {
  var campaigns = [];
  var join = false;
  Campaign.find({'team' : {'$in':team_ids}}).sort({'_id':-1})
  .exec(function(err, campaign) {
    if (err || !campaign) {
      return res.send({
        'data':[],
        'role':role
      });
    } else {
      var length = campaign.length;
      for(var j = 0; j < length; j ++) {
        join = false;
        for(var k = 0;k < campaign[j].member.length; k ++) {
          if(req.user._id.toString() === campaign[j].member[k].uid) {
            join = true;
            break;
          }
        }
        campaigns.push({
          'over' : !(Date.now() - campaign[j].end_time.valueOf() <= 0),
          'selected': true,
          'active':campaign[j].active, //截止时间到了活动就无效了
          '_id': campaign[j]._id.toString(),
          'gid': campaign[j].gid,
          'group_type': campaign[j].group_type,
          'cid': campaign[j].cid,
          'cname': campaign[j].cname,
          'poster': campaign[j].poster,
          'content': campaign[j].content,
          'location': campaign[j].location,
          'member_length': campaign[j].member.length,
          'create_time': campaign[j].create_time ? campaign[j].create_time : '',
          'start_time': campaign[j].start_time ? campaign[j].start_time : '',
          'end_time': campaign[j].end_time ? campaign[j].end_time : '',
          'join':join,
          'provoke':campaign[j].provoke,
          'index':j
        });
      }
      return res.send({
        'data':campaigns,
        'role':role
      });
    }
  });
}

function fetchTeam(group) {
  var temp = [];
  for(var i = 0; i < group.length; i ++) {
    for(var j = 0; j < group[i].team.length; j ++) {
      temp.push(group[i].team[j].id);
    }
  }
  return temp;
}
//列出该user加入的所有小组的活动
//这是在员工日程里的,不用判断权限,因为关闭活动等操作
//必须让队长进入小队页面去完成,不能在个人页面进行
exports.getCampaigns = function(req, res) {
  var team_ids = [];
  var group;

  if(req.session.otheruid != null) {
    User.findOne({'_id':req.session.otheruid},function (err,user){
      if(err || !user) {
        return res.send({
          'data':[],
          'role':req.session.role
        });
      } else {
        group = user.group;
        team_ids = fetchTeam(group);
        fetchCampaign(req,res,team_ids,req.session.role);
      }
    });
  } else {
    group = req.user.group;
    team_ids = fetchTeam(group);
    fetchCampaign(req,res,team_ids,req.session.role);
  }
};


exports.home = function(req, res) {

  if(req.params.userId) {
    req.session.otheruid = req.params.userId;
  } else {
    req.session.otheruid = null;
  }
  var _user = {};
  var _nickname,_logo;
  if(req.session.role ==='OWNER'){
    _user = req.user;

  }
  else{
    _user = req.profile;
  }
  if(req.session.role ==='HR'){
    _nickname = req.user.info.name,   //显示在页头的用户名
    _logo = _user.user.info.logo
  }
  else{
    _nickname = _user.nickname,   //显示在页头的用户名
    _logo = _user.photo
  }

  var selected_teams = [];
  var unselected_teams = [];
  var user_teams = [];
  for(var i = 0; i < req.user.group.length; i ++) {
    for(var j = 0; j < req.user.group[i].team.length; j ++) {
      user_teams.push(req.user.group[i].team[j].id.toString());
    }
  }
  CompanyGroup.find({'cid':req.user.cid}, {'_id':1,'gid':1,'group_type':1,'logo':1,'name':1,'active':1},function(err, company_groups) {
    if(err || !company_groups) {
      return res.send([]);
    } else {
      var _cg_length= company_groups.length;
      for(var i = 0; i < _cg_length; i ++) {
        //下面查找的是该成员加入和未加入的所有active小队
        if(company_groups[i].gid !=='0' && company_groups[i].active==true){
          if(user_teams.indexOf(company_groups[i]._id.toString()) > -1) {
            selected_teams.push(company_groups[i]);
          } else {
            unselected_teams.push(company_groups[i]);
          }
        }
      }
      res.render('users/home',{
        'selected_teams' : selected_teams,
        'unselected_teams' : unselected_teams,
        'photo': _user.photo,
        'realname':_user.realname,
        'cname':_user.cname,
        'sign':_user.introduce,
        'role':req.session.role,
        'nav_name' : _nickname,   //显示在页头的用户名
        'nav_logo' : _logo          //显示在页头的用户头像
      });
    }
  });
};

exports.editInfo = function(req, res) {
  return res.render('users/editInfo',{
    'title': '个人资料',
    'role': req.session.role
  });
};


//员工投票是否参加约战
//记得要做重复投票检查 TODO
exports.vote = function (req, res) {

  var tid = req.body.tid;
  var cid = req.session.nowcid ? req.session.nowcid : req.user.cid;
  var uid = req.session.nowuid ? req.session.nowuid : req.user._id;
  var aOr = req.body.aOr;
  var value = 1;
  var provoke_message_id = req.body.provoke_message_id;
  var positive_already = false;
  var negative_already = false;

  console.log(provoke_message_id);

  Competition.findOne({
    'provoke_message_id' : provoke_message_id
  },
  function (err, competition) {
    if (competition) {

      for(var j = 0; j < competition.camp.length; j ++) {
        if(competition.camp[j].id.toString() === tid.toString()) {
          for(var i = 0; i < competition.camp[j].vote.positive_member.length; i ++) {
            if(competition.camp[j].vote.positive_member[i].uid.toString() === uid.toString()) {
              console.log('positive');
              positive_already = true;
              value = -1;
              if(aOr) competition.camp[j].vote.positive_member.splice(i,1);
              break;
            }
          }
          for(var i = 0; i < competition.camp[j].vote.negative_member.length; i ++) {
            if(competition.camp[j].vote.negative_member[i].uid.toString() === uid.toString()) {
              console.log('negative');
              negative_already = true;
              value = -1;
              if(!aOr) competition.camp[j].vote.negative_member.splice(i,1);
              break;
            }
          }
          if (aOr) {
            if(negative_already){
              return res.send({"msg":"你已经反对过啦!"});
            }
            competition.camp[j].vote.positive +=value;
            if(value===1){
              competition.camp[j].vote.positive_member.push({'cid':cid,'uid':uid});
            }
          } else {
            if(positive_already) {
              return res.send({"msg":"你已经赞过啦!"});
            }
            competition.camp[j].vote.negative +=value;
            if(value===1){
              competition.camp[j].vote.negative_member.push({'cid':cid,'uid':uid});
            }
          }
          break;
        }
      }

      competition.save(function (err) {
        if(err) {
          return res.send('ERROR');
        } else {
          //由于异步方式下的多表操作有问题,所以只能在groupmessage里多添加positive和negative字段了
          GroupMessage.findOne({'_id' : provoke_message_id}, function (err, group_message) {
            if (err || !group_message) {
              console.log(err);
              return res.send('ERROR');
            } else {

              var positive,negative;
              for(var i = 0; i < group_message.provoke.camp.length; i ++) {
                if(group_message.provoke.camp[i].tid.toString() === tid.toString()) {
                  if (aOr) {
                    group_message.provoke.camp[i].vote.positive +=value;
                  } else {
                    group_message.provoke.camp[i].vote.negative +=value;
                  }
                  positive = group_message.provoke.camp[i].vote.positive;
                  negative = group_message.provoke.camp[i].vote.negative;
                  break;
                }
              }
              group_message.save(function (err){
                if(err) {
                  return res.send('ERROR');
                } else {
                  return res.send({
                    'positive' : positive,
                    'negative' : negative
                  });
                }
              });
            }
          });
        }
      });
    } else {
      console.log('没有此约战!');
      return res.send('NULL');
    }
  });
};

//员工参加活动
//TODO 加入competition
exports.joinCampaign = function (req, res) {
  if(req.session.role!=='OWNER' && req.session.role!=='EMPLOYEE' && req.session.role!=='MEMBER' && req.session.role!=='LEADER'){
    return res.send(403,'forbidden');
  }
  var cid = req.user.cid.toString();
  var uid = req.user._id.toString();
  var campaign_id = req.body.campaign_id; //该活动的id
  var tid = req.session.nowtid;              //该活动所属小队的id
  Campaign.findOne({
    _id : campaign_id
  },
  function (err, campaign) {
    if (campaign) {
        campaign.member.push({
          'cid':cid,
          'uid':uid,
          'nickname':req.user.nickname,
          'photo':req.user.photo
        });
        campaign.save(function (err) {
          if(err) {
            console.log(err);
            return res.send(err);
          } else {
            if(campaign.provoke.active === true) {

              //将员工信息存入competition,要根据他的队名判断属于哪一方
              Competition.findOne({'_id':campaign.provoke.competition_id}, function (err, competition) {
                if(err){
                  return res.send(err);
                } else {
                  if(competition) {
                    for(var i = 0; i < competition.camp.length; i ++) {
                      if(tid && competition.camp[i].id.toString() === tid.toString()) {
                        competition.camp[i].member.push({
                           camp: i == 0 ? 'A' : 'B',
                           cid: cid,
                           uid: uid,
                           photo: req.user.photo,                 //队员头像路径
                           nickname: req.user.nickname,
                           number: 0                             //球队分配的个人号码
                        });
                        break;
                      }
                    }
                    competition.save(function (err) {
                      if(err) {
                        return res.send(err);
                      } else {
                          res.send({ result: 1, msg: '参加活动成功'});
                      }
                    });
                  } else {
                    return res.send({ result: 0, msg: '没有此活动'});
                  }
                }
              });
            }
            else
               res.send({ result: 1, msg: '参加活动成功'});
          }
        });
    } else {
      return res.send({ result: 0, msg: '没有此活动'});
    }
  });
};


//员工退出活动
exports.quitCampaign = function (req, res) {
  if(req.session.role!=='OWNER' && req.session.role!=='EMPLOYEE' && req.session.role!=='MEMBER' && req.session.role!=='LEADER'){
    return res.send(403,'forbidden');
  }
  var cid = req.user.cid.toString();
  var uid = req.user._id.toString();
  var campaign_id = req.body.campaign_id; //该活动的id
  Campaign.findOne({
        _id : campaign_id
    },
    function (err, campaign) {
      if (campaign) {

        //从campaign里删除该员工信息
        for( var i = 0; i < campaign.member.length; i ++) {
          if (campaign.member[i].uid.toString() === uid.toString()) {
            campaign.member.splice(i,1);
            break;
          }
        }

        campaign.save(function (err) {
          if(err){
            return res.send(err);
          } else {
            if(campaign.provoke.active === true) {
              //将员工信息从competition里删除
              Competition.findOne({'_id':campaign.provoke.competition_id}, function (err, competition) {
                if(err){
                  return res.send(err);
                } else {
                  if(competition) {
                    var find = false;

                    //看该员工是不是在camp[0]里面
                    for(var i = 0; i < competition.camp[0].member.length; i++) {
                      if (competition.camp[0].member[i].uid.toString() === uid.toString()) {
                        competition.camp[0].member.splice(i,1);
                        find = true;
                        break;
                      }
                    }
                    //如果不在camp[0]里面就一定在camp[1]里面
                    if(!find) {
                      for(var i = 0; i < competition.camp[1].member.length; i++) {
                        if (competition.camp[1].member[i].uid.toString() === uid.toString()) {
                          competition.camp[1].member.splice(i,1);
                          find = true;
                          break;
                        }
                      }
                    }
                    competition.save(function (err) {
                      if(err) {
                        return res.send(err);
                      } else {
                        return res.send({ result: 1, msg: '退出活动成功'});
                      }
                    });
                  } else {
                    return res.send({ result: 0, msg: '没有此比赛'});
                  }
                }
              });
            }
            else{
              return res.send({ result: 1, msg: '退出活动成功'});
            }
          }
        });
      } else {
          return res.send({ result: 0, msg: '没有此活动'});
      }
    });
};
exports.timeLine = function(req,res){
  //如果是访问其它员工的timeline
  var uid = (req.session.otheruid != null ? req.session.otheruid : req.session.nowuid);
  Campaign
  .find({ 'end_time':{'$lt':new Date()},'member.uid': uid})
  .sort('-start_time')
  .populate('team')
  .exec()
  .then(function(campaigns) {
    if (campaigns && campaigns.length>0) {
      var timeLines = [];
      campaigns.forEach(function(campaign) {
        var _head;
        if(campaign.provoke.active){
          _head = campaign.team[0].name +'对' + campaign.team[1].name +'的比赛';
        }
        else if(campaign.gid[0]==='0'){
          _head = '公司活动';
        }
        else{
          _head = campaign.team[0].name + '活动';
        }
        var tempObj = {
          id: campaign._id,
          head: _head,
          logo:campaign.team[0].logo,
          content: campaign.content,
          location: campaign.location,
          group_type: campaign.group_type,
          date: campaign.start_time,
          provoke:campaign.provoke,
        }
        timeLines.push(tempObj);
      });
      res.render('partials/timeLine',{'timeLines': timeLines,'moment':moment });
    }
    else{
      res.render('partials/timeLine');
    }
  })
  .then(null, function(err) {
    console.log(err);
    res.render('partials/timeLine');
  });
};

//用户加入小组
exports.joinGroup = function (req, res){
  var uid = req.user._id.toString();
  var tid = req.body.tid;
  User.findOne({
    _id: uid
  },
  function (err, user){
    if(err)
      return res.send(err);
    if(user){
      CompanyGroup.findOne({
        _id : tid
        },
        function (err,companyGroup) {
          if(err)
            return res.send(err);
          if(companyGroup){
            //先把个人资料先放入组员中
            companyGroup.member.push({
              '_id':user._id,
              'nickname':user.nickname,
              'photo':user.photo
            });
            //再去找此人是否加过此组件 找到则find为true，并在此组中加入此team
            var find = false;
            var team ={'id':companyGroup._id, 'name':companyGroup.name, 'leader': false, 'logo':companyGroup.logo};
            console.log(team);
            for(var i=0;i<user.group.length;i++){
              if(companyGroup.gid=== user.group[i]._id){
                user.group[i].team.push(team);
                find=true;
                break;
              }
            }
            //如果没找到，新建一个带此team的组push到用户的group里
            if(find===false){
              user.group.push({
                '_id': companyGroup.gid,
                'group_type': companyGroup.group_type,
                'entity_type': companyGroup.entity_type,
                'team': [team]
              });
            }
            //保存小组
            companyGroup.save(function (err){
              if(err){
                console.log(err);
                return res.send({result: 0, msg:'保存小组出错'});
              }
            });
            //保存用户
            user.save(function (err){
              if(err){
                console.log(err);
                return res.send({result: 0, msg:'保存用户出错'});
              }
              console.log('保存用户成功');
            });
            return res.send({result: 1, msg:'保存用户成功'});
          }
      });
    }
  });
};

//用户退出小组
exports.quitGroup = function (req, res){
  var uid = req.user._id.toString();
  var tid = req.body.tid;
  CompanyGroup.findOne({
    _id: tid
    },
    function (err, companyGroup){
      if (err)
        return res.send(err);
      if(companyGroup){
         //从companyGroup的memeber里删除此人
        for(var i =0; i<companyGroup.member.length; i++){
          if(companyGroup.member[i]._id.toString() === uid){
            companyGroup.member.splice(i,1);
            break;
          }
        }
        //从companyGroup的leader里删除此人
        for(var i =0; i<companyGroup.leader.length; i++){
          if(companyGroup.leader[i]._id.toString() === uid){
            companyGroup.leader.splice(i,1);
            break;
          }
        }
        companyGroup.save(function (err) {
          if(err){
            return res.send(err);
          } 
          else{
            User.findOne({_id: uid},
              function (err, user){
                if(user){
                  //从user的group的team中删除此小组
                  for(var j=0;j<user.group.length;j++){
                    for(var k=0; k<user.group[j].team.length;k++){
                      if(user.group[j].team[k].id.toString() === tid){
                        user.group[j].team.splice(k,1);
                        break;
                      }
                    }
                  }
                  user.save(function (err) {
                    if(err){
                      return res.send(err);
                    }
                    else
                      return res.send({result:1, msg: '退出小组成功！'});
                  });
                }
                else
                  return res.send({result: 0, msg:'查无此人'});
            });
          }
        });
      }
      else
        return res.send({result: 0, msg:'无此小组'});
    });
};

//获取账户信息
exports.getAccount = function (req, res) {
  if(req.session.role !=='HR'&& req.session.role!=='OWNER'&&req.session.role!=='PARTNER' ){
    return res.send(403, 'forbidden!');
  }
  User.findOne({
          _id : req.session.nowuid
      },{'_id':0,'hashed_password':0,'salt':0}, function(err, user) {
          if(err) {
              console.log(err);
              res.send({'result':0,'msg':'数据错误'});
          }
          else {
              if (user) {
                  res.send({'result':1,'msg':'用户查找成功','data': user});
              } else {
                  res.send({'result':0,'msg':'不存在该用户'});
              }
          }
  });
};

//保存用户信息
exports.saveAccount = function (req, res) {
  if(req.session.role !=='HR'&& req.session.role!=='OWNER'){
    return res.send(403, 'forbidden!');
  }
  User.findOneAndUpdate({
    _id : req.session.nowuid
  }, req.body.user,{new:false},function(err, user) {
    if(err) {
        console.log(err);
        res.send({'result':0,'msg':'数据错误'});
    }
    else {
      if (user) {
        console.log(req.body.user.nickname , user.nickname);
        if(req.body.user.nickname !== user.nickname){
          schedule.updateUname(user._id);
        }
        res.send({'result':1,'msg':'修改成功'});
      } else {
        res.send({'result':0,'msg':'不存在该用户'});
      }
    }
  });
};

//修改密码
exports.changePassword = function (req, res) {
  if(req.session.role !=='HR'&& req.session.role!=='OWNER'){
    return res.send(403, 'forbidden!');
  }
  User.findOne({
      _id : req.session.nowuid

    },function(err, user) {
      if(err) {
        console.log(err);
        res.send({'result':0,'msg':'数据错误'});
      }
      else {
        if (user) {
          if(user.authenticate(req.body.nowpassword)==true){
            user.password = req.body.newpassword;
            user.save(function(err){
              if(err){
                console.log(err);
                res.send({'result':0,'msg':'密码修改失败'});
              }
              else {
                res.send({'result':1,'msg':'密码修改成功'});
              }
              return;
            });
          }
          else{
            res.send({'result':0,'msg':'密码不正确，请重新输入'});
          }
        }
        else {
          res.send({'result':0,'msg':'您没有登录'});
        }
      }
  });
};



exports.editPhoto = function(req, res) {
  if(req.role ==='PARTNER'){
    return res.send(403, 'forbidden!');
  }
  res.render('users/editPhoto', {
    photo: req.user.photo,
    uid: req.user._id,
    role: req.session.role,
    nav_name : req.user.nickname,
    nav_logo : req.user.photo
  });
};




exports.user = function(req, res, next, id) {
    User
        .findOne({
             _id: id
        })
        .exec(function(err, user) {
            if (err) return next(err);
            if (!user) return next(new Error('Failed to load User ' + id));
            req.profile = user;
            next();
        });
};


exports.getGroups = function(req, res) {
  CompanyGroup
  .find({ cid: req.user.cid })
  .exec()
  .then(function(company_groups) {
    var joined_groups = [];
    var unjoin_groups = [];

    company_groups.forEach(function(company_group) {
      for (var i = 0; i < company_group.member.length; i++) {
        if (req.user._id.toString() === company_group.member[i]._id.toString()) {
          joined_groups.push(company_group);
          return;
        }
      }
      unjoin_groups.push(company_group);
    });

    res.send({
      result: 1,
      msg: '获取小组列表成功',
      joined_groups: joined_groups,
      unjoin_groups: unjoin_groups
    });

  })
  .then(null, function(err) {
    console.log(err);
    res.send('获取小组列表失败');
  });


};










// for app

exports.getCampaignsForApp = function(req, res) {

  var user = req.user;

  Campaign
  .where('cid').all(user.cid)
  .populate('team')
  .exec()
  .then(function(campaigns) {
    model_helper.sendCampaignsForApp(user, campaigns, res);
  })
  .then(null, function(err) {
    console.log(err);
    res.send({ result: 0, msg: '获取活动列表失败' });
  });


};



// 获取用户日程

exports.getSchedules = function(req, res) {
  Campaign
  .find({ 'member.uid': req.user._id })
  .sort('-start_time')
  .exec()
  .then(function(campaigns) {
    if (campaigns) {
      var responseData = [];
      campaigns.forEach(function(campaign) {
        var tempObj = {
          _id: campaign._id,
          content: campaign.content,
          start_time: campaign.start_time,
          end_time: campaign.end_time,
          location: campaign.location
        }
        responseData.push(tempObj);
      });
    }
    res.send({ result: 1, msg: '获取日程列表成功', data: responseData });
  })
  .then(null, function(err) {
    console.log(err);
    res.send({ result: 0, msg: '获取日程列表失败' });
  });
};

exports.getUserInfo = function(req, res) {
  User
  .findOne({ _id: req.body._id })
  .populate('cid')
  .exec()
  .then(function(user) {
    if (user) {
      res.send({
        result: 1,
        msg: '获取用户信息成功',
        user: {
          photo: user.photo,
          email: user.email,
          nickname: user.nickname,
          realname: user.realname,
          company: user.cid.info.name
        }
      });
    } else {
      throw 'not found';
    }
  })
  .then(null, function(err) {
    console.log(err);
    res.send({ result: 0, msg: '获取用户信息失败' });
  });


};



exports.getTimelineForApp = function(req,res){
  Campaign
  .find({ 'member.uid': req.session.nowuid })
  .where('end_time').lt(new Date())
  .sort('-start_time')
  .populate('team')
  .exec()
  .then(function(campaigns) {
    if (campaigns && campaigns.length >= 0) {
      var time_lines = [];
      campaigns.forEach(function(campaign) {
        var _head, _type;
        if(campaign.provoke.active){
          _head = campaign.team[0].name + '对' + campaign.team[1].name + '的比赛';
          _type = 'provoke';
        }
        else if(campaign.gid[0] === '0'){
          _head = '公司活动';
          _type = 'company_campaign';
        }
        else {
          _head = campaign.team[0].name + '活动';
          _type = 'group_campaign';
        }
        var temp_obj = {
          _id: campaign._id,
          head: _head,
          content: campaign.content,
          location: campaign.location,
          group_type: campaign.group_type,
          start_time: campaign.start_time,
          provoke: campaign.provoke,
          type: _type
        };
        time_lines.push(temp_obj);
      });
      res.send({ result: 1, msg: '获取用户活动足迹成功', time_lines: time_lines });
    }
    else{
      throw '没有找到活动';
    }
  })
  .then(null, function(err) {
    console.log(err);
    res.send({ result: 0, msg: '获取用户活动足迹失败' });
  });
}




