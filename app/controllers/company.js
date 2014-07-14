'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    encrypt = require('../middlewares/encrypt'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    CompanyRegisterInviteCode = mongoose.model('CompanyRegisterInviteCode'),
    User = mongoose.model('User'),
    UUID = require('../middlewares/uuid'),
    GroupMessage = mongoose.model('GroupMessage'),
    PhotoAlbum = mongoose.model('PhotoAlbum'),
    Config = mongoose.model('Config'),
    Campaign = mongoose.model('Campaign'),
    config = require('../config/config'),
    crypto = require('crypto'),
    path = require('path'),
    meanConfig = require('../../config/config'),
    gm = require('gm'),
    fs = require('fs'),
    async = require('async'),
    moment = require('moment'),
    message = require('../controllers/message'),
    schedule = require('../services/schedule'),
    photo_album_controller = require('./photoAlbum'),
    model_helper = require('../helpers/model_helper');

var mail = require('../services/mail');
var encrypt = require('../middlewares/encrypt');
/**
 * Auth callback
 */
exports.authCallback = function(req, res) {
    res.redirect('/');
};

/*
  忘记密码
*/
exports.renderForgetPwd = function(req, res){
  res.render('company/forgetPwd',{
    title:'忘记密码'
  });
}
exports.forgetPwd = function(req, res){
  Company.findOne({login_email: req.body.email}, function(err, company) {
    if(err || !company) {
      return  res.render('company/forgetPwd',{
                title:'忘记密码',
                err: '您输入的账号不存在'
              });
    } else {
      mail.sendCompanyResetPwdMail(req.body.email, company._id.toString(), req.headers.host);
      res.render('company/forgetPwd', {
        title: '忘记密码',
        success:'1'
      });
    }
  });
}

//渲染修改资料页
exports.renderChangePassword = function(req,res){
  res.render('partials/change_passowrd');
}

exports.renderResetPwd = function(req, res){
  var key = req.query.key;
  var uid = req.query.uid;
  var time = req.query.time;
  time = new Date(encrypt.decrypt(time, config.SECRET));
  var validTime = new Date();
  validTime.setMinutes(new Date().getMinutes()-30);
  if(time<validTime){
    return  res.render('company/forgetPwd',{
          title:'忘记密码',
          err: '您的验证邮件已经失效，请重新申请'
        });
  }
  else if(encrypt.encrypt(uid, config.SECRET) ===key){
      res.render('company/resetPwd',{
        title:'重设密码',
        id: uid
      });
  }
  else{
      return  res.render('company/forgetPwd',{
        title:'忘记密码',
        err: '您的验证链接无效，请重新验证'
      });
  }

}
exports.resetPwd = function(req, res){
  Company.findOne({_id: req.body.id}, function(err, company) {
    if(err || !company) {
      return  res.render('company/resetPwd',{
                title:'重设密码',
                err: '您输入的账号不存在'
              });
    } else {
      company.password = req.body.password;
      company.save(function(err){
        if(!err){
          res.render('company/resetPwd', {
            title: '重设密码',
            success: '1'
          });
        }
      });
    }
  });
}
exports.signin = function(req, res) {
    res.render('company/signin', {title: '公司登录'});
};

var destroySession = function(req){
  if(req.role != null || req.role != undefined){
    delete req.role;
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
exports.loginSuccess = function(req, res) {
    req.session.Global.nav_name = req.user.info.name;
    req.session.Global.nav_logo = req.user.info.logo;
    req.session.Global.role = "HR";
    res.redirect('/company/home');
};

/**
 * Show sign up form
 */
exports.signup = function(req, res) {
    Config.findOne({ name: config.CONFIG_NAME })
    .exec(function(err, config) {
        if (err) {
            console.log(err);
        } else {
            var is_need_invite = false;
            if (config) {
                is_need_invite = config.company_register_need_invite;
            }
            res.render('company/company_signup', {
                title: '注册',
                is_need_invite: is_need_invite
            });
        }
    });
};

exports.wait = function(req, res) {
    res.render('company/company_wait', {
        title: '等待验证'
    });
};

exports.validateError = function(req, res) {
    res.render('company/company_validate_error', {
        title: '验证错误'
    });
};


//开始转入公司注册账户页面
exports.validateConfirm = function(req, res) {
    if(req.session.company_id !== '') {
        res.render('company/validate/confirm', {
            title: '验证成功,可以进行下一步!'
        });
    }
};
//配合路由渲染公司注册账户页面
exports.create_company_account = function(req, res) {
    res.render('company/validate/create_detail', {
        group_head: '企业',
        title: '选择组件!'
    });
};
//配合路由渲染公司选组件页面
exports.select = function(req, res) {
    res.render('company/validate/group_select', {
        group_head: '企业',
        title: '选择组件!'
    });
};
//配合路由渲染邀请链接页面
exports.invite = function(req, res) {
    var inviteUrl = 'http://' + req.headers.host + '/users/invite?key=' + encrypt.encrypt(req.session.company_id, config.SECRET) + '&cid=' + req.session.company_id;
    var companyId = req.session.company_id;
    req.session.company_id =null;
    Company.findOne({_id : companyId}, function(err, company) {
            if (err || !company) {
                console.log('不存在公司');
                return res.status(404).send('不存在该公司');
            }
            res.render('company/validate/invite', {
                title: '邀请链接',
                inviteLink: inviteUrl,
                companyId: companyId,
                defaultDomain:company.email.domain[0]
            });
    });

};
exports.addDomain = function(req,res){
    Company.findOne({_id : req.body.companyId}, function(err, company) {
            if (err || !company) {
                console.log('不存在公司');
                return res.send({'result':0,'msg':' 不存在该公司'});
            }
            if(company.email.domain.indexOf(req.body.domain)>-1){
                return res.send({'result':0,'msg':'  该后缀已经存在'});
            }
            company.email.domain.push(req.body.domain);
            company.save(function(err){
                if (!err) {
                    return res.send({'result':1,'msg':' 邮箱后缀添加成功'});
                }
                else{
                     return res.send({'result':0,'msg':' 邮箱后缀添加失败'});
                }
            })
    });
}
//配合路由渲染增加小队列表Todo
exports.add_company_group = function(req, res){
    res.render('company/company_addgroup', {
        group_head: '企业',
        title: '新建小队!'
    });
};

//显示企业小队列表
exports.renderGroupList = function(req, res) {
    res.render('company/company_group_list', {
        title: '兴趣小队',
        role: req.role
    });
};


//显示企业成员列表
exports.renderMembers = function(req,res){
  if(req.role ==='GUESTHR' || req.role ==='GUEST'){
    return res.send(403,'forbidden');
  }
  res.render('partials/member_list',{'role':req.role,'provider':'company'});
}

//注意,companyGroup,entity这两个模型的数据不一定要同时保存,异步进行也可以,只要最终确保
//数据都存入两个模型即可
exports.groupSelect = function(req, res) {

    if(req.session.selected != undefined && req.session.selected !=null){
        return res.send('already selected!');
    } else {
        req.session.selected = true;
    }

    var selected_groups = req.body.selected_groups;
    if(selected_groups === undefined){
        return  res.redirect('/company/signup');
    }

    Company.findOne({_id : req.session.company_id}, function(err, company) {
        if(company) {
            if (err) {
                console.log('不存在公司');
                return;
            }

            for (var i = 0, length = selected_groups.length; i < length; i++) {
                var tname = company.info.official_name + '-'+ selected_groups[i].group_type + '队'; //默认的小队名


                var companyGroup = new CompanyGroup();

                companyGroup.cid = req.session.company_id;
                companyGroup.cname = company.info.name;
                companyGroup.gid = selected_groups[i]._id;
                companyGroup.group_type = selected_groups[i].group_type;
                companyGroup.entity_type = selected_groups[i].entity_type;
                companyGroup.name = tname;
                companyGroup.logo = '/img/icons/group/' + companyGroup.entity_type.toLowerCase() +'_on.png';

                companyGroup.save(function (err){
                    if (err) {
                        console.log(err);
                    } else {
                        ;
                    }
                });

                company.team.push({
                    'gid' : selected_groups[i]._id,
                    'group_type' : selected_groups[i].group_type,
                    'name' : tname,
                    'id' : companyGroup._id
                });
                var Entity = mongoose.model(companyGroup.entity_type);//将增强组件模型引进来
                var entity = new Entity();

                //增强组件目前只能存放这三个字段
                entity.tid = companyGroup._id;        //小队id
                entity.cid = req.session.company_id;  //公司id
                entity.gid = selected_groups[i]._id;  //组件类型id

                entity.save(function (err){
                    if (err) {
                        console.log(err);
                    }
                });
            }

            company.save(function (s_err){
                if(req.session.selected != undefined && req.session.selected !=null){
                    delete req.session.selected;
                }
                if(s_err){
                    return res.send('err');
                }
            });
            res.send({'result':1,'msg':'组件选择成功！'});
        } else {
            return res.send('err');
        }
    });
};
//HR增加小队
exports.saveGroup = function(req, res) {
    var selected_group = req.body.selected_group;
    if(selected_group === undefined){
        return  res.redirect('/company/add_group');
    }
    var companyId = req.params.companyId;
    Company.findOne({_id : companyId}, function(err, company) {
        if(company) {
            if (err) {
                console.log('不存在公司');
                return;
            }

            var companyGroup = new CompanyGroup();

            companyGroup.cid = companyId;
            companyGroup.cname = company.info.name;
            companyGroup.gid = selected_group._id;
            companyGroup.group_type = selected_group.group_type;
            companyGroup.entity_type = selected_group.entity_type;
            companyGroup.name = req.body.tname;
            companyGroup.logo = '/img/icons/group/' + selected_group.entity_type.toLowerCase() +'_on.png';

            companyGroup.save(function (err){
                if (err) {
                    console.log(err);
                } else {
                    ;
                }
            });

            company.team.push({
                'gid' : selected_group._id,
                'group_type' : selected_group.group_type,
                'name' : req.body.tname,
                'id' : companyGroup._id
            });
            var Entity = mongoose.model(companyGroup.entity_type);//将增强组件模型引进来
            var entity = new Entity();

            //增强组件目前只能存放这三个字段
            entity.tid = companyGroup._id;        //小队id
            entity.cid = companyId;  //组件类型id
            entity.gid = selected_group._id;  //公司id

            entity.save(function (err){
                if (err) {
                    console.log(err);
                }
            });

            company.save(function (s_err){
                if(s_err){
                    console.log(s_err);
                }
            });
            res.send({'result':1,'msg':'组件添加成功！'});
        } else {
            return res.send('err');
        }
    });
};

exports.validate = function(req, res) {

    var key = req.query.key;
    var _id = req.query.id;
    Company.findOne({
        _id : _id
    },
    function (err, user) {
        if (user) {
            if(!user.status.active) {
                //到底要不要限制验证邮件的时间呢?
                //废话,当然要
                if(encrypt.encrypt(_id,config.SECRET) === key){
                    var time_limit = config.COMPANY_VALIDATE_TIMELIMIT;
                    if(parseInt(new Date().getTime()) - parseInt(user.status.date) > time_limit){
                        res.render('company/company_validate_error', {
                            title: '验证失败',
                            message: '注册链接已经过期!'
                        });
                    } else {
                        req.session.company_id = _id;
                        user.save(function(err){
                            if(err){
                                res.render('company/company_validate_error', {
                                    title: '验证失败',
                                    message: '未知错误!'
                                });
                            } else {
                                res.redirect('/company/confirm');
                            }
                        });
                    }
                } else {
                    res.render('company/company_validate_error', {
                        title: '验证失败',
                        message: '验证码不正确!'
                    });
                }
            } else {
                res.render('company/company_validate_error', {
                    title: '验证失败',
                    message: '请不要重复注册!'
                });
            }
        } else {
            res.render('company/company_validate_error', {
                title: '验证失败',
                message: '该公司不存在!'
            });
        }
    });
};


///防止邮箱重复注册
exports.mailCheck = function(req, res) {
    var login_email = req.body.login_email;
    Company.findOne({'login_email':login_email}, function(err, company) {
        if(err || company) {
            res.send(true);
        } else {
            res.send(false);
        }
    });
}
//企业官方名验证
exports.officialNameCheck = function(req, res) {
    var official_name = req.body.official_name;
    Company.findOne({'info.official_name':official_name},function(err,company){
        if(err || company){
            console.log(company);
            res.send(true);
        }
        else{
            res.send(false);
        }
    });
}
//企业用户名验证
exports.usernameCheck = function(req, res) {
    var username = req.body.username;
    Company.findOne({'username':username},function(err,company){
        if(err || company){
            res.send(true);
        }
        else{
            res.send(false);
        }
    });
}

/**
 * 创建公司基本信息
 */
exports.create = function(req, res) {

    Config
    .findOne({ name: config.CONFIG_NAME })
    .exec()
    .then(function(config) {
        if (config && config.company_register_need_invite === true) {
            return CompanyRegisterInviteCode
            .findOne({ code: req.body.invite_code })
            .populate('company')
            .exec()
            .then(function(code) {
                if (code) {
                    // 如果邀请码属于公司，则在公司邀请码列表中将其移除

                    if (code.company) {
                        var company = code.company;
                        var removeIndex = company.register_invite_code.indexOf(code.code);
                        company.register_invite_code.splice(removeIndex, 1);
                        company.save(console.log);
                    }
                    code.remove(function(err) {
                        if (err) {
                            console.log(err);
                            console.log('remove出错');
                            throw err;
                        }
                    });
                    return Company.create({
                        username: UUID.id(),
                        password: UUID.id(),
                        info: {
                            name: req.body.name
                        }
                    });
                } else {
                    throw new Error('邀请码不正确');
                }
            });
        } else {
            return Company.create({
                username: UUID.id(),
                password: UUID.id(),
                info: {
                    name: req.body.name
                }
            });
        }
    })
    .then(function(company) {
        company.info.name = req.body.name;
        company.info.city.province = req.body.province;
        company.info.city.city = req.body.city;
        company.info.city.district = req.body.district;
        company.info.address = req.body.address;
        company.info.linkman = req.body.contacts;
        company.info.lindline.areacode = req.body.areacode;
        company.info.lindline.number = req.body.number;
        company.info.lindline.extension = req.body.extension;
        company.info.phone = req.body.phone;
        company.provider = 'company';
        company.login_email = req.body.email;
        var _email = req.body.email.split('@');
        if(_email[1])
            company.email.domain.push(_email[1]);
        else
            return res.status(400).send({'result':0,'msg':'您输入的邮箱不正确'});

        // 为该公司添加3个注册邀请码
        company.register_invite_code = [];
        var code_count = 0;

        async.whilst(
            function() { return code_count < 3; },

            function(callback) {
                var invite_code = new CompanyRegisterInviteCode({
                    company: company._id
                });
                invite_code.save(function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        company.register_invite_code.push(invite_code.code);
                        code_count++;
                        callback();
                    }
                });
            },

            function(err) {

                if (err) {
                    return console.log(err);
                }
                //注意,日期保存和发邮件是同步的,也要放到后台管理里去,这里只是测试需要
                company.status.date = new Date().getTime();

                company.save(function(err) {
                    if (err) {
                        console.log(err);
                        //检查信息是否重复
                        switch (err.code) {
                            case 11000:
                                return res.status(400).send({'result':0,'msg':'该公司已经存在!'});
                                break;
                            case 11001:
                                return res.status(400).send({'result':0,'msg':'该邮箱已经存在!'});
                                break;
                            default:
                                break;
                        }
                        return res.render('company/company_signup', {
                            company: company
                        });
                    }
                    //注意,日期保存和发邮件是同步的,也要放到后台管理里去,这里只是测试需要
                    mail.sendCompanyActiveMail(company.login_email,company.info.name,company._id.toString(),req.headers.host);
                    res.redirect('/company/wait');
                });
            }
        );
    })
    .then(null, function(err) {
        console.log(err);
        res.render('company/company_signup', {
            invite_code_err: '邀请码不正确'
        });
    });

};

/**
 * 验证通过后创建公司进一步的信息(用户名\密码等)
 */
exports.createDetail = function(req, res) {


    Company.findOne({_id: req.session.company_id}, function(err, company) {
        if(!company || err) {
            res.render('company/validate/create_detail', {
                tittle: '该公司不存在或者发生错误!'
            });
        } else {
            company.info.official_name = req.body.official_name;
            company.username = req.body.username;
            company.password = req.body.password;
            company.status.active = true;

            company.save(function (err) {
                if(err) {
                    res.send({'result':0,'msg':'创建失败！'});
                } else {
                    res.send({'result':1,'msg':'创建成功！'});
                }
            });
        }
    });
};



exports.home = function(req, res) {
    var render = function(company) {
        return res.render('company/home', {
            title: '公司主页',
            cid:company._id,
            logo: company.info.logo,
            cname: company.info.name,
            sign: company.info.brief,
            groupnumber: company.team ? company.team.length : 0,
            membernumber: company.info.membernumber
        });
    };

    if (!req.params.companyId) {
        if (req.user.provider === 'company') {
            return render(req.user);
        } else if (req.user.provider === 'user') {
            return Company.findById(req.user.cid).exec()
                .then(function(company) {
                    if (!company) {
                        throw 'not found company';
                    }
                    render(company);
                })
                .then(null, function(err) {
                    console.log(err);
                    // TO DO: temp err handle
                    res.redirect('/');
                });
        }
    } else {
        return render(req.profile);
    }

};

exports.Info = function(req, res) {
    res.render('company/company_info', {
            title: '企业信息管理',
            role: req.role
        });
};

exports.saveGroupInfo = function(req, res){
    if(req.role !=='HR' && req.role !=='LEADER'){
        return res.send(403,'forbidden');
    }
    CompanyGroup.findOne({'_id' : req.body.tid}, function(err, companyGroup) {
        if (err) {
          console.log('数据错误');
          res.send({'result':0,'msg':'数据查询错误'});
          return;
        }
        if(companyGroup) {
            if(req.body.tname!==companyGroup.name){
                companyGroup.name = req.body.tname;
                companyGroup.save(function (s_err){
                    if(s_err){
                        console.log(s_err);
                        res.send({'result':0,'msg':'数据保存错误'});
                        return;
                    }
                    schedule.updateTname(req.body.tid);
                    res.send({'result':1,'msg':'更新成功'});
                });
            }
            else{
                res.send({'result':0,'msg':'您没进行修改'});
            }
        } else {
            res.send({'result':0,'msg':'不存在小队！'});
        }
    });
};

exports.getAccount = function(req, res) {
    var companyId = req.params.companyId;
    Company.findOne({'_id': companyId}, {'_id':0,'username': 1,'login_email':1, 'register_date':1,'info':1},function(err, _company) {
        if (err) {
            console.log(err);
        }
        if(_company) {
            var _account = {
                'login_email': _company.login_email,
                'register_date': _company.register_date
            };
            if(req.role==='HR'){
                _account.inviteUrl = 'http://' + req.headers.host + '/users/invite?key=' + encrypt.encrypt(companyId, config.SECRET) + '&cid=' + companyId;
            }
            return res.send({
                'result': 1,
                'company': _account,
                'info': _company.info,
                'team': _company.team
            });
        }
        else
            return res.send({'result':0,'msg':'数据查询失败！'});
    });
};

exports.saveAccount = function(req, res) {
    if(req.role!=='HR'){
        return res.send(403, 'forbidden!');
    }
    var _company = {};
    if(req.body.company!==undefined){
        _company = req.body.company;
    }
    else if(req.body.info!==undefined){
        _company.info = req.body.info;
    }
    // 保存公司资料，返回之前的公司资料（new为false）
    Company.findOneAndUpdate({'_id': req.user._id}, _company,{new:false}, function(err, company) {
        if (err) {
            console.log('数据错误');
            res.send({'result':0,'msg':'数据查询错误'});
            return;
        }
        if(company) {
            if(req.body.info!==undefined && company.info.name!==_company.info.name){
                schedule.updateCname(req.user._id);
                req.session.Global.nav_name = _company.info.name;
            }

            res.send({'result':1,'msg':'更新成功'});
        } else {
            res.send({'result':0,'msg':'不存在该公司'});
        }
    });
};
//返回公司小队的所有数据,待前台调用
exports.getCompanyTeamsInfo = function(req, res) {
  var option = {cid : req.params.companyId};
  if(req.role !== 'HR'){
    option.active = true;
  }
  CompanyGroup.find(option, function(err, teams) {
    if(err || !teams) {
      return res.send([]);
    } else {
      var output ={
        'cid':req.params.companyId,
        'role':req.role
      };
      if(req.role ==='EMPLOYEE'){
        var _teams = [];
        teams.forEach(function(value){
          var _team = {
            '_id':value._id,
            'gid':value.gid,
            'group_type':value.group_type,
            'logo':value.logo,
            'active':value.active,
            'count':value.count,
            'entity_type':value.entity_type,
            'leader':value.leader,
            'member':value.member,
            'name':value.name
          }
          if(model_helper.arrayObjectIndexOf(req.user.team,value._id,'_id')>-1){
            _team.belong = true;
          }
          else{
            _team.belong = false;
          }
          _teams.push(_team);
        });

        output.teams = _teams;
      }
      else {
        output.teams = teams;
      }
      return res.send(output);
    }
  });
};
exports.timeLine = function(req, res){
  var companyId = req.params.companyId;
  Campaign
  .find({'active':true,'finish':true,'cid': req.params.companyId})
  .sort('-start_time')
  .populate('team').populate('cid').populate('photo_album')
  .exec()
  .then(function(campaigns) {
      // todo new time style
      var newTimeLines = {};
      // todo new time style
      campaigns.forEach(function(campaign) {
        var _head,_logo;
        if(campaign.camp.length>0){
          _head = campaign.camp[0].name +'对' + campaign.camp[1].name +'的比赛';
          _logo = campaign.camp[0].cid==companyId ?campaign.camp[0].logo :campaign.camp[1].logo;
        }
        else if(campaign.team.length===0){
          _head = '公司活动';
          _logo = campaign.cid[0].logo;
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
          start_time: campaign.start_time,
          provoke:campaign.camp.length>0,
          year: getYear(campaign),
          photo_list: photo_album_controller.photoThumbnailList(campaign.photo_album, 10)
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
        if (!newTimeLines[groupYear]) {
          newTimeLines[groupYear] = {};
          newTimeLines[groupYear]['left'] = [];
          newTimeLines[groupYear]['right'] = [];
          newTimeLines[groupYear]['base'] = [];
          newTimeLines[groupYear]['left'][0] = tempObj;
          newTimeLines[groupYear]['base'][0] = tempObj;
        }else{
          var i = newTimeLines[groupYear]['base'].length;
          newTimeLines[groupYear]['base'][i] = tempObj;
          if (i%2==0) {
            var j = newTimeLines[groupYear]['left'].length;
            newTimeLines[groupYear]['left'][j] = tempObj;
          }else{
            var j = newTimeLines[groupYear]['right'].length;
            newTimeLines[groupYear]['right'][j] = tempObj;
          }
          
        }
      });
        //console.log(newTimeLines);
    return res.send({result:1,'newTimeLines': newTimeLines});
  })
  .then(null, function(err) {
    console.log(err);
    return res.send({result:0,msg:'查询错误'});
  });
}
/**
 * Find company by id
 */
exports.company = function(req, res, next, id) {
    Company
        .findOne({
            '_id': id
        })
        .exec(function(err, company) {
            if (err) return next(err);
            if (!company) return next(new Error('Failed to load Company ' + id));
            req.profile = company;
            next();
        });
};
exports.renderCompanyCampaign = function(req, res){
    if(req.role==='GUEST'){
        return res.send(403, 'forbidden!');
    }
    res.render('partials/campaign_list',{
        'role':req.role,
        'provider':'company'
    });
}

exports.changeUser = function (req, res) {
    var _user = req.body.user;
    var operate = req.body.operate;

    switch(operate) {
        case 'change':
            User.findOne({'_id':_user._id},function (err, user) {
                if(err || !user) {
                    return res.send('ERROR');
                } else {
                    var changeFlag = user.nickname!=_user.nickname;
                    user.nickname = _user.nickname;
                    user.department = _user.department;
                    user.position = _user.position;
                    user.save(function (err) {
                        if(err) {
                            return res.send({'result':0,'msg':'用户信息修改失败！'});
                        } else {
                            if(changeFlag){
                              schedule.updateUname(user._id);
                            }
                            return res.send({'result':1,'msg':'用户信息修改成功！'});
                        }
                    });
                }
            });
            break;
        case 'delete':
            User.remove({'_id':_user._id},function (err, user) {
                if(err || !user) {
                    return res.send('ERROR');
                } else {
                    return res.send('OK');
                }
            });
            break;
        default:break;
    }
};

//任命/罢免队长
exports.appointLeader = function (req, res) {
  var uid = req.body.uid;
  var gid = req.body.gid;
  var cid = req.body.cid;
  var tid = req.body.tid;
  var operate = req.body.operate;
  if(cid.toString() !==req.user._id.toString()){
    return res.send(403, 'forbidden!');
  }
  User.findOne({
        _id : uid
    },function (err, user) {
        if (err || !user) {
            return res.send('ERROR');
        } else {

            var l = false;

            //这段代码性能很低,但是需要
            for(var i =0; i< user.team.length; i ++) {
                if(user.team[i]._id.toString() == tid.toString()){
                    user.team[i].leader = operate;
                    l = user.team[i].leader;
                    break;
                }
            }


            user.role = l ? 'LEADER' : 'EMPLOYEE';

            user.save(function(err) {
                if(err) {
                    console.log('错误',err);
                    return res.send('USR_ERROR');
                } else {

                    CompanyGroup.findOne({_id : tid},function (err, company_group) {
                        if (err || !company_group) {
                            console.log(company_group);
                            //这里需要回滚User的操作
                            return res.send('N_ERROR');
                        } else {
                            if(operate){
                                company_group.leader.push({
                                    '_id' : uid,
                                    'nickname' : user.nickname,
                                    'photo': user.photo
                                });
                            } else {
                                for(var i = 0; i < company_group.leader.length; i ++) {
                                    if(company_group.leader[i]._id.toString() === uid.toString()) {
                                        company_group.leader.splice(i,1);
                                        break;
                                    }
                                }
                            }
                            company_group.save(function(err){
                                if(err){
                                    console.log('错误',err);
                                    //这里需要回滚User的操作
                                    return res.send('G_ERROR');
                                } else {
                                    console.log(operate);
                                    return res.send('OK');
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};


//HR发布一个活动(可能是多个企业)
exports.sponsor = function (req, res) {
    if(req.role !=='HR'){
      return res.send(403,'forbidden');
    }
    var cname = req.user.info.name;
    var cid = req.user._id.toString();    //公司id

    var company_in_campaign = req.body.company_in_campaign;//公司id数组,HR可以发布多个公司一起的的联谊或者约战活动,注意:第一个公司默认就是次hr所在的公司!

    if(company_in_campaign === undefined || company_in_campaign === null) {
        company_in_campaign = [cid];
    }
    var content = req.body.content;//活动内容
    var location = req.body.location;//活动地点
    var theme = req.body.theme;
    var start_time = req.body.start_time;
    var end_time = req.body.end_time;
    var deadline = req.body.deadline ? req.body.deadline :req.body.end_time;
    var member_min = req.body.member_min;
    var member_max = req.body.member_max;
    var campaign = new Campaign();
    campaign.cname = cname;
    campaign.cid = company_in_campaign; //参加活动的所有公司的id
    campaign.poster.cname = cname;
    campaign.poster.cid = cid;
    campaign.poster.role = 'HR';
    campaign.active = true;
    campaign.content = content;
    campaign.location = location;
    campaign.theme = theme;

    campaign.start_time = start_time;
    campaign.end_time = end_time;
    campaign.deadline = deadline;
    campaign.member_min = member_min;
    campaign.member_max = member_max;

    campaign.type = 1;

    var photo_album = new PhotoAlbum({
        owner: {
          model: {
            _id: campaign._id,
            type: 'Campaign'
          },
          companies: [req.user._id]
        },
        name: moment(campaign.start_time).format("YYYY-MM-DD ") + campaign.theme,
        update_user: {
          _id: req.user._id,
          name: req.user.info.name,
          type: 'hr'
        },
        create_user: {
          _id: req.user._id,
          name: req.user.info.name,
          type: 'hr'
        }
    });

    fs.mkdir(meanConfig.root + '/public/img/photo_album/' + photo_album._id, function(err) {
        if (err) {
            console.log(err);
            return res.send({'result':0,'msg':'活动创建失败'});
        }

        photo_album.save(function(err) {
            if (err) {
                console.log(err);
                return res.send({'result':0,'msg':'活动创建失败'});
            }
            campaign.photo_album = photo_album._id;
            campaign.save(function(err) {
                if (err) {
                    console.log(err);
                    //检查信息是否重复
                    switch (err.code) {
                        case 11000:
                        break;
                    case 11001:
                        res.status(400).send('该活动已经存在!');
                        break;
                    default:
                        break;
                    }
                    return;
                }

                //生成动态消息

                var groupMessage = new GroupMessage();
                groupMessage.message_type = 0;
                groupMessage.company = {
                    cid : cid,
                    name: cname,
                    logo: req.user.info.logo
                };
                groupMessage.campaign = campaign._id;
                groupMessage.save(function(err) {
                    if (err) {
                        return res.send({'result':0,'msg':'活动创建失败'});
                    }
                    else{
                        return res.send({'result':0,'msg':'活动创建成功'});
                    }
                });
            });
        });
    });
};

exports.changePassword = function(req, res){
    Company.findOne({
            _id : req.user.id
        },function(err, company) {
            if(err) {
                console.log(err);
                res.send({'result':0,'msg':'数据错误'});
            }
            else {
                if (company) {
                  if(company.authenticate(req.body.nowpassword)===true){
                    company.password = req.body.newpassword;
                    company.save(function(err){
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

                } else {
                res.send({'result':0,'msg':'您没有登录'});
            }
        }
    });
};




exports.editLogo = function(req, res) {
  var _company = req.user;
  Company.findOne({ _id: _company._id }).exec(function(err, company) {
    res.render('company/edit_logo', {
        logo: company.info.logo,
        id: company._id
    });
  });

};
exports.renderTeamInfo = function(req, res){
    return res.render('company/team_info_list',{role:req.role});
}
