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
  Department = mongoose.model('Department'),
  Campaign = mongoose.model('Campaign');

// 3rd
var validator = require('validator'),
  async = require('async'),
  gm = require('gm'),
  UUID= require('../middlewares/uuid');

// custom
var encrypt = require('../middlewares/encrypt'),
  department = require('../controllers/department'),
  mail = require('../services/mail'),
  schedule = require('../services/schedule'),
  moment = require('moment'),
  config = require('../config/config'),
  meanConfig = require('../../config/config'),
  message = require('../language/zh-cn/message'),
  model_helper = require('../helpers/model_helper'),
  photo_album_controller = require('./photoAlbum');







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
exports.autoLogin = function(req, res, next){
  User.findOne({_id:req.body.uid,app_token: req.body.app_token}, function(err, user) {
    if(err || !user) {
      console.log(err);
      return  res.send({ result: 0, msg: '登录失败'});
    } else {
      req.login(user, function(err) {
        if (err) {
         return next(err);
        }
        next();
      });
    }
  });

}

exports.appLoginSuccess = function(req, res) {
  var app_token = UUID.id();
  var data = {
    _id: req.user._id,
    nickname: req.user.nickname,
    role: req.user.role,
    app_token: app_token
  };
  req.user.app_token = app_token;
  req.user.save(function(err){
    if(!err){
      res.send({ result: 1, msg: '登录成功', data: data });
    }
  });
}

exports.appLogout = function(req, res) {
  req.logout();
  res.send({ result: 1, msg: '注销成功' });
}


/**
 * 通过邀请链接进入激活流程
 */
exports.invite = function(req, res) {
  if (req.user) {
    req.logout();
    res.locals.global_user = null;
  }
  var key = req.query.key;
  var cid = req.query.cid;
  req.session.cid = req.query.cid; //给注册页显示部门用
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
          title: '个人注册',
          domains: company.email.domain,
          cname: company.info.official_name
        });
      })
      .then(null, function(err) {
        console.log(err);
        res.render('users/message', {title: 'error', message: 'bad request'});
      });

    }
  }
};

function userOperate(cid, key, res, req, index) {
  if (encrypt.encrypt(cid, config.SECRET) === key) {
    Company
    .findOne({ _id: cid })
    .exec()
    .then(function(company) {
      if (!company) {
        throw 'Not found company';
      }
      var email = req.body.host + '@' + req.body.domain;
      User
      .findOne({ email: email})
      .exec()
      .then(function(user) {
        if(index ==1){//未注册过,新建用户并保存
          if (user) {
            return res.render('users/invite', {
              title: 'validate',
              domains: company.email.domain,
              message: '该邮箱已被注册'
            });
          }
          if (company.email.domain.indexOf(req.body.domain) > -1) {
            var user = new User({
              email: email,
              username: email,
              cid: company._id,
              cname: company.info.name,
              nickname:req.body.nickname,
              password:req.body.password,
              realname: req.body.realName,
              phone: req.body.phone,
              role: 'EMPLOYEE'
            });
            //员工尚未激活时,他的部门信息里只能填入部门的id
            if(req.body.main_department_id != ''){
              if(req.body.child_department_id != ''){
                if(req.body.grandchild_department_id != ''){
                  user.department = {'_id':req.body.grandchild_department_id,'name':null};
                }else{
                  user.department = {'_id':req.body.child_department_id,'name':null};
                }
              }else{
                user.department = {'_id':req.body.main_department_id,'name':null};
              }
            }
            user.save(function(err) {
              if (err) {
                console.log(err);
                return res.send(500,{'msg':'user save err.'});
              } else {
                company.info.membernumber = company.info.membernumber + 1;
                company.save(function(err){
                  if(err) {
                    console.log(err);
                  } else {
                    //系统再给员工发一封激活邮件
                    mail.sendStaffActiveMail(user.email, user._id.toString(), company._id.toString(), req.headers.host);
                    delete req.session.key;
                    delete req.session.key_id;
                    delete req.session.cid;
                    return res.render('users/message', message.wait);
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
        }
        else{//已注册过，重发邮件
          if (user) {
            if (company.email.domain.indexOf(req.body.domain) > -1){
              //覆盖用户信息并保存
              if(index===4){
                user.nickname = req.body.nickname;
                user.password = req.body.password;
                user.realname = req.body.realname;
                user.phone = req.body.phone;
                user.save(function(err){
                  if(err){
                    console.log(err);
                    return res.send(500,{'msg':'user save err.'});
                  }
                  else{
                    //将员工加入部门
                    var member = {
                      '_id':user._id,
                      'nickname':user.nickname,
                      'photo':user.photo,
                      'apply_status':'wait'
                    };
                    if(req.body.main_department_id != 'null'){
                      var callback = function(err, data) {
                        if (err) {
                          console.log(err);
                        }
                      }
                      //员工尚未激活时,他的部门信息里只能填入部门的id
                      if(req.body.main_department_id != ''){
                        if(req.body.child_department_id != ''){
                          if(req.body.grandchild_department_id != ''){
                            user.department = {'_id':req.body.grandchild_department_id,'name':null};
                          }else{
                            user.department = {'_id':req.body.child_department_id,'name':null};
                          }
                        }else{
                          user.department = {'_id':req.body.main_department_id,'name':null};
                        }
                      }
                    }
                  }
                });
              }
              //重发邮件
              mail.sendStaffActiveMail(email, user._id.toString(), company._id.toString(), req.headers.host);
              delete req.session.key;
              delete req.session.key_id;
              delete req.session.cid;
              return res.render('users/message', message.wait);
            }
            else {
              return res.render('users/invite', {
                title: 'validate',
                domains: company.email.domain,
                message: '请使用企业邮箱'
              });
            }
          }
          else {
            console.log(email);
            return res.render('users/message', message.invalid);
          }
        }
      })
      .then(null, function(err) {
        console.log(err);
        return res.render('users/message', message.invalid);
      });
    })
    .then(null, function(err) {
      console.log(err);
      return res.render('users/message', message.invalid);
    });

  } else {
    return res.render('users/message', message.invalid);
  }
};

/**
 * 处理激活验证
 */
exports.dealActive = function(req, res) {
  var key = req.session.key;
  var cid = req.session.key_id;
  var index = req.body.index;
  //index为1:未注册过,2:不重填资料重新发邮件,3:重填资料重新发邮件
  userOperate(cid, key, res, req, index);
};

/**
 * 验证用户邮箱是否重复
 */
exports.mailCheck = function(req, res) {
  var email = req.body.login_email;
  User.findOne({email:email},{active:1},function(err,user){
    if(err){
      console.log(err);
      return res.send(500,{'msg':'DatabaseError'});
    }
    else if(!user){//这个邮箱没用过
      return res.send({'active':1});
    }
    else if(user.mail_active === false){//这个邮箱激活了没验证
      return res.send({'active':2});
    }
    else //这个邮箱已激活、并注册完毕
      return res.send({'active':3});
  });
};


/**
 * 通过激活链接进入，完成激活
 */
exports.setProfile = function(req, res) {
  if (req.user) {
    req.logout();
    res.locals.global_user = null;
  }
  var key = req.query.key;
  var uid = req.query.uid;
  User.findOne({_id: uid}).populate('cid').exec(function(err, user) {
    if(err) {
      console.log(err);
      res.render('users/message', message.dbError);
    } else if(user) {
      if(user.active === true) {
        res.render('users/message', message.actived);
      } else {
        if(encrypt.encrypt(uid, config.SECRET) === key) {
          user.active= true;
          user.mail_active = true;
          //员工激活后,要把他的具体信息加入部门
          if(user.department != null && user.department != undefined){
            var callback = function(err, data) {
              if (err) {
                console.log(err);
              }
            }
            var member = {
              '_id':user._id,
              'nickname':user.nickname,
              'photo':user.photo,
              'apply_status':'pass'
            };
            department.memberOperateByHand('join',member,user.department._id,callback);
          }
          user.save(function(err){
            if(err){
              console.log(err);
              return res.send(500,{'msg':'user save err.'});
            }
            else{
              var groupMessage = new GroupMessage();
              groupMessage.message_type = 7;
              groupMessage.company={
                cid : user.cid._id,
                name : user.cname,
                logo : user.cid.info.logo
              };
              groupMessage.user={
                user_id : user._id,
                name : user.nickname,
                logo : user.photo
              };
              groupMessage.save();
              //req.session.username = user.username;
            }
          });
          res.render('users/setProfile', {
            title: '激活成功',
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
//***此处已不再需要
// /**
//  * 处理个人信息表单
//  */
// exports.dealSetProfile = function(req, res) {
//   User.findOne(
//     {_id : req.query.uid}
//   , function(err, user) {
//     if(err || !user) {
//       console.log(err);
//       res.render('users/message', message.dbError);
//     }
//     else {
//       if(user.active === false) {
//         user.nickname = req.body.nickname;
//         user.password = req.body.password;
//         user.realname = req.body.realName;
//         user.phone = req.body.phone;
//         user.role = 'EMPLOYEE';
//         user.active = true;
//         user.save(function(err) {
//           if(err) {
//             console.log(err);
//             return res.render('users/message', message.dbError);
//           }
//           else {
//             //将员工加入部门
//             var member = {
//               '_id':user._id,
//               'nickname':user.nickname,
//               'photo':user.photo,
//               'apply_status':'wait'
//             };
//             if(req.body.main_department_id != 'null'){
//               var callback = function(err, data) {
//                 if (err) {
//                   console.log(err);
//                 }
//               }
//               if(req.body.child_department_id != 'null'){
//                 department.memberOperateByHand('join',member,req.body.child_department_id,callback);
//               }else{
//                 department.memberOperateByHand('join',member,req.body.main_department_id,callback);
//               }
//             }
//             var groupMessage = new GroupMessage();
//             groupMessage.message_type = 7;
//             groupMessage.company.cid = user.cid;
//             groupMessage.company.name = user.cname;
//             groupMessage.company={
//               cid : user.cid,
//               name : user.cname
//             };
//             groupMessage.user={
//               user_id : user._id,
//               name : user.nickname,
//               logo : user.photo
//             };
//             groupMessage.save();
//             req.session.username = user.username;
//             res.redirect('/users/finishRegister');
//           }
//         });
//       } else {
//         res.render('users/message', message.actived);
//       }
//     }
//   });

// };

// /**
//  * 选择组件页面
//  */
// exports.selectGroup = function(req, res) {
//   User.findOne({ username: req.session.username }, function(err, user) {
//     if (err) {
//       console.log(err);
//       res.render('users/message', message.dbError);
//     } else if(user) {
//       if (user.active === true) {
//         res.render('users/message', message.actived);
//       } else {
//         res.render('users/selectGroup', { title: '选择你的兴趣小队', group_head: '个人',cid:user.cid });
//       }
//     } else {
//       res.render('users/message', message.unregister);
//     }
//   });
// }

// /**
//  * 处理选择组件表单
//  */
// exports.dealSelectGroup = function(req, res) {
//   if(req.body.selected == undefined) {
//     return res.redirect('/users/selectGroup');
//   } else {
//     ;
//   }
//   User.findOne({'username': req.session.username}, function(err, user) {
//     if (err) {
//       return res.status(400).send('用户不存在!');
//     }
//     else if(user) {
//       if(user.active === false) {
//         user.team = req.body.selected;
//         user.active = true;
//         user.save(function(err){
//           if(err){
//             console.log(err);
//             res.render('users/message', message.dbError);
//           }
//           var tids = [];
//           var member = {
//             '_id' : user._id,
//             'nickname' : user.nickname,
//             'photo' : user.photo
//           }
//           for( var i = 0; i < user.team.length && user.team[i].gid != '0'; i++){
//             tids.push(user.team[i]._id);
//             var groupMessage = new GroupMessage();
//               groupMessage.message_type = 8;
//               groupMessage.company={
//                 cid : user.cid,
//                 name : user.cname
//               };
//               groupMessage.team = {
//                 teamid : user.team[i]._id,
//                 name : user.team[i].name,
//                 logo : user.team[i].logo
//               };
//               groupMessage.user= {
//                 user_id : user._id,
//                 name : user.nickname,
//                 logo : user.photo
//               };
//               groupMessage.save();
//           }
//           CompanyGroup.update({'_id':{'$in':tids}},{'$push':{'member':member}},{'safe':false,'multi':true}).exec(function(err, company_group){
//             if(err || !company_group){
//               return res.send(err);
//             }else{
//               return res.redirect('/users/finishRegister');
//             }
//           });
//         });
//       } else {
//         res.render('users/message', message.actived);
//       }
//     }
//     else {
//       res.render('users/message', message.unregister);
//     }
//   });
// };

// /**
//  * 完成注册
//  */
// exports.finishRegister = function(req, res) {
//   delete req.session.username;
//   res.render('users/signin', {title: '激活成功,请登录!', message: '激活成功,请登录!'});
// };

exports.renderCampaigns = function(req, res){
  res.render('partials/campaign_list',{
      'provider':'user',
      'role':req.role
  });
};




function fetchCampaign(req,res,team_ids,role) {
  var campaigns = [];
  var join = false;
  var logo ='';
  var link ='';
  var name;
  var option = {
    'active':true,
    'finish':false,
    '$or':[{'team':{'$in':team_ids}},{'cid':req.user.cid,'team':{'$size':0}}]
  }
  Campaign.find(option).sort({'start_time':-1})
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
          logo = campaign[j].cid[0].info.logo;
          link = '/company/home';
          name = campaign[j].cid[0].info.official_name;
        }
        else{
          if(campaign[j].team.length === 1){//小队活动
            logo = campaign[j].team[0].logo;
            link = '/group/page/'+campaign[j].team[0]._id;
            name = campaign[j].team[0].name;
          }
          else{                              //小队挑战
            if(team_ids.indexOf(campaign[j].team[0]._id)!== -1){ //是主办方
              logo = campaign[j].team[0].logo;
              link = '/group/page/'+campaign[j].team[0]._id;
              name = campaign[j].team[0].name;
            }
            else{                             //不是主办方
              logo = campaign[j].team[1].logo;
              link = '/group/page/'+campaign[j].team[1]._id;
              name = campaign[j].team[1].name;
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
          'name':name,
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

  if(req.role!=='OWNER') {
    User.findOne({'_id':req.session.otheruid},function (err,user){
      if(err || !user) {
        return res.send({
          'data':[],
          'role':req.role
        });
      } else {
        team = user.team;
        team_ids = fetchTeam(team);
        fetchCampaign(req,res,team_ids,req.role);
      }
    });
  } else {
    team = req.user.team;
    team_ids = fetchTeam(team);
    fetchCampaign(req,res,team_ids,req.role);
  }
};



exports.renderScheduleList = function(req, res) {
  res.render('partials/schedule_list',{'role':req.role});
};



exports.home = function(req, res) {
  var _user = {};
  var _nickname,_logo;
  if(req.role ==='OWNER'){
    _user = req.user;
  }
  else{
    _user = req.profile;
  }
  var leader_teams = [];
  var selected_teams = [];
  var unselected_teams = [];
  var user_teams = [];
  for(var i = 0; i < req.user.team.length; i ++) {
    user_teams.push(req.user.team[i]._id.toString());
  }
  CompanyGroup.find({'cid':req.user.cid}, {'_id':1,'gid':1,'logo':1,'name':1,'active':1,'leader':1},function(err, company_groups) {
    if(err || !company_groups) {
      return res.send([]);
    } else {
      var _cg_length= company_groups.length;
      for(var i = 0; i < _cg_length; i ++) {
        if(company_groups[i].gid !== '0' && company_groups[i].active === true){
          //下面查找的是该成员加入和未加入的所有active小队
          if(user_teams.indexOf(company_groups[i]._id.toString()) > -1) {
            //判断此人是否是此队队长，并作标记
            company_groups[i].isLeader = false;
            if(req.user.role === 'LEADER'){
              if(company_groups[i].leader.length){
                for(var j=0;j<company_groups[i].leader.length;j++){
                  if(company_groups[i].leader[j]._id.toString()===req.user._id.toString()){
                    company_groups[i].isLeader = true;
                    leader_teams.push(company_groups[i]);
                    break;
                  }
                }
              }
            }
            if(!company_groups[i].isLeader)
              selected_teams.push(company_groups[i]);
          }
          else {
            unselected_teams.push(company_groups[i]);
          }
        }
      }
    }
    var department = _user.department;
    if (!_user.department || !_user.department._id) {
      department = null;
    }
    res.render('users/home',{
      'title': req.role ==='OWNER'? '我的Donler主页': _user.nickname+'的Donler主页',
      'uid':_user._id,
      'leader_teams': leader_teams,
      'selected_teams' : selected_teams,
      'unselected_teams' : unselected_teams,
      'photo': _user.photo,
      'realname':_user.realname,
      'nickname': _user.nickname,
      'cname':_user.cname,
      'sign':_user.introduce,
      'role': req.role,
      'department': department
    });
  });
};

exports.editInfo = function(req, res) {
  return res.render('users/editInfo',{
    'title': '个人资料',
    'role':req.role
  });
};





exports.timeLine = function(req,res){
  //如果是访问其它员工的timeline
  var uid = req.params.userId;
  Campaign
  .find({ 'active':true,'finish':true,'$or':[{'member.uid': uid},{'camp.member.uid':uid}]})
  .sort('-start_time')
  .populate('team').populate('cid').populate('photo_album')
  .exec()
  .then(function(campaigns) {
      // todo new time style
      var newTimeLines = [];
      // todo new time style
      campaigns.forEach(function(campaign) {
        var _head,_logo;
        // todo new time style
        // console.log(campaign);
        if(campaign.camp.length>0){
          _head = campaign.team[0].name +'对' + campaign.team[1].name +'的比赛';
          _logo = model_helper.arrayObjectIndexOf(campaign.camp[0].member,uid,'uid')>-1 ?campaign.camp[0].logo :campaign.camp[1].logo;
        }
        else if(campaign.team.length==0){
          _head = '公司活动';
          _logo = campaign.cid[0].info.logo;
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
          year: getYear(campaign),

          // photo_list[i].thumbnail_uri是缩略图，200*200，photo_list[i].uri是原图
          photo_list: photo_album_controller.photoThumbnailList(campaign.photo_album, 4)
        }
        // todo new time style
        // console.log(campaign);
        function getYear(dates) {
          var response = String(dates.end_time);
          var _ = response.split(" ");
          var year = _[3]
          return year;
        }
        // console.log(getYear(campaign));
        var groupYear = getYear(campaign);
        if (newTimeLines.length==0||newTimeLines[newTimeLines.length-1][0].year!=groupYear) {
          newTimeLines.push([]);
          newTimeLines[newTimeLines.length-1].push(tempObj);
        }else{
          var i = newTimeLines.length-1;
          newTimeLines[i].push(tempObj);
        }
      });
      //console.log(newTimeLines);
      return res.render('partials/timeLine',{'newTimeLines': newTimeLines,'length':campaigns.length,'moment': moment});
  })
  .then(null, function(err) {
    console.log(err);
    return res.send({result:0,msg:'查询错误'});
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

            var provoke = companyGroup.score.provoke;
            var campaign = companyGroup.score.campaign;
            var member = companyGroup.score.member;
            var participator = companyGroup.score.participator;
            var comment = companyGroup.score.comment;
            var album = companyGroup.score.album;

            provoke = (provoke == undefined || provoke == null) ? 0 : provoke;
            campaign = (campaign == undefined || campaign == null) ? 0 : campaign;
            member = (member == undefined || member == null) ? 0 : member + 10;
            participator = (participator == undefined || participator == null) ? 0 : participator;
            comment = (comment == undefined || comment == null) ? 0 : comment;
            album = (album == undefined || album == null) ? 0 : album;

            companyGroup.score = {
              'provoke':provoke,
              'campaign':campaign,
              'member':member,
              'participator':participator,
              'comment':comment,
              'album':album
            }

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
                  GroupMessage.findOne({'message_type':8,'user.user_id':uid,'team.teamid':tid},function(err,groupMessage){
                    if(!err&&groupMessage){
                      groupMessage.create_time = new Date();
                      groupMessage.save();
                    }
                    else{
                      var groupMessage = new GroupMessage();
                      groupMessage.message_type = 8;
                      groupMessage.team = {
                        teamid : companyGroup._id,
                        name : companyGroup.name,
                        logo : companyGroup.logo
                      };
                      groupMessage.user ={
                        user_id : user._id,
                        name : user.nickname,
                        logo : user.photo
                      };
                      groupMessage.save();

                    }
                  });
                  console.log('保存用户成功');
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

//用户退出小队 todo
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

          var provoke = companyGroup.score.provoke;
          var campaign = companyGroup.score.campaign;
          var member = companyGroup.score.member;
          var participator = companyGroup.score.participator;
          var comment = companyGroup.score.comment;
          var album = companyGroup.score.album;

          provoke = (provoke == undefined || provoke == null) ? 0 : provoke;
          campaign = (campaign == undefined || campaign == null) ? 0 : campaign;
          member = (member == undefined || member == null) ? 0 : member - 10;
          participator = (participator == undefined || participator == null) ? 0 : participator;
          comment = (comment == undefined || comment == null) ? 0 : comment;
          album = (album == undefined || album == null) ? 0 : album;

          companyGroup.score = {
            'provoke':provoke,
            'campaign':campaign,
            'member':member,
            'participator':participator,
            'comment':comment,
            'album':album
          }
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

                  //修改user.role的逻辑部分
                  var l = false;//标识他是不是这个队的队长
                  var ol = false; // 标识是不是其它队的队长
                  var ok = false;//提高效率用
                  //这段代码性能很低,但是需要
                  for(var i =0; i< user.team.length; i ++) {
                      if(user.team[i]._id.toString() == tid.toString()){
                          user.team[i].leader = false;
                          l = user.team[i].leader;
                          if(ol)
                              break;//ol已标记过
                          ok =true;
                      }
                      else if(user.team[i].leader === true){
                              ol=true;//标记他为其它队长
                              if(ok)
                                  break;
                      }
                  }
                  if(!ol)
                    user.role = 'EMPLOYEE'; //如果不是其它队队长则贬为平民！
                  //----user.role

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
  if(req.role !=='HR'&& req.role!=='OWNER'&&req.role!=='PARTNER' ){
    res.status(403);
    next('forbidden');
    return;
  }
  User.findOne({
      _id : req.params.userId
  },{'hashed_password':0,'salt':0}, function(err, user) {
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
  if(req.role !=='HR'&& req.role!=='OWNER'){
    res.status(403);
    next('forbidden');
    return;
  }
  User.findOneAndUpdate({
    _id : req.params.userId
  }, req.body.user,{new:false},function(err, user) {
    if(err) {
        console.log(err);
        res.send({'result':0,'msg':'数据错误'});
    }
    else {
      if (user) {
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
  if(req.role !=='HR'&& req.role!=='OWNER'){
    res.status(403);
    next('forbidden');
    return;
  }
  User.findOne({
      _id : req.params.userId

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
    res.status(403);
    next('forbidden');
    return;
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

//获取用户简要信息供弹出层查看
exports.getBriefInfo = function(req,res){
  User.findOne({'_id': req.params.userId },{'_id':1,'realname':1,'photo':1,'nickname':1,'department':1,'phone':1,'email':1,'introduce':1},function(err,user){
    if (err || !user){
      console.log('cannot find user');
      return res.send({'result':0,'msg':'用户查询错误'});
    }else{
      // var htmlcontent ="<div class='popover_img'><a href='/users/home/"+user._id+"'><img class='size_80' src='"+user.photo+"'></img></a></div>";
      //   htmlcontent += "<div class='popover_content'><p><a href='/users/home/"+user._id+"'>"+user.nickname;
      //   if(user.realname)//如果填写真名
      //     htmlcontent+="("+user.realname+")";
      //   htmlcontent += "</a></p><p>部门:"+user.department+"</p>";
      //   if(user.phone)
      //     htmlcontent+="<p>电话:"+user.phone+"</p>";
      //   htmlcontent += "<p>Email:"+user.email+"</p></div>";
      //   if(user.introduce)//如果有简介则显示
      //     htmlcontent+="<div class='popover_brief'><p>简介："+user.introduce+"</p></div>";
      //   else
      //     htmlcontent+="<div class='popover_brief'><p>简介：这个人很懒啥都没留下-_-#</p></div>";
      // return res.send({
      //   result: 1,
      //   htmlcontent: htmlcontent
      // });
      res.render('partials/user_brief_card', { user: user });
    }
  });
};



exports.getTimelineForApp = function(req,res){
  var uid = req.params.userId;
  Campaign
  .find({ 'active' : true, 'finish' : true, '$or' : [{'member.uid' : uid}, {'camp.member.uid' : uid }]})
  .where('end_time').lt(new Date())
  .sort('-start_time')
  .populate('team').populate('cid').populate('photo_album')
  .exec()
  .then(function(campaigns) {
    if (campaigns && campaigns.length >= 0) {
      var time_lines = [];
      campaigns.forEach(function(campaign) {
        var _head, _type,_logo;
        if(campaign.camp.length>0){
          _head = campaign.team[0].name +'对' + campaign.team[1].name +'的比赛';
          _logo = model_helper.arrayObjectIndexOf(campaign.camp[0].member,uid,'uid')>-1 ?campaign.camp[0].logo :campaign.camp[1].logo;
        }
        else if(campaign.team.length==0){
          _head = '公司活动';
          _logo = campaign.cid[0].info.logo;
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
          // photo_list[i].thumbnail_uri是缩略图，200*200，photo_list[i].uri是原图
          photo_list: photo_album_controller.photoThumbnailList(campaign.photo_album, 4)
        };
        time_lines.push(tempObj);
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


var _apply = function(did,req,res,member){
  Department.findByIdAndUpdate({'_id':did},{'$push':{'member':member}},function(err,department){
    if(err || !department){
      if(res!=null)res.send(500);
    }else{
      //记得发站内信
      if(res!=null)res.send(200);
    }
  });
}

//申请加入某个部门
exports.applyToDepartment = function(req,res){
  var did = req.body.did;
  var member = {
    '_id':req.user._id,
    'nickname':req.user.nickname,
    'photo':req.user.photo,
    'apply_status':'wait'
  };
  _apply(did,req,res,member);
}


