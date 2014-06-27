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
  Campaign = mongoose.model('Campaign');

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
//渲染修改资料页
exports.renderChangePassword = function(req,res){
  res.render('partials/change_passowrd');
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


var destroySession = function(req){
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
  if (req.session.Global.nav_name !=null || req.session.Global.nav_name != undefined) {
    delete req.session.Global.nav_name;
  }
  if (req.session.Global.nav_logo !=null || req.session.Global.nav_logo != undefined) {
    delete req.session.Global.nav_logo;
  }
  if (req.session.Global.role !=null || req.session.Global.role != undefined) {
    delete req.session.Global.role;
  }
}
/**
 * Logout
 */
exports.signout = function(req, res) {
  destroySession(req);
  req.logout();
  res.redirect('/');
};

/**
 * Session
 */
exports.loginSuccess = function(req, res) {
  req.session.Global.nav_name = req.user.nickname;
  req.session.Global.nav_logo = req.user.photo;
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
    req.session.Global.role = 'OWNER';
    req.session.nowuid = req.user._id;
  }
  else if(req.params.userId && req.user._id.toString() === req.profile.cid.toString()){
    req.session.role = 'HR';
    req.session.Global.role = 'HR';
    req.session.nowuid = req.params.userId;
  }
  else if(req.params.userId && req.profile.cid.toString() === req.user.cid.toString()){
    req.session.role = 'PARTNER';
    req.session.Global.role = 'PARTNER';
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
  destroySession(req);
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

  console.log(cid, config.SECRET);
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
  delete req.session.key;
  delete req.session.key_id;
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
    if(err || !user) {
      console.log(err);
      res.render('users/message', message.dbError);
    }
    else {
      if(user.active === false) {
        user.nickname = req.body.nickname;
        user.password = req.body.password;
        user.realname = req.body.realName;
        user.department = req.body.department;
        user.phone = req.body.phone;
        user.role = 'EMPLOYEE';
        user.save(function(err) {
          if(err) {
            console.log(err);
            return res.render('users/message', message.dbError);
          }
          else {
            var groupMessage = new GroupMessage();
            groupMessage.message_type = 7;
            groupMessage.company.cid = user.cid;
            groupMessage.company.name = user.cname;
            groupMessage.company={
              cid : user.cid,
              name : user.cname
            };
            groupMessage.user={
              user_id : user._id,
              name : user.nickname,
              logo : user.photo
            };
            groupMessage.save();
            req.session.username = user.username;
            res.redirect('/users/selectGroup');
          }
        });
      } else {
        res.render('users/message', message.actived);
      }
    }
  });

};

/**
 * 选择组件页面
 */
exports.selectGroup = function(req, res) {
  User.findOne({ username: req.session.username }, function(err, user) {
    if (err) {
      console.log(err);
      res.render('users/message', message.dbError);
    } else if(user) {
      if (user.active === true) {
        res.render('users/message', message.actived);
      } else {
        res.render('users/selectGroup', { title: '选择你的兴趣小队', group_head: '个人' });
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
    if (err) {
      return res.status(400).send('用户不存在!');
    }
    else if(user) {
      if(user.active === false) {
        user.team = req.body.selected;
        user.active = true;
        user.save(function(err){
          if(err){
            console.log(err);
            res.render('users/message', message.dbError);
          }
          var tids = [];
          var member = {
            '_id' : user._id,
            'nickname' : user.nickname,
            'photo' : user.photo
          }
          for( var i = 0; i < user.team.length && user.team[i].gid != '0'; i++){
            tids.push(user.team[i]._id);
            var groupMessage = new GroupMessage();
              groupMessage.message_type = 8;
              groupMessage.company={
                cid : user.cid,
                name : user.cname
              };
              groupMessage.team = {
                teamid : user.team[i]._id,
                name : user.team[i].name,
                logo : user.team[i].logo
              };
              groupMessage.user= {
                user_id : user._id,
                name : user.nickname,
                logo : user.photo
              };
              groupMessage.save();
          }
          CompanyGroup.update({'_id':{'$in':tids}},{'$push':{'member':member}},{'safe':false,'multi':true}).exec(function(err, company_group){
            if(err || !company_group){
              return res.send(err);
            }else{
              return res.redirect('/users/finishRegister');
            }
          });
        });
      } else {
        res.render('users/message', message.actived);
      }
    }
    else {
      res.render('users/message', message.unregister);
    }
  });
};

/**
 * 完成注册
 */
exports.finishRegister = function(req, res) {
  delete req.session.username;
  res.render('users/signin', {title: '激活成功,请登录!', message: '激活成功,请登录!'});
};

exports.renderCampaigns = function(req, res){
  res.render('partials/campaign_list',{
      'provider':'user',
      'role':req.session.role
  });
};




function fetchCampaign(req,res,team_ids,role) {
  var campaigns = [];
  var join = false;
  var logo ='';
  var link ='';
  Campaign.find({'team' : {'$in':team_ids}}).sort({'start_time':-1})
  .populate('team')
  .populate('cid')
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
        var judge = false;
        if(campaign[j].deadline && campaign[j].member_max){
            judge = (new Date() > campaign[j].deadline || (campaign[j].member.length >= campaign[j].member_max) && campaign[j].member_max > 0 );
        }
        if(campaign[j].team.length === 0){//公司活动
          logo = campaign[j].cid[0].logo;
          link = '/company/home';
        }
        else{
          if(campaign[j].team.length === 1){//小队活动
            logo = campaign[j].team[0].logo;
            link = '/group/home/'+campaign[j].team[0]._id;
          }
          else{                              //小队挑战
            if(team_ids.indexOf(campaign[j].team[0]._id)!== -1){ //是主办方
              logo = campaign[j].team[0].logo;
              link = '/group/home/'+campaign[j].team[0]._id;
            }
            else{                             //不是主办方
              logo = campaign[j].team[1].logo;
              link = '/group/home/'+campaign[j].team[1]._id;
            }
          }
        }

        campaigns.push({
          'over' : judge,
          'active':campaign[j].active, //截止时间到了活动就无效了//逻辑不对-M
          '_id': campaign[j]._id.toString(),
          'gid': campaign[j].gid,
          'group_type': campaign[j].group_type,
          'cname': campaign[j].cname,
          'content': campaign[j].content,
          'location': campaign[j].location,
          'member_length': campaign[j].member.length,
          'start_time': campaign[j].start_time,
          'end_time': campaign[j].end_time,
          'deadline':campaign[j].deadline,
          'join':join,
          'index':j,
          'theme':campaign[j].theme,
          'team':campaign[j].team,
          'logo':logo,
          'link':link
        });
      }
      return res.send({
        'data':campaigns,
        'role':role
      });
    }
  });
}

function fetchTeam(team) {
  var rst = [];
  for(var i = 0; i < team.length; i ++) {
    rst.push(team[i]._id);
  }
  return rst;
}
//列出该user加入的所有小队的活动
//这是在员工日程里的,不用判断权限,因为关闭活动等操作
//必须让队长进入小队页面去完成,不能在个人页面进行
exports.getCampaigns = function(req, res) {
  var team_ids = [];
  var team;

  if(req.session.otheruid != null) {
    User.findOne({'_id':req.session.otheruid},function (err,user){
      if(err || !user) {
        return res.send({
          'data':[],
          'role':req.session.role
        });
      } else {
        team = user.team;
        team_ids = fetchTeam(team);
        fetchCampaign(req,res,team_ids,req.session.role);
      }
    });
  } else {
    team = req.user.team;
    team_ids = fetchTeam(team);
    fetchCampaign(req,res,team_ids,req.session.role);
  }
};


function getUserSchedule(uid, isCalendar, callback) {
  var query = Campaign.find({ '$or': [{ 'member.uid': uid }, { 'camp.member.uid': uid }] });
  if (isCalendar === false) {
    query = query.populate('team').populate('cid');
  }

  query
  .exec()
  .then(function(campaigns) {
    callback(campaigns);
  })
  .then(null, function(err) {
    console.log(err);
    callback([]);
  });
}

exports.renderScheduleList = function(req, res) {
  res.render('partials/schedule_list');
};


exports.scheduleListData = function(req, res) {
  getUserSchedule(req.user._id.toString(), false, function(campaigns) {

    var campaignListData = [];
    var join = false;
    var logo ='';
    var link ='';

    if (!campaigns) {
      return res.send({
        'data':[],
        'role': req.session.role
      });
    } else {
      var length = campaigns.length;
      for(var j = 0; j < length; j ++) {
        join = false;
        for(var k = 0;k < campaigns[j].member.length; k ++) {
          if(req.user._id.toString() === campaigns[j].member[k].uid) {
            join = true;
            break;
          }
        }
        var judge = false;
        if(campaigns[j].deadline && campaigns[j].member_max){
            judge = !(new Date() <= campaigns[j].end_time || new Date() <= campaigns[j].deadline || campaigns[j].member.length >= campaigns[j].member_max);
        }

        if(campaigns[j].team.length === 0){//公司活动
          logo = campaigns[j].cid[0].logo;
          link = '/company/home';
        }
        else{
          if(campaigns[j].team.length === 1){//小队活动
            logo = campaigns[j].team[0].logo;
            link = '/group/home/'+campaigns[j].team[0]._id;
          }
          else{                              //小队挑战
            if(team_ids.indexOf(campaigns[j].team[0]._id)!== -1){ //是主办方
              logo = campaigns[j].team[0].logo;
              link = '/group/home/'+campaigns[j].team[0]._id;
            }
            else{                             //不是主办方
              logo = campaigns[j].team[1].logo;
              link = '/group/home/'+campaigns[j].team[1]._id;
            }
          }
        }
        campaignListData.push({
          'over' : judge,
          'selected': true,
          'active':campaigns[j].active, //截止时间到了活动就无效了
          '_id': campaigns[j]._id.toString(),
          'gid': campaigns[j].gid,
          'group_type': campaigns[j].group_type,
          'cid': campaigns[j].cid,
          'cname': campaigns[j].cname,
          'poster': campaigns[j].poster,
          'content': campaigns[j].content,
          'location': campaigns[j].location,
          'member_length': campaigns[j].member.length,
          'create_time': campaigns[j].create_time,
          'start_time': campaigns[j].start_time,
          'end_time': campaigns[j].end_time,
          'deadline':campaigns[j].deadline,
          'join':join,
          'provoke':campaigns[j].provoke,
          'index':j,
          'theme':campaigns[j].theme,
          'team':campaigns[j].team,
          'logo':logo,
          'link':link
        });
      }
      return res.send({
        'data': campaignListData,
        'role': req.session.role
      });
    }

  });
};

exports.scheduleCalendarData = function(req, res) {
  getUserSchedule(req.user._id.toString(), true, function(campaigns) {
    var calendarCampaigns = [];
    campaigns.forEach(function(campaign) {
      var company_group_id;
      for (var i = 0, teams = req.user.team; i < teams.length; i++) {
        if (campaign.team.indexOf(teams[i]._id) !== -1) {
          company_group_id = teams[i]._id;
        }
      }

      var count = 0;
      if (campaign.member) {
        count = campaign.member.length;
      }

      calendarCampaigns.push({
        'id': campaign._id,
        'company_group_id': company_group_id,
        'title': campaign.theme,
        'url': '/group/campaign/' + campaign._id.toString(),
        'class': 'event-info',
        'start': campaign.start_time.valueOf(),
        'end': campaign.end_time.valueOf(),
        'count': count
      });
    });
    res.send({
      'success': 1,
      'result': calendarCampaigns
    });
  });
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
  for(var i = 0; i < req.user.team.length; i ++) {
    user_teams.push(req.user.team[i]._id.toString());
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
        'nickname': _user.nickname,
        'cname':_user.cname,
        'sign':_user.introduce,
        'role': req.session.role
      });
    }
  });
};

exports.editInfo = function(req, res) {
  return res.render('users/editInfo',{
    'title': '个人资料'
  });
};


//员工投票是否参加约战
//记得要做重复投票检查 TODO
exports.vote = function (req, res) {

  var tid = req.body.tid;
  var cid = req.user.cid;
  var uid = req.user._id;
  var aOr = req.body.aOr;
  var value = 1;
  var competition_id = req.body.competition_id;

  Campaign.findOne({
    '_id' : competition_id
  },
  function (err, campaign) {
    if (campaign) {

      var camp_index = model_helper.arrayObjectIndexOf(campaign.camp,tid,'id');
      var positive_index = model_helper.arrayObjectIndexOf(campaign.camp[camp_index].vote.positive_member,uid,'uid');
      var negative_index = model_helper.arrayObjectIndexOf(campaign.camp[camp_index].vote.negative_member,uid,'uid');
      if(aOr && negative_index > -1 || !aOr && positive_index > -1){
        return res.send({result: 0, msg:'您已经投过票，无法再次投票'});
      }
      else if(aOr && positive_index > -1 || !aOr && negative_index > -1) {
        campaign.camp[camp_index].vote[aOr?'positive_member':'negative_member'].splice(aOr?positive_index:negative_index,1);
        campaign.camp[camp_index].vote[aOr?'positive':'negative'] = campaign.camp[camp_index].vote[aOr?'positive':'negative']-1;
      }
      else if(aOr && positive_index <0 || !aOr && negative_index <0){
        campaign.camp[camp_index].vote[aOr?'positive_member':'negative_member'].push({'cid':cid,'uid':uid});
        campaign.camp[camp_index].vote[aOr?'positive':'negative'] = campaign.camp[camp_index].vote[aOr?'positive':'negative']+1;
      }

      campaign.save(function (err) {
        if(err) {
          return res.send({result: 0, msg:'投票发生错误'});
        }
        else{
          return res.send({result: 1, msg:'成功',data:{
              quit: aOr && positive_index <0 || !aOr && negative_index <0,
              positive : campaign.camp[camp_index].vote.positive,
              negative : campaign.camp[camp_index].vote.negative
            }
          });
        }
      });
    } else {
      console.log('没有此约战!');
      return res.send({result: 0, msg:'没有此约战'});
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
    if (!err && campaign) {

      var camp_length = campaign.camp.length;
      //从campaign里删除该员工信息
      if(camp_length===0){
        var member_index = model_helper.arrayObjectIndexOf(campaign.member,uid,'uid');
        if(member_index<0){
          campaign.member.push({
            'cid':cid,
            'uid':uid,
            'nickname':req.user.nickname,
            'photo':req.user.photo
          });
        }
        else{
          return res.send({ result: 0, msg: '您已经参加该活动'});
        }
      }
      else{
        var camp_index = model_helper.arrayObjectIndexOf(req.user.team,campaign.camp[0].id,'_id') > -1 ? 0: 1;
        var member_index = model_helper.arrayObjectIndexOf(campaign.camp[camp_index].member,uid,'uid');
        if(member_index<0){
          campaign.camp[camp_index].member.push({
            'cid':cid,
            'uid':uid,
            'nickname':req.user.nickname,
            'photo':req.user.photo,
            'camp':camp_index===0?'A':'B'
          });
        }
        else {
          return res.send({ result: 0, msg: '您已经参加该活动'});
        }
      }
      campaign.save(function (err) {
        if(err) {
          return res.send({ result: 0, msg: '保存错误'});
        } else {
          return res.send({ result: 1, msg: '退出活动成功'});
        }
      });
    }
    else {
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
    if (!err && campaign) {
      var camp_length = campaign.camp.length;
      //从campaign里删除该员工信息
      if(camp_length===0){
        var member_index = model_helper.arrayObjectIndexOf(campaign.member,uid,'uid');
        if(member_index>-1){
          campaign.member.splice(member_index,1);
        }
        else{
          return res.send({ result: 0, msg: '您没有参加该活动'});
        }
      }
      else{
        var member_index;
        for(var i = 0; i<camp_length;i++){
          member_index = model_helper.arrayObjectIndexOf(campaign.camp[i].member,uid,'uid');
          if(member_index>-1){
            campaign.camp[i].member.splice(member_index,1);
            break;
          }
        }
        if(member_index<0){
          return res.send({ result: 0, msg: '您没有参加该活动'});
        }
      }
      campaign.save(function (err) {
        if(err) {
          return res.send(err);
        } else {
          return res.send({ result: 1, msg: '退出活动成功'});
        }
      });
    }
    else {
      return res.send({ result: 0, msg: '没有此活动'});
    }
  });
};
exports.timeLine = function(req,res){
  //如果是访问其它员工的timeline
  var uid = (req.session.otheruid != null ? req.session.otheruid : req.session.nowuid);
  console.log(uid);
  Campaign
  .find({ 'end_time':{'$lt':new Date()},'$or':[{'member.uid': uid},{'camp.member.uid':uid}]})
  .sort('-start_time')
  .populate('team').populate('cid')
  .exec()
  .then(function(campaigns) {
    if (campaigns && campaigns.length>0) {
      var timeLines = [];
      campaigns.forEach(function(campaign) {
        var _head,_logo;
        if(campaign.camp.length>0){
          _head = campaign.team[0].name +'对' + campaign.team[1].name +'的比赛';
          _logo = model_helper.arrayObjectIndexOf(campaign.camp[0].member,uid,'uid')>-1 ?campaign.camp[0].logo :campaign.camp[1].logo;
        }
        else if(campaign.team.length==0){
          _head = '公司活动';
          _logo = campaign.cid.info.logo;
        }
        else{
          _head = campaign.team[0].name + '活动';
          _logo = campaign.team[0].logo;
        }
        var tempObj = {
          id: campaign._id,
          //head: _head,
          head:campaign.theme,
          logo:_logo,
          content: campaign.content,
          location: campaign.location,
          group_type: campaign.group_type,
          start_time: campaign.start_time,
          provoke:campaign.camp.length>0,
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

//用户加入小队
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
            if(model_helper.arrayObjectIndexOf(companyGroup.member,uid,'_id')>-1){
              return res.send({result: 0, msg:'您已经加入该小队'});
            }
            companyGroup.member.push({
              '_id':user._id,
              'nickname':user.nickname,
              'photo':user.photo
            });
            user.team.push({
              '_id' : companyGroup._id,
              'gid': companyGroup.gid,
              'group_type': companyGroup.group_type,
              'entity_type': companyGroup.entity_type,
              'name':companyGroup.name,
              'logo':companyGroup.logo
            });
            //保存小队
            companyGroup.save(function (err){
              if(err){
                console.log(err);
                return res.send({result: 0, msg:'保存小队出错'});
              }
              else{
                //保存用户
                user.save(function (err){
                if(err){
                  console.log(err);
                  return res.send({result: 0, msg:'保存用户出错'});
                }else{
                  var groupMessage = new GroupMessage();
                  groupMessage.message_type = 8;
                  groupMessage.team = {
                    teamid : companyGroup._id,
                    name : companyGroup.name
                  };
                  groupMessage.user ={
                    user_id : user._id,
                    name : user.nickname,
                    logo : user.photo
                  };
                  groupMessage.save();
                  return res.send({result: 1, msg:'保存用户成功'});
                }

            });
              }
            });
          }
      });
    }
  });
};

//用户退出小队
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
        var member_index = model_helper.arrayObjectIndexOf(companyGroup.member,uid,'_id');
        if(member_index>-1){
          companyGroup.member.splice(member_index,1);
        }
        else{
          return res.send({result: 0, msg:'您没有参加该小队'});
        }
        var leader_index = model_helper.arrayObjectIndexOf(companyGroup.leader,uid,'_id');
        if(leader_index>-1){
          companyGroup.leader.splice(leader_index,1);
        }
        companyGroup.save(function (err) {
          if(err){
            return res.send(err);
          }
          else{
            User.findOne({_id: uid},
              function (err, user){
                if(user){
                  //从user的group的team中删除此小队
                  var team_index = model_helper.arrayObjectIndexOf(user.team,tid,'_id');
                  if(team_index>-1){
                    user.team.splice(team_index,1);
                  }
                  else{
                    return res.send({result: 0, msg:'您没有参加该小队'});
                  }
                  user.save(function (err) {
                    if(err){
                      return res.send(err);
                    }
                    else {
                      return res.send({result:1, msg: '退出小队成功！'});
                    }
                  });
                }
                else
                  return res.send({result: 0, msg:'查无此人'});
            });
          }
        });
      }
      else
        return res.send({result: 0, msg:'无此小队'});
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
          req.session.Global.nav_name = req.body.user.nickname;
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
    uid: req.user._id
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
      msg: '获取小队列表成功',
      joined_groups: joined_groups,
      unjoin_groups: unjoin_groups
    });

  })
  .then(null, function(err) {
    console.log(err);
    res.send('获取小队列表失败');
  });


};










// for app

exports.getCampaignsForApp = function(req, res) {

  var user = req.user;

  Campaign
  .where('cid').all(user.cid)
  .populate('team')
  .sort('-start_time')
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
  .find({ 'member.uid': req.user._id.toString() })
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




