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
    moment = require('moment');

var mail = require('../services/mail');
var encrypt = require('../middlewares/encrypt');
/**
 * Auth callback
 */
exports.authCallback = function(req, res) {
    res.redirect('/');
};
exports.authorize = function(req, res, next){
    if(req.user.provider==='company' && ( !req.params.companyId || req.params.companyId === req.user._id)){
        req.session.nowcid = req.user._id;
        req.session.role = 'HR';
    }
    else if(req.user.provider ==='user' && (!req.params.companyId || req.params.companyId === req.user.cid)){
        req.session.role = 'EMPLOYEE';
        req.session.nowcid = req.user.cid;
    }
    else{
        req.session.role = 'GUEST';
        req.session.nowcid = req.params.companyId;
    }

    next();
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
/**
 * Logout
 */
exports.signout = function(req, res) {
  req.logout();
  res.redirect('/');
};
exports.loginSuccess = function(req, res) {
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
//配合路由渲染增加小组列表Todo
exports.add_company_group = function(req, res){
    res.render('company/company_addgroup', {
        group_head: '企业',
        title: '新建小组!'
    });
};

//显示企业小组列表
exports.renderGroupList = function(req, res) {
    res.render('company/company_group_list', {
        title: '兴趣小组',
        role: req.session.role
    });
};


//显示企业成员列表
exports.renderMembers = function(req,res){
  if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST'){
    return res.send(403,forbidden);
  }
  res.render('partials/member_list',{'role':req.session.role,'provider':'company'});
}

//注意,companyGroup,entity这两个模型的数据不一定要同时保存,异步进行也可以,只要最终确保
//数据都存入两个模型即可
exports.groupSelect = function(req, res) {
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

            var companyGroup = new CompanyGroup();
            companyGroup._id = req.session.company_id;
            companyGroup.cid = req.session.company_id;
            companyGroup.cname = company.info.name;
            companyGroup.gid = '0';
            companyGroup.group_type = 'virtual';
            companyGroup.entity_type = 'virtual';
            companyGroup.name = 'virtual';

            companyGroup.save(function (err){
                if (err) {
                    console.log(err);
                } else {
                    ;
                }
            });
            for (var i = 0, length = selected_groups.length; i < length; i++) {
                var tname = company.info.name + '-'+ selected_groups[i].group_type + '队'; //默认的小队名


                var companyGroup = new CompanyGroup();

                companyGroup.cid = req.session.company_id;
                companyGroup.cname = company.info.name;
                companyGroup.gid = selected_groups[i]._id;
                companyGroup.group_type = selected_groups[i].group_type;
                companyGroup.entity_type = selected_groups[i].entity_type;
                companyGroup.name = tname;
                companyGroup.logo = '/img/icons/group/' + companyGroup.entity_type +'_on.png';

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
                entity.cid = req.session.company_id;  //组件类型id
                entity.gid = selected_groups[i]._id;  //公司id

                entity.save(function (err){
                    if (err) {
                        console.log(err);
                    }
                });
            }

            company.save(function (s_err){
                if(s_err){
                    console.log(s_err);
                }
            });
            res.send({'result':1,'msg':'组件选择成功！'});
        } else {
            console.log(req.session.company_id);
            return res.send('err');
        }
    });
};
//HR增加小组
exports.saveGroup = function(req, res) {
    var selected_group = req.body.selected_group;
    if(selected_group === undefined){
        return  res.redirect('/company/add_group');
    }

    Company.findOne({_id : req.session.nowcid}, function(err, company) {
        if(company) {
            if (err) {
                console.log('不存在公司');
                return;
            }

            var companyGroup = new CompanyGroup();

            companyGroup.cid = req.session.nowcid;
            companyGroup.cname = company.info.name;
            companyGroup.gid = selected_group._id;
            companyGroup.group_type = selected_group.group_type;
            companyGroup.entity_type = selected_group.entity_type;
            companyGroup.name = req.body.tname;
            companyGroup.logo = '/img/icons/group/' + selected_group.entity_type +'_on.png';
            console.log(companyGroup.logo);

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
            entity.cid = req.session.company_id;  //组件类型id
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
            console.log(req.session.company_id);
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
            console.log(user.status.active);
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
    if(req.session.role === 'HR'){
        return res.render('company/home', {
            title : '公司主页',
            logo: req.user.info.logo,
            role : req.session.role,
            cname : req.user.info.name,
            sign : req.user.info.brief,
            groupnumber: req.user.team.length,
            membernumber: req.user.info.membernumber
        });
    }
    else{

        Company.findOne({_id: req.user.cid}, function(err, company) {
            if(company) {
                if (err) {
                    console.log('错误');
                }
                return res.render('company/home', {
                    title : '公司主页',
                    logo: company.info.logo,
                    role : req.session.role,
                    cname : company.info.name,
                    sign : company.info.brief,
                    groupnumber: company.team ? company.team.length : 0,
                    membernumber: company.info.membernumber
                });
            }
            else
                res.redirect('/');
        });
    }
};

exports.Info = function(req, res) {
    res.render('company/company_info', {
            title: '企业信息管理',
            role: req.session.role
        });
};

exports.saveGroupInfo = function(req, res){
    if(req.session.role !=='HR' && req.session.role !=='LEADER'){
        return res.send(403,forbidden);
    }
    CompanyGroup.findOne({'_id' : req.body.tid}, function(err, companyGroup) {
        if (err) {
          console.log('数据错误');
          res.send({'result':0,'msg':'数据查询错误'});
          return;
        }
        if(companyGroup) {
            companyGroup.name = req.body.tname;
            companyGroup.save(function (s_err){
                if(s_err){
                    console.log(s_err);
                    res.send({'result':0,'msg':'数据保存错误'});
                    return;
                }
                var entity_type = companyGroup.entity_type;
                var Entity = mongoose.model(entity_type);//将对应的增强组件模型引进来
                Entity.findOne({
                    'tid': req.body.tid
                },function(err, entity) {
                    if (err) {
                        console.log(err);
                        return res.send(err);
                    } else if(entity){
                        entity.save(function(err){
                            if(err){
                              console.log(err);
                              return res.send({'result':0,'msg':'不存在小队！'});;
                            }
                            res.send({'result':1,'msg':'更新成功'});
                        });
                    }
                });
            });
        } else {
            res.send({'result':0,'msg':'不存在小组！'});
        }
    });
};

exports.getAccount = function(req, res) {
    Company.findOne({'_id': req.session.nowcid}, {'_id':0,'username': 1,'login_email':1, 'register_date':1,'info':1},function(err, _company) {
        if (err) {
            console.log(err);
        }
        if(_company) {
            var _account = {
                'login_email': _company.login_email,
                'register_date': _company.register_date
            };
            if(req.session.role==='HR'){
                _account.inviteUrl = 'http://' + req.headers.host + '/users/invite?key=' + encrypt.encrypt(req.session.nowcid, config.SECRET) + '&cid=' + req.session.nowcid;
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
    if(req.session.role!=='HR'){
        return res.send(403, 'forbidden!');
    }
    var _company = {};
    if(req.body.company!==undefined){
        _company = req.body.company;
    }
    else if(req.body.info!==undefined){
        _company.info = req.body.info;
    }
    Company.findOneAndUpdate({'_id': req.user._id}, _company,null, function(err, company) {
        if (err) {
            console.log('数据错误');
            res.send({'result':0,'msg':'数据查询错误'});
            return;
        }
        if(company) {
            res.send({'result':1,'msg':'更新成功'});
        } else {
            res.send({'result':0,'msg':'不存在该公司'});
        }
    });
};
exports.timeLine = function(req, res){
  Campaign
  .find({ 'end_time':{'$lt':new Date()},'cid': req.session.nowcid})
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
      return res.render('partials/timeLine',{'timeLines': timeLines,'moment':moment });
    }
    else{
      return res.render('partials/timeLine');
    }
  })
  .then(null, function(err) {
    console.log(err);
    return res.render('partials/timeLine');
  });
}
/**
 * Find company by id
 */
exports.company = function(req, res, next, id) {
    Company
        .findOne({
            _id: id
        })
        .exec(function(err, company) {
            if (err) return next(err);
            if (!company) return next(new Error('Failed to load Company ' + id));
            req.profile = company;
            next();
        });
};
exports.renderCompanyCampaign = function(req, res){
    if(req.session.role==='GUEST'){
        return res.send(403, 'forbidden!');
    }
    res.render('partials/campaign_list',{
        'role':req.session.role,
        'provider':'company'
    });
}
//返回公司发布的所有活动,待前台调用
exports.getCompanyCampaign = function(req, res) {
    if(req.session.role==='GUEST'){
        return res.send(403, 'forbidden!');
    }
    else if(req.session.role ==='EMPLOYEE'){
        //公司发布的活动都归在虚拟组 gid = 0 里
        Campaign.find({'cid' : req.session.nowcid.toString(), 'gid' : '0'}, function(err, campaign) {
            if (err) {
                console.log(err);
                return res.status(404).send([]);
            } else {
                var campaigns = [];
                for(var i = 0;i < campaign.length; i ++) {
                    campaigns.push({
                        'active':campaign[i].active,
                        'id': campaign[i].id,
                        'gid': campaign[i].gid,
                        'group_type': campaign[i].group_type,
                        'cid': campaign[i].cid,
                        'cname': campaign[i].cname,
                        'poster': campaign[i].poster,
                        'content': campaign[i].content,
                        'location': campaign[i].location,
                        'member': campaign[i].member,
                        'create_time': campaign[i].create_time,
                        'start_time': campaign[i].start_time,
                        'end_time': campaign[i].end_time,
                    });
                    for(var j = 0;j < campaign[i].member.length; j ++) {
                        if(req.user.id === campaign[i].member[j].uid) {
                            campaigns[i].join = true;
                            break;
                        }
                    }
                }
                return res.send({'data':campaigns,'role':req.session.role});
            }
        });
    }
    else if(req.session.role ==='HR'){
        Campaign.find({'cid' : req.session.nowcid, 'gid' : '0'}, function(err, campaigns) {
            if (err) {
                console.log(err);
                return res.status(404).send([]);
            }
            else {
                return res.send({'data':campaigns,'role':req.session.role});
            }
        });
    }
};


exports.changeUser = function (req, res) {
    var _user = req.body.user;
    var operate = req.body.operate;

    switch(operate) {
        case 'change':
            User.findOne({'_id':_user._id},function (err, user) {
                if(err || !user) {
                    return res.send('ERROR');
                } else {
                    user.nickname = _user.nickname;
                    user.department = _user.department;
                    user.position = _user.position;
                    user.save(function (err) {
                        if(err) {
                            return res.send('ERR');
                        } else {
                            return res.send('ok');
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

//任命组长
exports.appointLeader = function (req, res) {
  var uid = req.body.uid;
  var gid = req.body.gid;
  var cid = req.body.cid;
  var tid = req.body.tid;
  if(cid !==req.user._id){
    return res.send(403, 'forbidden!');
  }
  User.findOne({
        _id : uid
    },function (err, user) {

        if (err || !user) {
            return res.send('ERROR');
        } else {

            var s = true;
            for(var i =0; i< user.group.length && s; i ++) {
                if(req.user.group[i]._id === gid){
                    for(var k = 0; k < user.group.length; k ++){
                        if(req.user.group[i].team[k]._id == tid.toString()){
                            req.user.group[i].team[k].leader = true;
                            s = false;
                            break;
                        }
                    }
                }
            }
            user.role = 'LEADER';
            user.save(function(err) {
                if(err) {
                    return res.send('ERROR');
                } else {
                    CompanyGroup.findOne({_id : tid},function (err, company_group) {
                        if (err || !company_group) {
                            //这里需要回滚User的操作
                            return res.send('ERROR');
                        } else {
                            company_group.leader.push({
                                '_id' : uid,
                                'nickname' : user.nickname,
                                'photo': user.photo
                            });
                            company_group.save(function(err){
                                if(err){
                                    //这里需要回滚User的操作
                                    return res.send('ERROR');
                                } else {
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


//关闭企业活动
exports.campaignCancel = function (req, res) {
    var campaign_id = req.body.campaign_id;
    Campaign.findOne({_id:campaign_id},function(err, campaign) {
        if(campaign) {
            if (err) {
                console.log('错误');
            }
            if(campaign.poster.cid.toString() !== req.user._id.toString()){
                return res.send(403, 'forbidden!');
            }
            var active = campaign.active;
            campaign.active = !active;
            campaign.save();

            return res.send('ok');
            //console.log('创建成功');
        } else {
            return res.send('not exist');
        }
    });
};

//HR发布一个活动(可能是多个企业)
exports.sponsor = function (req, res) {
    if(req.session.role !=='HR'){
      return res.send(403,forbidden);
    }
    var username = req.user.info.name;
    var cid = req.user._id.toString();    //公司id
    var gid = '0';                  //HR发布的活动,全部归在虚拟组里,虚拟组的id默认是0
    var group_type = '虚拟组';
    var company_in_campaign = req.body.company_in_campaign;//公司id数组,HR可以发布多个公司一起的的联谊或者约战活动,注意:第一个公司默认就是次hr所在的公司!

    if(company_in_campaign === undefined || company_in_campaign === null) {
        company_in_campaign = [cid];
    }
    var content = req.body.content;//活动内容
    var location = req.body.location;//活动地点
    var campaign = new Campaign();
    campaign.team.push(cid);
    campaign.gid.push(gid);
    campaign.group_type.push(group_type);
    campaign.cname = username;
    campaign.cid = company_in_campaign; //参加活动的所有公司的id
    campaign.poster.cname = username;
    campaign.poster.cid = cid;
    campaign.poster.role = 'HR';
    campaign.active = true;
    campaign.content = content;
    campaign.location = location;

    campaign.start_time = req.body.start_time;
    campaign.end_time = req.body.end_time;


    var photo_album = new PhotoAlbum();

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
            campaign.photo_album = { pid: photo_album._id, name: photo_album.name };
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
                groupMessage.team.push(cid);
                groupMessage.group.gid.push(gid);
                groupMessage.group.group_type.push(group_type);
                groupMessage.active = true;
                groupMessage.cid.push(cid);

                groupMessage.poster.cname = username;
                groupMessage.poster.cid = cid;
                groupMessage.poster.role = 'HR';

                groupMessage.content = content;
                groupMessage.location = location;
                groupMessage.start_time = req.body.start_time;
                groupMessage.end_time = req.body.end_time;

                groupMessage.save(function(err) {
                    if (err) {
                        return res.send({'result':0,'msg':'活动创建失败'});
                    }
                    else{
                        res.send({'result':1,'msg':'活动创建成功'});
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


exports.saveLogo = function(req, res) {
  var _company = req.user;

  var logo_temp_path = req.files.logo.path;

  var shasum = crypto.createHash('sha1');
  shasum.update( Date.now().toString() + Math.random().toString() );
  var logo = shasum.digest('hex') + '.png';


  // 文件系统路径，供fs使用
  var target_dir = path.join(meanConfig.root, '/public/img/company/logo/');

  // uri路径，存入数据库的路径，供前端访问
  var uri_dir = '/img/company/logo/';

  try {
    gm(logo_temp_path).size(function(err, value) {
      if (err) {
        console.log(err);
        res.redirect('/company/editLogo');
      }

      var w = req.body.width * value.width;
      var h = req.body.height * value.height;
      var x = req.body.x * value.width;
      var y = req.body.y * value.height;

      Company.findOne({ _id: _company._id }).exec(function(err, company) {
        var ori_logo = company.info.logo;

        try {
          gm(logo_temp_path)
          .crop(w, h, x, y)
          .resize(150, 150)
          .write(path.join(target_dir, logo), function(err) {
            if (err) {
              console.log(err);
              res.redirect('/company/editLogo');
            } else {
              company.info.logo = path.join(uri_dir, logo);
              company.save(function(err) {
                if (err) {
                  console.log(err);
                  res.redirect('/company/editLogo');
                }
              });
              fs.unlink(logo_temp_path, function(err) {
                if (err) {
                  console(err);
                  res.redirect('/company/editLogo');
                }
                var unlink_dir = path.join(meanConfig.root, 'public');
                if (ori_logo && ori_logo !== '/img/icons/default_company_logo.png') {
                  if (fs.existsSync(unlink_dir + ori_logo)) {
                    fs.unlinkSync(unlink_dir + ori_logo);
                  }
                }

              });
            }
            res.redirect('/company/editLogo');
          });
        } catch(e) {
          console.log(e);
        }

      });
    });
  } catch(e) {
    console.log(e);
  }


};

exports.editLogo = function(req, res) {
  var _company = req.user;
  Company.findOne({ _id: _company._id }).exec(function(err, company) {
    res.render('company/edit_logo', {
      logo: company.info.logo,
      id: company._id,
      role: req.session.role
    });
  });

};
