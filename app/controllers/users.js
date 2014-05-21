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
  moment = require('moment'),
  config = require('../config/config'),
  meanConfig = require('../../config/config'),
  message = require('../language/zh-cn/message');



function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property].toString() === searchTerm.toString()) return i;
    }
    return -1;
}



/**
 * Show login form
 */
exports.signin = function(req, res) {
  if(req.user) {
    res.redirect('/users/home');
  } else {
    console.log('no');
    res.render('users/signin', {
      title: 'Signin'
    });
  }
};

/**
 * Logout
 */
exports.signout = function(req, res) {
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
    nickname: req.user.nickname
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
  }
  else{
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
      req.session.key = key;
      req.session.key_id = cid;
      res.render('users/invite', {
        title: 'validate'
      });
    }
  }
};

/**
 * 处理激活验证
 */
exports.dealActive = function(req, res) {
  var key = req.session.key;
  var cid = req.session.key_id;

  User.findOne({ username: req.body.host + '@' + req.body.domain }, function(err, user) {
    if(err) {
      console.log(err);
    } else if(user) {
      if(user.active === false) {
        res.render('users/message', message.registered);
      } else {
        res.render('users/message', message.actived);
      }
    } else {
      if(encrypt.encrypt(cid, config.SECRET) === key) {
        Company.findOne({'_id': cid}).exec(function(err, company){
          if (company != null) {
            for(var i = 0; i < company.email.domain.length; i++) {
              if(req.body.domain === company.email.domain[i]) {
                var user = new User();
                user.email = req.body.host + '@' + req.body.domain;
                user.username = user.email;
                user.cid = company._id;
                user.cname = company.info.name;
                user.save(function(err) {
                  if (err) {
                    console.log(err);
                    res.render('users/message', message.dbError);
                  }
                });
                //系统再给员工发一封激活邮件
                mail.sendStaffActiveMail(user.email, user._id.toString(), company._id.toString(), req.headers.host);
                res.render('users/message', message.wait);
                return;
              }
            }
            company.info.membernumber = company.info.membernumber + 1;
            company.save(function(err){
              ;
            });
            res.render('users/message', message.emailError);
          } else {
            console.log('bbbb');
            res.render('users/message', message.invalid);
          }
        });
      } else {
        console.log('aaaa');
        res.render('users/message', message.invalid);
      }
    }

  });
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
                    'uid':user._id,
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
  res.render('users/message', {title: '激活成功', message: '激活成功'});
};


//列出该user加入的所有小组的动态
exports.getGroupMessages = function(req, res) {
  if(req.session.role!=='OWNER'){
    return res.send(403,'forbidden');
  }
  var group_messages = [];
  var i = 0;
  async.whilst(
    function() { return i < req.user.group.length; },

    function(callback) {
      var team_ids = [];
      for(var k = 0; k < req.user.group[i].team.length; k ++){
        team_ids.push(req.user.group[i].team[k].id);
      }
      console.log(team_ids);
      GroupMessage.find({'team' :{'$in':team_ids}})
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
              var my_team_id;
              var find = true;
              var host = false;


              //如果是比赛动态
              if(group_message[j].provoke.active) {
                for(var k = 0; k < group_message[j].team.length && find; k ++) {
                  for(var l = 0; l < req.user.group[i].team.length; l ++) {
                    if(group_message[j].team[k].toString() === req.user.group[i].team[l].id.toString()) {
                      my_team_id = req.user.group[i].team[l].id;
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
                  if(group_message[j].team[0].toString() === team_ids[l].toString()) {
                    my_team_id = team_ids[l];
                    break;
                  }
                }
              }

              group_messages.push({
                'positive' : positive,
                'negative' : negative,
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
                'provoke_accept': false
              });
            }
          }
        }
        i++;
        callback();
      });
    },

    function(err) {
      if (err) {
        console.log(err);
        res.send([]);
      } else {
        res.send({'group_messages':group_messages,'role':req.session.role});
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

//列出该user加入的所有小组的活动
//这是在员工日程里的,不用判断权限,因为关闭活动等操作
//必须让队长进入小队页面去完成,不能在个人页面进行
exports.getCampaigns = function(req, res) {

  var campaigns = [];
  var join = false;
  var i = 0;
  async.whilst(
    function() { return i < req.user.group.length; },

    function(callback) {
      var team_ids = [];
      for(var k = 0; k < req.user.group[i].team.length; k ++){
        team_ids.push(req.user.group[i].team[k].id);
      }
      Campaign.find({'team' : {'$in':team_ids}})
      .exec(function(err, campaign) {
        if(campaign.length > 0) {
          if (err) {
            callback(err);
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
                'selected': true,
                'active':campaign[j].active,
                'id': campaign[j]._id.toString(),
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
                'provoke':campaign[j].provoke
              });
            }
          }
        }
        i++;
        callback();
      });
    },

    function(err) {
      if (err) {
        console.log(err);
        res.send([]);
      } else {
        res.send({
          'data':campaigns,
          'role':req.session.role
        });
      }
    }
  );
};


exports.home = function(req, res) {
  var _user = {};
  if(req.session.role ==='OWNER'){
    _user = req.user;
  }
  else{
    _user = req.profile;
  }
  var selected_teams = [];
  var unselected_teams = [];
  var user_teams = [];
  for(var i = 0; i < req.user.group.length; i ++) {
    for(var j = 0; j < req.user.group[i].team.length; j ++) {
      user_teams.push(req.user.group[i].team[j].id);
    }
  }
  CompanyGroup.find({'cid':req.user.cid}, {'_id':1,'gid':1,'group_type':1,'logo':1,'name':1},function(err, company_groups) {
    if(err || !company_groups) {
      return res.send([]);
    } else {
      var _cg_length= company_groups.length;
      for(var i = 0; i < _cg_length; i ++) {
        //下面查找的是该成员加入和未加入的所有小队
        if(company_groups[i].gid !=='0'){
          if(user_teams.indexOf(company_groups[i]._id.toString())) {
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
        'role':req.session.role
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
  var provoke_message_id = req.body.provoke_message_id;

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
              return res.send({
                'msg':'已经投过票!'
              });
            }
          }

          for(var i = 0; i < competition.camp[j].vote.negative_member.length; i ++) {
            if(competition.camp[j].vote.negative_member[i].uid.toString() === uid.toString()) {
              console.log('negative');
              return res.send({
                'msg':'已经投过票!'
              });
            }
          }


          if (aOr) {
            competition.camp[j].vote.positive ++;
            competition.camp[j].vote.positive_member.push({'cid':cid,'uid':uid});
          } else {
            competition.camp[j].vote.negative ++;
            competition.camp[j].vote.negative_member.push({'cid':cid,'uid':uid});
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
                    group_message.provoke.camp[i].vote.positive ++;
                    positive = group_message.provoke.camp[i].vote.positive;
                  } else {
                    group_message.provoke.camp[i].vote.negative ++;
                    negative = group_message.provoke.camp[i].vote.negative;
                  }
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

  console.log(cid,uid,campaign_id);

  var tid = req.session.nowtid;              //该活动所属小队的id
  Campaign.findOne({
    _id : campaign_id
  },
  function (err, campaign) {
    if (campaign) {
        campaign.member.push({
          'cid':cid,
          'uid':uid,
          'username':req.user.username
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
                      if(competition.camp[i].id.toString() == tid.toString()) {
                        competition.camp[i].member.push({
                           camp: i == 0 ? 'A' : 'B',
                           cid: cid,
                           uid: uid,
                           photo: req.user.photo,                 //队员头像路径
                           username: req.user.username,
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
                    return res.send({ result: 0, msg: '没有此活动'});
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
  Campaign
  .find({ 'end_time':{'$lt':new Date()},'member.uid': req.session.nowuid})
  .sort('-start_time')
  .populate('team')
  .exec()
  .then(function(campaigns) {
    if (campaigns && campaigns.length>0) {
      var timeLines = [];
      campaigns.forEach(function(campaign) {
        var _head,_type;
        if(campaign.provoke.active){
          _head = campaign.provoke.team[0].name +'对' + campaign.provoke.team[1].name +'的比赛';
          _type = 'provoke';
        }
        else if(campaign.gid[0]==='0'){
          _head = '公司活动';
          _type = 'company_campaign';
        }
        else{
          _head = campaign.team[0].name + '活动';
          _type = 'group_campaign';
        }
        var tempObj = {
          id: campaign._id,
          head: _head,
          content: campaign.content,
          location: campaign.location,
          group_type: campaign.group_type,
          date: campaign.start_time,
          provoke:campaign.provoke,
          type:_type
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
}











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
      }, req.body.user,null,function(err, user) {
          if(err) {
              console.log(err);
              res.send({'result':0,'msg':'数据错误'});
          }
          else {
              if (user) {
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

exports.savePhoto = function(req, res) {
  if(req.role ==='PARTNER'){
    return res.send(403, 'forbidden!');
  }
  var user = req.user;

  var photo_temp_path = req.files.photo.path;

  // 存入数据库的文件名，以当前时间的加密值命名

  var shasum = crypto.createHash('sha1');
  shasum.update( Date.now().toString() + Math.random().toString() );
  var photo = shasum.digest('hex') + '.png';


  // 文件系统路径，供fs使用
  var target_dir = path.join(meanConfig.root, '/public/img/user/photo/');

  // uri路径，存入数据库的路径，供前端访问
  var uri_dir = '/img/user/photo/';

  try {
    gm(photo_temp_path).size(function(err, value) {
      if (err) console.log(err);

      // req.body参数均为百分比
      var w = req.body.width * value.width;
      var h = req.body.height * value.height;
      var x = req.body.x * value.width;
      var y = req.body.y * value.height;

      // 在保存新路径前，将原路径取出，以便删除旧文件
      var ori_photo = user.photo;


      try {
        gm(photo_temp_path)
        .crop(w, h, x, y)
        .resize(150, 150)
        .write(path.join(target_dir, photo), function(err) {
          if (err) {
            console.log(err);
            res.redirect('/users/editPhoto');
          }
          else {
            user.photo = path.join(uri_dir, photo);
            user.save(function(err) {
              if (err) {
                console.log(err);
                res.redirect('/users/editPhoto');
              } else {
                CompanyGroup.find({'cid':req.user.cid},function (err,company_groups){
                  if(err || !company_groups) {
                    console.log(err,!company_groups);
                  } else {
                    for(var i = 0; i < company_groups.length; i ++) {
                      for(var j = 0; j < company_groups[i].member.length; j ++) {
                        if(company_groups[i].member[j]._id.toString() == req.user._id.toString()) {
                          console.log('find you!');
                          company_groups[i].member[j].photo = user.photo;
                          company_groups[i].save(function (err){
                            if(err) {
                              console.log(err);
                            }
                          });
                        }
                      }

                      for(var j = 0; j < company_groups[i].leader.length; j ++) {
                        if(company_groups[i].leader[j]._id.toString() == req.user._id.toString()) {
                          console.log('find you!');
                          company_groups[i].leader[j].photo = user.photo;
                          company_groups[i].save(function (err){
                            if(err) {
                              console.log(err);
                            }
                          });
                        }
                      }

                    }
                  }
                });
              }
            });

            fs.unlink(photo_temp_path, function(err) {
              if (err) {
                console(err);
                res.redirect('/users/editPhoto');
              }
              var unlink_dir = path.join(meanConfig.root, 'public');
              if (ori_photo !== '/img/icons/default_user_photo.png') {
                if (fs.existsSync(unlink_dir + ori_photo)) {
                  fs.unlinkSync(unlink_dir + ori_photo);
                }
              }
              res.redirect('/users/editPhoto');
            });
          }
        });
      } catch (e) {
        console.log(e);
      }

    });
  } catch (e) {
    console.log(e);
  }


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


exports.getPhoto = function(req, res) {
  var uid = req.params.id;
  var width = req.params.width;
  var height = req.params.height;
  if (validator.isNumeric(width + height)) {
    async.waterfall([
      function(callback) {
        User.findOne({ _id: uid })
        .exec(function(err, user) {
          if (err) callback(err);
          else callback(null, user.photo);
        });
      },
      function(photo, callback) {
        res.set('Content-Type', 'image/png');
        gm(meanConfig.root + '/public' + photo)
        .resize(width, height, '!')
        .stream(function(err, stdout, stderr) {
          if (err) callback(err);
          else {
            stdout.pipe(res);
            callback(null);
          }
        });
      }
    ], function(err, result) {
      if (err) res.send({ result: 0, msg: '获取用户头像失败' });
    });

  } else {
    res.send({ result: 0, msg: '请求错误' });
  }
}

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













// for app

exports.getCampaignsForApp = function(req, res) {

  var user = req.user;

  Campaign
  .where('cid').all(user.cid)
  .populate('team')
  .exec()
  .then(function(campaigns) {

    var response_data = [];

    campaigns.forEach(function(campaign) {


      var is_join = false;
      for (var i = 0; i < campaign.member.length; i++) {
        if (user._id.toString() === campaign.member[i].uid.toString()) {
          is_join = true;
        }
      }

      var group_index = arrayObjectIndexOf(user.group, campaign.gid, '_id');
      if (group_index > -1) {
        for (var i = 0; i < campaign.team.length; i++) {
          var team_index = arrayObjectIndexOf(user.group[group_index].team, campaign.team[i]._id, 'id')
          if (team_index > -1) {
            var team_name = campaign.team[i].name;
            var team_id = campaign.team[i]._id;
          }
        }
      }

      response_data.push({
        _id: campaign._id,
        team_name: team_name,
        team_id: team_id,
        content: campaign.content,
        start_time: campaign.start_time,
        member_count: campaign.member.length,
        is_join: is_join
      });
    });

    res.send({ result: 1, msg: '获取活动列表成功', data: response_data });

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
          id: campaign.id,
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




