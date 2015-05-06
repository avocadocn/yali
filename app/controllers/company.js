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
  Department = mongoose.model('Department'),
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
  auth = require('../services/auth'),
  photo_album_controller = require('./photoAlbum'),
  model_helper = require('../helpers/model_helper'),
  tools = require('../helpers/tools'),
  cache = require('../services/cache/Cache'),
  campaign_controller =require('../controllers/campaign'),
  logController =require('../controllers/log'),
  validator = require('validator');

var mail = require('../services/mail');
var sendcloud = require('../services/sendcloud');
var webpower = require('../services/webpower');
var encrypt = require('../middlewares/encrypt');
var qrcodeService = require('../services/qrcode');

var isMobile = function(req) {
  var deviceAgent = req.headers["user-agent"].toLowerCase();
  return deviceAgent.match(/(iphone|ipod|ipad|android)/);
};

/**
 * Auth callback
 */
exports.authCallback = function(req, res) {
  res.redirect('/');
};

/*
  忘记密码
*/
exports.renderForgetPwd = function(req, res) {
  res.render('company/forgetPwd', {
    title: '忘记密码'
  });
}
exports.forgetPwd = function(req, res) {
  Company.findOne({
    login_email: req.body.email
  }, function(err, company) {
    if (err || !company) {
      return res.render('company/forgetPwd', {
        title: '忘记密码',
        err: '您输入的账号不存在'
      });
    } else {
      Config.findOne({ name: config.CONFIG_NAME }, function (err, config) {
        if (err || !config || !config.smtp || config.smtp === 'webpower') {
          webpower.sendCompanyResetPwdMail(req.body.email, company._id.toString(), req.headers.host, function(err) {
            if (err) {
              // TO DO: 发送失败待处理
              console.log(err);
            } else {
              res.render('company/forgetPwd', {
                title: '忘记密码',
                success: '1'
              });
            }
          });
        } else if (config.smtp === '163') {
          mail.sendCompanyResetPwdMail(req.body.email, company._id.toString(), req.headers.host);
          res.render('company/forgetPwd', {
            title: '忘记密码',
            success: '1'
          });
        } else if (config.smtp === 'sendcloud') {
          sendcloud.sendCompanyResetPwdMail(req.body.email, company._id.toString(), req.headers.host);
          res.render('company/forgetPwd', {
            title: '忘记密码',
            success: '1'
          });
        }
      });
    }
  });
}

//渲染修改资料页
exports.renderChangePassword = function(req, res) {
  res.render('partials/change_passowrd');
}

exports.renderResetPwd = function(req, res) {
  var key = req.query.key;
  var uid = req.query.uid;
  var time = req.query.time;
  time = new Date(encrypt.decrypt(time, config.SECRET));
  var validTime = new Date();
  validTime.setMinutes(new Date().getMinutes() - 30);
  if (time < validTime) {
    return res.render('company/forgetPwd', {
      title: '忘记密码',
      err: '您的验证邮件已经失效，请重新申请'
    });
  } else if (encrypt.encrypt(uid, config.SECRET) === key) {
    res.render('company/resetPwd', {
      title: '重设密码',
      id: uid
    });
  } else {
    return res.render('company/forgetPwd', {
      title: '忘记密码',
      err: '您的验证链接无效，请重新验证'
    });
  }

}
exports.resetPwd = function(req, res) {
  Company.findOne({
    _id: req.body.id
  }, function(err, company) {
    if (err || !company) {
      return res.render('company/resetPwd', {
        title: '重设密码',
        err: '您输入的账号不存在'
      });
    } else {
      company.password = req.body.password;
      company.save(function(err) {
        if (!err) {
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

  var msg = {
    title: "公司登录"
  };
  if (req.params.loginStatus) {
    switch (req.params.loginStatus) {
      case 'failure':
        msg.msg = req.session.flash.error[req.session.flash.error.length - 1];
        break;
      default:
        break;
    }
  }
  if (req.user) {
    res.redirect('/company/home');
  } else {
    res.render('company/signin', msg);
  }
};


/**
 * Logout
 */
exports.signout = function(req, res) {
  req.logout();
  res.redirect('/');
};

exports.loginSuccess = function(req, res) {
  var logBody = {
    'log_type':'userlog',
    'cid' : req.user._id,
    'role' : 'hr',
    'ip' :req.headers['x-forwarded-for'] || req.connection.remoteAddress
  }
  logController.addLog(logBody);
  res.redirect('/company/home');
};

/**
 * Show sign up form
 */
exports.signup = function(req, res) {
  Config.findOne({
    name: config.CONFIG_NAME
  })
    .exec(function(err, config) {
      if (err) {
        console.log(err);
      } else {
        var is_need_invite = false;
        if (config) {
          is_need_invite = config.company_register_need_invite;
        }
        var deviceAgent = req.headers["user-agent"].toLowerCase();
        var agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
        if(agentID) {
          res.render('signup/signup_phone', {
            title: '注册',
            is_need_invite: is_need_invite
          });
        }else {
          res.render('signup/company_signup', {
            title: '注册',
            is_need_invite: is_need_invite
          });
        }
          
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
  var renderData = {
    title: '验证成功!'
  };

  if (req.session.company_id !== '') {
    if (isMobile(req)) {
      res.render('company/validate/mobile_confirm', renderData);
    }
    else {
      res.render('company/validate/confirm', renderData);
    }
  }
};
//配合路由渲染公司注册账户页面
exports.create_company_account = function(req, res) {
  var renderData = {
    group_head: '企业',
    title: '选择组件!'
  };

  if (isMobile(req)) {
    res.render('company/validate/mobile_create_detail', renderData);
  }
  else {
    res.render('company/validate/create_detail', renderData);
  }
};
//配合路由渲染公司选组件页面
exports.select = function(req, res) {
  var renderData = {
    group_head: '企业',
    title: '选择组件!'
  };

  if (isMobile(req)) {
    res.render('company/validate/mobile_group_select', renderData);
  }
  else {
    res.render('company/validate/group_select', renderData);
  }
};
//配合路由渲染邀请链接页面
exports.invite = function(req, res) {
  var companyId = req.session.company_id;
  req.session.company_id = null;
  Company.findOne({
    _id: companyId
  }, function(err, company) {
    if (err || !company) {
      console.log('不存在公司');
      return res.status(404).send('不存在该公司');
    }
    var invite_key = encodeURIComponent(company.invite_key).replace(/'/g,"%27").replace(/"/g,"%22");
    var inviteUrl = 'http://'+req.headers.host+'/users/invite?key='+invite_key+'&cid=' + companyId;
    
    var renderData = {
      title: '邀请链接',
      inviteLink: inviteUrl,
      companyId: companyId,
      defaultDomain: company.email.domain[0]
    };

    if (isMobile(req)) {
      res.render('company/validate/mobile_invite', renderData);
    }
    else {
      res.render('company/validate/invite', renderData);
    }
  });

};
exports.addDomain = function(req, res) {
  Company.findOne({
    _id: req.body.companyId
  }, function(err, company) {
    if (err || !company) {
      console.log('不存在公司');
      return res.send({
        'result': 0,
        'msg': ' 不存在该公司'
      });
    }
    if (company.email.domain.indexOf(req.body.domain) > -1) {
      return res.send({
        'result': 0,
        'msg': '  该后缀已经存在'
      });
    }
    company.email.domain.push(req.body.domain);
    company.save(function(err) {
      if (!err) {
        return res.send({
          'result': 1,
          'msg': ' 邮箱后缀添加成功'
        });
      } else {
        return res.send({
          'result': 0,
          'msg': ' 邮箱后缀添加失败'
        });
      }
    })
  });
}
//配合路由渲染增加小队列表Todo
exports.add_company_group = function(req, res) {
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
exports.renderMembers = function(req, res) {
  if (req.role === 'GUESTHR' || req.role === 'GUEST') {
    res.status(403);
    next('forbidden');
    return;
  }
  res.render('company/member_list', {
    'role': req.role,
    'provider': 'company'
  });
}

//注意,companyGroup,entity这两个模型的数据不一定要同时保存,异步进行也可以,只要最终确保
//数据都存入两个模型即可
exports.groupSelect = function(req, res) {

  if (req.session.selected != undefined && req.session.selected != null) {
    return res.send('already selected!');
  } else {
    req.session.selected = true;
  }

  var selected_groups = req.body.selected_groups;
  if (selected_groups === undefined) {
    return res.redirect('/company/signup');
  }

  Company.findOne({
    _id: req.session.company_id
  }, function(err, company) {
    if (company) {
      if (err) {
        console.log('不存在公司');
        return;
      }

      for (var i = 0, length = selected_groups.length; i < length; i++) {
        var tname = company.info.official_name + '-' + selected_groups[i].group_type + '队'; //默认的小队名


        var companyGroup = new CompanyGroup();

        companyGroup.cid = req.session.company_id;
        companyGroup.cname = company.info.name;
        companyGroup.gid = selected_groups[i]._id;
        companyGroup.group_type = selected_groups[i].group_type;
        // companyGroup.entity_type = selected_groups[i].entity_type;
        companyGroup.name = tname;
        companyGroup.logo = '/img/icons/group/' + selected_groups[i].entity_type.toLowerCase() + '_on.png';

        companyGroup.save(function(err) {
          if (err) {
            console.log(err);
          } else {;
          }
        });

        company.team.push({
          'gid': selected_groups[i]._id,
          'group_type': selected_groups[i].group_type,
          'name': tname,
          'id': companyGroup._id
        });
        // var Entity = mongoose.model(companyGroup.entity_type); //将增强组件模型引进来
        // var entity = new Entity();

        // //增强组件目前只能存放这三个字段
        // entity.tid = companyGroup._id; //小队id
        // entity.cid = req.session.company_id; //公司id
        // entity.gid = selected_groups[i]._id; //组件类型id

        // entity.save(function(err) {
        //   if (err) {
        //     console.log(err);
        //   }
        // });
      }

      company.save(function(s_err) {
        if (req.session.selected != undefined && req.session.selected != null) {
          delete req.session.selected;
        }
        if (s_err) {
          return res.send('err');
        }
      });
      res.send({
        'result': 1,
        'msg': '组件选择成功！'
      });
    } else {
      return res.send('err');
    }
  });
};
//HR增加小队
exports.saveGroup = function(req, res) {
  var selected_group = req.body.selected_group;
  if (selected_group === undefined) {
    return res.redirect('/company/add_group');
  }
  var companyId = req.params.companyId;
  Company.findOne({
    _id: companyId
  }, function(err, company) {
    if (company) {
      if (err) {
        console.log('不存在公司');
        return;
      }

      var companyGroup = new CompanyGroup();

      companyGroup.cid = companyId;
      companyGroup.cname = company.info.name;
      companyGroup.gid = selected_group._id;
      companyGroup.group_type = selected_group.group_type;
      // companyGroup.entity_type = selected_group.entity_type;
      companyGroup.name = req.body.tname;
      companyGroup.logo = '/img/icons/group/' + selected_group.entity_type.toLowerCase() + '_on.png';
      companyGroup.city = company.info.city;
      companyGroup.save(function(err) {
        if (err) {
          console.log(err);
        } else {;
        }
      });

      company.team.push({
        'gid': selected_group._id,
        'group_type': selected_group.group_type,
        'name': req.body.tname,
        'id': companyGroup._id
      });
      // var Entity = mongoose.model(companyGroup.entity_type); //将增强组件模型引进来
      // var entity = new Entity();

      // //增强组件目前只能存放这三个字段
      // entity.tid = companyGroup._id; //小队id
      // entity.cid = companyId; //组件类型id
      // entity.gid = selected_group._id; //公司id

      // entity.save(function(err) {
      //   if (err) {
      //     console.log(err);
      //   }
      // });

      company.save(function(s_err) {
        if (s_err) {
          console.log(s_err);
        }
      });
      res.send({
        'result': 1,
        'msg': '组件添加成功！'
      });
    } else {
      return res.send('err');
    }
  });
};

exports.validate = function(req, res) {

  var key = req.query.key;
  var _id = req.query.id;
  Company.findOne({
      _id: _id
    },
    function(err, user) {
      if (user) {
        if (!user.status.active) {
          if (encrypt.encrypt(_id, config.SECRET) === key) {
            var time_limit = config.COMPANY_VALIDATE_TIMELIMIT;
            if (parseInt(new Date().getTime()) - parseInt(user.status.date) > time_limit) {
              res.render('company/company_validate_error', {
                title: '验证失败',
                message: '注册链接已经过期!'
              });
            } else {
              req.session.company_id = _id;
              user.save(function(err) {
                if (err) {
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
//快速注册进入验证，已经填好公司信息和个人信息，只需要将两者激活
exports.quickvalidate = function(req, res) {

  var key = req.query.key;
  var _id = req.query.id;
  Company.findOne({
      _id: _id
    },
    function(err, company) {
      if (company) {
        if (!company.status.active) {
          if (encrypt.encrypt(_id, config.SECRET) === key) {
            company.acitve = true;
            company.mail_active = true;
            if(!company.invite_qrcode){
              var qrDir = '/img/qrcode/companyinvite/';
              var fileName = company._id.toString()+'.png';
              var inviteUrl = req.headers.host+'/users/invite?key='+company.invite_key+'&cid=' + company._id;

              company.invite_qrcode = qrcodeService(qrDir, fileName, inviteUrl);
            }
            company.save(function(err) {
              if (err) {
                res.render('company/company_validate_error', {
                  title: '验证失败',
                  message: '未知错误!'
                });
              } else {
                User.findOne({username:company.info.email}).exec(function (user) {
                  if(user){
                    user.acitve = true;
                    user.mail_active = true;
                    user.save(function (err) {
                      if(!err){
                        Config.findOne({ name: config.CONFIG_NAME }, function (err, config) {
                          if (err || !config || !config.smtp || config.smtp === 'webpower') {
                            webpower.sendInviteColleageMail(company.email, company.invite_key, company._id.toString(), company.invite_qrcode, req.headers.host, function(err) {
                              if (err) {
                                // TO DO: 发送失败待处理
                                console.log(err);
                              }
                            });
                          } else if (config.smtp === '163') {
                            mail.sendInviteColleageMail(company.email, company.invite_key, company._id.toString(), company.invite_qrcode, req.headers.host);
                          } else if (config.smtp === 'sendcloud') {
                            sendcloud.sendInviteColleageMail(company.email, company.invite_key, company._id.toString(), company.invite_qrcode, req.headers.host);
                          }
                        });
                        res.render('/company/validate/active_success');
                      }
                      else{
                        res.render('company/company_validate_error', {
                          title: '验证失败',
                          message: '未知错误!'
                        });
                      }
                    })
                  }
                  else{
                    res.render('company/company_validate_error', {
                      title: '验证失败',
                      message: '该公司激活成功，但对应的个人不存在!'
                    });
                  }
                })
                .then(null,function (err) {
                  res.render('company/company_validate_error', {
                    title: '验证失败',
                    message: '未知错误!'
                  });
                })
                
              }
            });
          } else {
            res.render('company/company_validate_error', {
              title: '验证失败',
              message: '验证码不正确!'
            });
          }
        } else {
          res.render('company/company_validate_error', {
            title: '验证失败',
            message: '您的公司已经激活!'
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

///邀请码唯一性
exports.codeCheck = function(req, res) {
  CompanyRegisterInviteCode.findOne({
    'code': req.body.invite_code
  }, function(err, code) {
    if (err || !code) {
      res.send(false);
    } else {
      if (code.status === 'active') {
        res.send(true);
      } else {
        res.send(false);
      }
    }
  });
}

///防止邮箱重复注册
exports.mailCheck = function(req, res) {
  Company.findOne({
    'login_email': req.body.login_email
  }, function(err, company) {
    if (err || company) {
      res.send(true);
    } else {
      res.send(false);
    }
  });
}
//企业官方名验证
exports.officialNameCheck = function(req, res) {
  var name = req.body.name;
  Company.findOne({
    'info.name': name,
    'status.active':true
  }, function(err, company) {
    if (err || company) {
      var domain = false;
      if(req.body.domain && company.email.domain.indexOf(req.body.domain)>-1) {domain = true;}
      res.send({result: 1, cid:company._id, domain: domain});
    } else {
      res.send({result:0});
    }
  });
}
//企业用户名验证
exports.usernameCheck = function(req, res) {
  var username = req.body.username;
  Company.findOne({
    'username': username
  }, function(err, company) {
    if (err || company) {
      res.send(true);
    } else {
      res.send(false);
    }
  });
}

/**
 * 创建公司基本信息
 */
exports.create = function(req, res) {
  var invite_switch = false;
  Config.findOne({name: config.CONFIG_NAME})
  .exec()
  .then(function(config) {
    if (config && config.company_register_need_invite === true) {
      invite_switch = true;
      return CompanyRegisterInviteCode.findOne({
        code: req.body.invite_code,
        status: 'active'
      })
      .populate('company')
      .exec()
      .then(function(code) {
        if (code) {
          if (code.status === 'active') {
            // 如果邀请码属于公司，则在公司邀请码列表中将其移除
            if (code.company) {
              var company = code.company;
              var removeIndex = company.register_invite_code.indexOf(code.code);
              company.register_invite_code.splice(removeIndex, 1);
              company.save(console.log);
            }
            code.status = 'used';
            code.save(function(err) {
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
            return res.status(400).send({
              'result': 0,
              'msg': '该邀请码已经被使用!'
            });
          }
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
    company.info.email = req.body.email;
    company.provider = 'company';
    company.login_email = req.body.email;
    //生成随机邀请码
    company.invite_key = tools.randomAlphaNumeric(8);
    var _email = req.body.email.split('@');
    if (_email[1])
      company.email.domain.push(_email[1]);
    else
      return res.status(400).send({
        'result': 0,
        'msg': '您输入的邮箱不正确'
      });

    // 为该公司添加3个注册邀请码
    company.register_invite_code = [];
    var code_count = 0;

    async.whilst(
      function() {
        return code_count < 3;
      },

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
        //company.status.date = new Date().getTime();

        company.save(function(err) {
          if (err) {
            console.log(err);
            //检查信息是否重复
            switch (err.code) {
              case 11000:
                return res.status(400).send({
                  'result': 0,
                  'msg': '该公司已经存在!'
                });
                break;
              case 11001:
                return res.status(400).send({
                  'result': 0,
                  'msg': '该邮箱已经存在!'
                });
                break;
              default:
                break;
            }
            return res.render('signup/company_signup', {
              company: company
            });
          }
          //如果开了邀请码,必须在对应的邀请码里记录使用该邀请码的公司的信息
          if (invite_switch) {
            CompanyRegisterInviteCode.update({
              'code': req.body.invite_code
            }, {
              '$set': {
                'use_by_company': {
                  '_id': company._id,
                  'name': company.info.name,
                  'email': company.login_email
                }
              }
            }, function(err, code) {
              if (!code || err) {
                return res.status(400).send({
                  'result': 0,
                  'msg': '邀请码修改异常!'
                });
              } else {
                res.redirect('/company/wait');
              }
            })
          } else {
            res.redirect('/company/wait');
          }
          //注意,日期保存和发邮件是同步的,也要放到后台管理里去,这里只是测试需要
          //mail.sendCompanyActiveMail(company.login_email,company.info.name,company._id.toString(),req.headers.host);
        });
      }
    );
  })
  .then(null, function(err) {
    console.log(err);
    res.render('signup/company_signup', {
      invite_code_err: '邀请码不正确'
    });
  });
};

/**
 * 快速注册
 * req.body: {
 *   name: String,      //公司名
 *   password: String,  //密码
 *   email: String,     //邮箱
 *   province: String,  //省
 *   city: String,      //市
 *   district: String,  //区
 *   groups: array      //要建的小队
 * }
 */
exports.quickCreate =function(req, res) {
  var email = req.body.email;
  //再次验证，此邮箱未注册过的才能注册
  Company.findOne({login_email:email})
  .exec()
  .then(function(company) {
    if(company) {
      return res.status(400).send({msg:'此邮箱已注册'});
    }
    else {
      //创建company
      return Company.create({
        username: email,
        login_email: email,
        password: req.body.password
      })
    }
  })
  .then(function(company) {
    //补充company的资料
    if(company) {
      company.status= {
        mail_active :false,
        active: false,
        verification: 1
      };
      company.info.name = req.body.name;
      company.info.official_name = req.body.name;
      company.info.city.province = req.body.province;
      company.info.city.city = req.body.city;
      company.info.city.district = req.body.district;
      company.info.email = email;
      company.info.membernumber = 1;
      company.email = {domain: email.split('@')[1]};

      async.waterfall([
        //创建用户
        function(w_callback) {
          User.create({
            username: email,
            password: req.body.password,
            nickname: email.split('@')[0],
            email: email,
            role: 'EMPLOYEE',
            cid: company._id,
            cname: req.body.name,
            company_official_name: req.body.name
          }, function(err, user) {
            if(err) {
              w_callback(err);
            }
            else {
              w_callback(null,user);
            }
          });
        },
        //创建队长为此用户的小队
        function(user, w_callback) {
          var groups = req.body.groups;
          if(groups.length) {
            async.map(groups,function(group, m_callback) {
              CompanyGroup.create({
                cid: company._id,
                gid: group._id,
                poster: {role:'HR'},
                group_type: group.group_type,
                cname: req.body.name,
                name: req.body.name+'-'+group.group_type+'队',
                entity_type: group.entity_type,
                city: {
                  province: req.body.province,
                  city: req.body.city,
                  district: req.body.district
                },
                member:[{
                  _id: user._id,
                  nickname: user.nickname,
                  photo: user.photo,
                }],
                leader:[{
                  _id: user._id,
                  nickname: user.nickname,
                  photo: user.photo,
                }]
              }, function(err, team) {
                if(err) {
                  m_callback(err);
                }
                else {
                  m_callback(null, team);
                }
              })
            }, function(err,teams) {
              if(err) {
                w_callback(err);
              }
              else {
                w_callback(null, {user: user, teams:teams});
              }
            })
          }
          else {
            w_callback(null,null);
          }
        },
        /**
         * 把人加到小队并变成队长,并把小队加到公司
         * @param  {Object} data : {user:Object, teams:array}
         * @param  {[type]} w_callback [description]
         */
        function(data, w_callback) {
          var user = data.user;
          var teams = data.teams;
          user.team = [];
          company.team = [];
          for(var i=0; i<teams.length; i++) {
            user.team.push({
              gid: teams[i].gid,
              _id: teams[i]._id,
              group_type: teams[i].group_type,
              entity_type: teams[i].entity_type,
              name: teams[i].name,
              leader: true,
              logo: teams[i].logo
            });
            company.team.push({
              gid : teams[i].gid,
              group_type: teams[i].group_type,
              name: teams[i].name,
              id: teams[i]._id
            })
          }
          user.save(function(err) {
            if(err) {
              w_callback(err);
            }
            else {
              w_callback(null);
            }
          })
        }
      ],
      function(err,results) {
        if(err) {
          console.log(err);
          return res.status(500).send({msg:'服务器错误'});
        }
        Config.findOne({ name: config.CONFIG_NAME }, function (err, config) {
          if (err || !config || !config.smtp || config.smtp === 'webpower') {
            webpower.sendQuickRegisterActiveMail(email, req.body.name, company._id.toString(), req.headers.host, function(err) {
              if (err) {
                // TO DO: 发送失败待处理
                console.log(err);
              }
            });
          } else if (config.smtp === '163') {
            mail.sendQuickRegisterActiveMail(email, req.body.name, company._id.toString(), req.headers.host);
          } else if (config.smtp === 'sendcloud') {
            sendcloud.sendQuickRegisterActiveMail(email, req.body.name, company._id.toString(), req.headers.host);
          }
        });
        
        return res.status(200).send({msg:'注册成功'});
      })
    }
  })
  .then(null, function(err) {
    console.log(err);
    return res.status(500).send({msg:'服务器错误'});
  });
}

/**
 * 快速注册 - 创建公司和用户
 * req.body: {
 *   name: String,      //公司名
 *   password: String,  //密码
 *   email: String,     //邮箱
 *   province: String,  //省
 *   city: String,      //市
 *   district: String  //区
 * }
 */
exports.quickCreateUserAndCompany = function(req, res, next) {
  var sendInvalidMsg = function(msg) {
    res.status(400).send({msg: msg});
  };

  var email = req.body.email;
  if (!validator.isEmail(email)) {
    return sendInvalidMsg('请填写有效的Email');
  }

  if (req.password) {
    if (!validator.isAlphanumeric(req.password)) {
      return sendInvalidMsg('密码长度不可以小于6个字符');
    }
    if (req.password.length < 6) {
      return sendInvalidMsg('密码长度不可以小于6个字符');
    }
    if (req.password.length > 20) {
      return sendInvalidMsg('密码长度不可以超过20个字符');
    }
  }
  else {
    return sendInvalidMsg('请填写密码');
  }

  // 采取抛出异常的方式中断Promise链
  var BreakError = function(msg) {
    Error.call(this, msg);
  };
  BreakError.prototype = Object.create(Error.prototype);

  Company.findOne({login_email: email}, {_id: 1}).exec()
    .then(function(company) {
      if (company) {
        sendInvalidMsg('此邮箱已注册');
        throw new BreakError();
      }

      var newCompany = new Company({
        username: email,
        login_email: email,
        password: req.body.password,
        status: {
          mail_active :false,
          active: false,
          verification: 1
        },
        info: {
          name: req.body.name,
          official_name: req.body.name,
          city: {
            province: req.body.province,
            city: req.body.city,
            district: req.body.district
          },
          email: email,
          membernumber: 1
        },
        email: {
          domain: email.split('@')[1]
        }
      });

      return Company.create(newCompany);
    })
    .then(function(company) {
      // 创建完公司，开始创建用户
      return User.create({
        username: email,
        password: req.body.password,
        nickname: email.split('@')[0],
        email: email,
        role: 'EMPLOYEE',
        cid: company._id,
        cname: req.body.name,
        company_official_name: req.body.name
      });
    })
    .then(function(user) {
      // TODO 再返回一个登录标记，以便下一步
      res.send({
        msg: '注册成功'
      });
    })
    .then(null, function(err) {
      if (!err instanceof BreakError) {
        next(err);
      }
    });

};

/**
 * 快速注册 - 创建小队
 * req.body:
 *   
 */
exports.quickCreateTeams = function(req, res, next) {



};


/**
 * 验证通过后创建公司进一步的信息(用户名\密码等)
 */
exports.createDetail = function(req, res) {

  if (req.user) {
    req.logout();
    res.locals.global_user = null;
  }

  Company.findOne({
    _id: req.session.company_id
  }, function(err, company) {
    if (!company || err) {
      console.log(req.session.company_id, company);
      res.render('company/validate/create_detail', {
        tittle: '该公司不存在或者发生错误!'
      });
    } else {
      company.info.official_name = req.body.official_name;
      company.username = req.body.username;
      company.password = req.body.password;
      company.status.active = true;
      company.status.mail_active = true;
      company.info.industry = {
        child_industry: {
          _id: req.body.child_industry._id,
          name: req.body.child_industry.name
        },
        parent_industry: req.body.parent_industry
      };
      company.save(function(err) {
        if (err) {
          res.send({
            'result': 0,
            'msg': '创建失败！'
          });
        } else {
          res.send({
            'result': 1,
            'msg': '创建成功！'
          });
        }
      });
    }
  });
};



exports.home = function(req, res) {
  var render = function(company) {
    return res.render('company/home', {
      title: company.info.official_name,
      cid: company._id,
      logo: company.info.logo,
      cname: company.info.name,
      official_name: company.info.official_name,
      sign: company.info.brief,
      groupnumber: company.team ? company.team.length : 0,
      membernumber: company.info.membernumber,
      role: req.role
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
    return render(req.company);
  }

};

exports.Info = function(req, res) {
  res.render('company/company_info', {
    title: '企业信息管理',
    role: req.role
  });  
};

exports.saveGroupInfo = function(req, res) {
  if (req.role !== 'HR' && req.role !== 'LEADER') {
    res.status(403);
    next('forbidden');
    return;
  }
  CompanyGroup.findOne({
    '_id': req.body.tid
  }, function(err, companyGroup) {
    if (err) {
      console.log('数据错误');
      res.send({
        'result': 0,
        'msg': '数据查询错误'
      });
      return;
    }
    if (companyGroup) {
      if (req.body.tname !== companyGroup.name) {
        companyGroup.name = req.body.tname;
        companyGroup.save(function(s_err) {
          if (s_err) {
            console.log(s_err);
            res.send({
              'result': 0,
              'msg': '数据保存错误'
            });
            return;
          }
          schedule.updateTname(req.body.tid);
          res.send({
            'result': 1,
            'msg': '更新成功'
          });
        });
      } else {
        res.send({
          'result': 0,
          'msg': '您没进行修改'
        });
      }
    } else {
      res.send({
        'result': 0,
        'msg': '不存在小队！'
      });
    }
  });
};

exports.getAccount = function(req, res, next) {
  var companyId = req.params.companyId;
  Company.findOne({
    '_id': companyId
  }, function(err, _company) {
    if (err) {
      console.log(err);
    }
    if (_company) {
      var _account = {
        'login_email': _company.login_email,
        'register_date': _company.register_date,
        'domain': _company.email.domain
      };
      if (req.role === 'HR') {
        if(!_company.invite_key){
          _company.invite_key = tools.randomAlphaNumeric(8);
          _company.save(function(err){
            if(err){
              console.log(err);
              res.status(500);
              next();
            }
          });
        }
        var invite_key = encodeURIComponent(_company.invite_key).replace(/'/g,"%27").replace(/"/g,"%22");
        _account.inviteUrl = 'http://' + req.headers.host + '/users/invite?key=' + invite_key + '&cid=' + companyId;
        _account.inviteCode = _company.invite_key;
      }
      return res.send({
        'result': 1,
        'company': _account,
        'info': _company.info,
        'team': _company.team,
        'role': req.role
      });
    } else
      return res.send({
        'result': 0,
        'msg': '数据查询失败！'
      });
  });
};

exports.saveAccount = function(req, res) {
  if (req.role !== 'HR') {
    res.status(403);
    next('forbidden');
    return;
  }
  var _company = {
    email: {
      domain: req.body.domain
    },
    info: req.body.info
  };
  // 保存公司资料，返回之前的公司资料（new为false）
  Company.findOneAndUpdate({
    '_id': req.user._id
  }, _company, {
    new: false
  }, function(err, company) {
    if (err) {
      console.log('数据错误');
      res.send({
        'result': 0,
        'msg': '数据查询错误'
      });
      return;
    }
    if (company) {
      if (req.body.info !== undefined && company.info.name !== _company.info.name) {
        schedule.updateCname(req.user._id);
      }
      CompanyGroup.update({'cid':company._id},{$set:{city:req.body.info.city}},{multi:true},function(err,number){
        if(err){
          console.log(err);
        }else{
          console.log('小队地址更新数:',number);
        }
      });
      res.send({
        'result': 1,
        'msg': '更新成功'
      });
    } else {
      res.send({
        'result': 0,
        'msg': '不存在该公司'
      });
    }
  });
};


exports.getCompanyDepartments = function(req, res, next) {
  if (req.params.type !== 'department') {
    return next();
  }
  if (!req.company) {
    return next('req.company is undefined');
  }
  Department
    .find({
      'company._id': req.company._id
    })
    .exec()
    .then(function(departments) {
      var departmentList = [];
      for (var i = 0; i < departments.length; i++) {
        departmentList.push({
          _id: departments[i]._id,
          tid: departments[i].team
        });
      }
      req.departments = departmentList;
      next();
    })
    .then(null, function(err) {
      console.log(err);
      next(err);
    });
};

//返回公司小队的所有数据,待前台调用
exports.getCompanyTeamsInfo = function(req, res) {

  var option = {},
    selectOption = {};
  switch (req.params.type) {
    case 'team':
      option = {
        cid: req.params.companyId,
        gid: {
          '$ne': '0'
        }
      };
      break;
    case 'department':
      option = {
        cid: req.params.companyId,
        gid: '0'
      };
      break;
    default:
      return res.send(400);
  }

  if (req.role !== 'HR') {
    option.active = true;
    selectOption = {
      'logo': 1,
      'name': 1,
      'leader': 1,
      'member': 1,
      'count': 1,
      'active': 1
    }
  }
  var output = {
    'cid': req.params.companyId,
    'role': req.role
  };
  if (req.role === 'EMPLOYEE') {
    cache.createCache("EmpTeamInfo"); //是否存在EmpTeamInfo，否则Create
    if (cache.get("EmpTeamInfo", req.params.companyId)) { //查询有没有，有的话数据拿出来
      output.teams = cache.get("EmpTeamInfo", req.params.companyId);
      output.teams.forEach(function(_team){
        if (model_helper.arrayObjectIndexOf(req.user.team, _team._id, '_id') > -1) {
          _team.belong = true;
        } else {
          _team.belong = false;
        }
      });
      return res.send(output);
    }
  } else if (req.role !== "HR") {
    cache.createCache("GstTeamInfo"); //是否存在GstTeamInfo，否则Create
    if (cache.get("GstTeamInfo", req.params.companyId)) { //查询有没有，有的话数据拿出来
      output.teams = cache.get("GstTeamInfo", req.params.companyId);
      return res.send(output);
    }
  }
  //HR就不作缓存了撒～
  //若是没有缓存，就继续查
  CompanyGroup
    .find(option, selectOption)
    .sort({
      'score.total': -1
    })
    .exec()
    .then(function(teams) {

      if (req.role === 'EMPLOYEE') {
        async.map(teams, function(team, allcallback) {
          async.waterfall([

            function(callback) {
              //campaigninfo
              var campaigninfo = {};
              Campaign.find({
                'team': team._id
              })
                .sort({
                  'create_time': -1
                })
                .limit(1)
                .exec()
                .then(function(campaign) {
                  //todo
                  //console.log(campaign[0]);
                  if (campaign.length == 0) {
                    campaigninfo.campaign_theme = '';
                    campaigninfo.campaign_id = '';
                    campaigninfo.start_time = '';
                  } else {
                    campaigninfo.campaign_theme = campaign[0].theme;
                    campaigninfo.campaign_id = campaign[0]._id;
                    campaigninfo.start_time = campaign[0].start_time;
                  }
                  callback(null, campaigninfo);
                });
            },
            function(teaminfo, callback) {
              var did;
              if (req.params.type === 'department') {
                for (var k = 0; k < req.departments.length; k++) {
                  if (team._id.toString() === req.departments[k].tid.toString()) {
                    did = req.departments[k]._id;
                    break;
                  }
                }
              }
              var _team = {
                '_id': team._id,
                'gid': team.gid,
                'did': did,
                'group_type': team.group_type,
                'logo': team.logo,
                'active': team.active,
                'count': team.count,
                // 'entity_type': team.entity_type,
                'leader': team.leader,
                'member': team.member,
                'name': team.name,
                'campaign_theme': teaminfo.campaign_theme,
                'campaign_id': teaminfo.campaign_id,
                'campaign_start_time': teaminfo.start_time,
                // 'photos': photos,
                // 'photo_list': teaminfo.start_time,
                //more 为 true 可以展开
                'more': team.member.length > 7 ? true : false,
                //初始状态为收起
                'collapse': false
              };
              team.did = did;
              team.set('did', did, {
                strict: false
              });
              allcallback(null, _team);
              //最新图片不要了 2015.4.21 -M
              // photo_album_controller.getNewPhotos(team._id, 2, function(photos) { //给每个小队增加最新图片
                
              // });
            }
          ]);
        }, function(err, results) {
          if (err) {
            return res.send({
              'result': 0,
              'msg': 'FAILURED'
            });
          } else {
            cache.set("EmpTeamInfo", req.params.companyId, results, 1000 * 60 * 5);
            //标记是否是某队成员
            output.teams = results;
            output.teams.forEach(function(_team){
              if (model_helper.arrayObjectIndexOf(req.user.team, _team._id, '_id') > -1) {
                _team.belong = true;
              } else {
                _team.belong = false;
              }
            });
            return res.send(output);
          }
        });
      } else if (req.role !== 'HR') { //访客
        output.teams = teams;
        cache.set("GstTeamInfo", req.params.companyId, teams, 1000 * 60 * 5);
        return res.send(output);
      } else { //是hr
        if (req.params.type === 'department') {
          var formatTeams = [];
          var departmentLength = req.departments.length;
          var department = req.departments;
          teams.forEach(function(_team) {
            var _temp = {
              'logo': _team.logo,
              'name': _team.name,
              'leader': _team.leader,
              'memberLength': _team.member.length,
              'count': _team.count,
              'active': _team.active
            }
            for (var k = 0; k < departmentLength; k++) {
              if (_team._id.toString() === department[k].tid.toString()) {
                _temp.did = department[k]._id;
                break;
              }
            }
            formatTeams.push(_temp);
          });
          return res.send({
            'cid': req.params.companyId,
            'role': req.role,
            'teams': formatTeams
          });
        } else {
          return res.send({
            'cid': req.params.companyId,
            'role': req.role,
            'teams': teams
          });
        }
      }
    });
};
exports.timeLine = function(req, res) {
  var companyId = req.params.companyId;
  cache.createCache("timeline");
  if (cache.get("timeline", companyId)) {
    return res.render('partials/timeLine', cache.get("timeline", companyId));
  }
  Campaign
    .find({
      'active': true,
      'finish': true,
      'cid': req.params.companyId
    })
    .sort('-start_time')
    .populate('photo_album')
    .exec()
    .then(function(campaigns) {
      // todo new time style
      var newTimeLines = [];
      // todo new time style
      campaigns.forEach(function(campaign) {
        var _logo;
        // var ct = campaign.campaign_type;
        
        //公司活动
        // if(ct===1){
        //   // _head = '公司活动';
        //   _logo = campaign.campaign_unit[0].company.logo;
        // }
        // //多队
        // else if(ct!==6&&ct!==2){
        //   // _head = campaign.team[0].name +'对' + campaign.team[1].name +'的比赛';
        //   for(var i = 0;i<campaign.campaign_unit.length;i++){
        //     var index = model_helper.arrayObjectIndexOf(campaign.campaign_unit[i].company,companyId,'_id');
        //     if(index>-1)
        //       _logo = campaign.campaign_unit[i].team.logo;
        //   }
        // }
        //单队
        // else {
        //   // _head = campaign.compaign_unit.team.name + '活动';
        //   _logo = campaign.campaign_unit[0].team.logo;
        // }
        var tempObj = {
            id: campaign._id,
            //head: _head,
            head: campaign.theme,
            // logo: _logo,
            campaignUnit: campaign.campaign_unit,
            campaignType: campaign.campaign_type,
            content: campaign.content,
            location: campaign.location.name,
            startTime: campaign.start_time,
            // provoke: ct===4||ct===5||ct===7||ct===9,
            year: getYear(campaign),
            memberNumber: campaign.members.length
            // photo_list: photo_album_controller.getLatestPhotos(campaign.photo_album, 6)
          }

        function getYear(dates) {
          var response = String(dates.end_time);
          var _ = response.split(" ");
          var year = _[3]
          return year;
        }
        var groupYear = getYear(campaign);
        if (newTimeLines.length == 0 || newTimeLines[newTimeLines.length - 1][0].year != groupYear) {
          newTimeLines.push([]);
          newTimeLines[newTimeLines.length - 1].push(tempObj);
        } else {
          var i = newTimeLines.length - 1;
          newTimeLines[i].push(tempObj);
        }
      });
      var output = {
        'newTimeLines': newTimeLines,
        'length': campaigns.length,
        'moment': moment
      };
      cache.set("timeline", companyId, output, 1000 * 60 * 30); //半小时
      return res.render('partials/timeLine', output);
    })
    .then(null, function(err) {
      console.log(err);
      return res.send({
        result: 0,
        msg: '查询错误'
      });
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
      req.company = company;
      next();
    });
};
exports.renderCompanyCampaign = function(req, res) {
  res.render('partials/campaign_list', {
    'provider': 'company'
  });
}

exports.changeUser = function(req, res) {
  if (req.role != 'HR') {
    res.status(403);
    next('forbidden');
    return;
  }
  var _user = req.body.user;
  var operate = req.body.operate;

  switch (operate) {
    case 'change':
      User.findOne({
        '_id': _user._id
      }, function(err, user) {
        if (err || !user) {
          return res.send('ERROR');
        } else {
          var changeFlag = user.nickname != _user.nickname;
          user.nickname = _user.nickname;
          user.department = req.body.department;
          user.position = _user.position;
          user.save(function(err) {
            if (err) {
              return res.send({
                'result': 0,
                'msg': '用户信息修改失败！'
              });
            } else {
              if (changeFlag) {
                schedule.updateUname(user._id);
              }
              return res.send({
                'result': 1,
                'msg': '用户信息修改成功！'
              });
            }
          });
        }
      });
      break;
    case 'delete':
      User.remove({
        '_id': _user._id
      }, function(err, user) {
        if (err || !user) {
          return res.send('ERROR');
        } else {
          return res.send('OK');
        }
      });
      break;
    case 'close':
      User.findOne({
        '_id': _user._id
      }, {
        'active': 1
      }, function(err, user) {
        if (err || !user) {
          return res.send('ERROR');
        } else {
          user.active = false;
          console.log(user);
          user.save(function(err) {
            if (err) {
              return res.send({
                'result': 0,
                'msg': '用户信息修改失败！'
              });
            } else {
              console.log('cg!');
              return res.send({
                'result': 1,
                'msg': '用户信息修改成功！'
              });
            }
          });
        }
      });
      break;
    case 'open':
      User.findOne({
        '_id': _user._id
      }, {
        'active': 1
      }, function(err, user) {
        if (err || !user) {
          return res.send('ERROR');
        } else {
          user.active = true;
          user.save(function(err) {
            if (err) {
              return res.send({
                'result': 0,
                'msg': '用户信息修改失败！'
              });
            } else {
              return res.send({
                'result': 1,
                'msg': '用户信息修改成功！'
              });
            }
          });
        }
      });
      break;
    default:
      break;
  }
};

//任命/罢免队长
exports.appointLeader = function(req, res) {
  if (req.role !== 'HR') {
    res.status(403);
    next('forbidden');
    return;
  }
  var user = req.body.user;
  var tid = req.body.tid;
  var operate = req.body.operate;
  var wait_for_join = req.body.wait_for_join;

  CompanyGroup.findOne({
    _id: tid
  }, function(err, company_group) {
    if (err || !company_group) {
      console.log(err);
      return res.send(500, {
        'msg': '小组未找到!'
      });
    } else {
      if (operate) {
        if (wait_for_join) {
          company_group.member.push({
            '_id': user._id,
            'nickname': user.nickname,
            'photo': user.photo
          });
        }
        company_group.leader.push({
          '_id': user._id,
          'nickname': user.nickname,
          'photo': user.photo
        });
      } else {
        for (var i = 0; i < company_group.leader.length; i++) {
          if (company_group.leader[i]._id.toString() === user._id.toString()) {
            company_group.leader.splice(i, 1);
            break;
          }
        }
      }
      company_group.save(function(err) {
        if (err) {
          console.log('小组保存错误', err);
          //这里需要回滚User的操作
          return res.send(500, {
            'msg': '小组保存出错!'
          });
        } else {
          User.findOne({
            _id: user._id
          }, function(err, user) {
            if (err || !user) {
              return res.send('ERROR');
            } else {
              //他已经有这个小队了
              if (!wait_for_join) {
                var l = false; //标识他是不是这个队的队长
                var ol = false; // 标识是不是其它队的队长
                var ok = false; //提高效率用
                //这段代码性能很低,但是需要
                for (var i = 0; i < user.team.length; i++) {
                  if (user.team[i]._id.toString() == tid.toString()) {
                    user.team[i].leader = operate;
                    l = user.team[i].leader;
                    if (ol)
                      break; //ol已标记过
                    ok = true;
                  } else if (user.team[i].leader === true) {
                    ol = true;
                    if (ok)
                      break;
                  }
                }
                if (!ol)
                  user.role = l ? 'LEADER' : 'EMPLOYEE';
                //他还没有加入这个小队
              } else {
                user.team.push({
                  gid: company_group.gid,
                  _id: company_group._id,
                  group_type: company_group.group_type,
                  // entity_type: company_group.entity_type,
                  name: company_group.name,
                  leader: true,
                  logo: company_group.logo
                });
              }
              user.save(function(err) {
                if (err) {
                  console.log('用户保存错误:', err);
                  return res.send(500, {
                    'msg': '用户保存出错!'
                  });
                } else {
                  return res.send(200, {
                    'msg': '任命组长成功!'
                  });
                }
              });
            }
          });
        }
      });
    }
  });
};

//获取公司活动的Tags
exports.getTags = function (req,res) {
  Campaign.aggregate()
  .project({"tags":1,"campaign_type":1,"cid":1})
  .match({$and: [
    {'cid' : mongoose.Types.ObjectId(req.params.companyId)},
    {'campaign_type':1}
    ]})//可在查询条件中加入时间
  .unwind("tags")
  .group({_id : "$tags", number: { $sum : 1} })
  .sort({number:-1})
  .limit(10)
  .exec(function(err,result){
      if (err) {
        console.log(err);
      }
      else{
        // console.log(result);
        return res.send(result);
      }
  });
};
//HR发布一个活动(可能是多个企业)
exports.sponsor = function(req, res, next) {
  var allow = auth(req.user, {
    companies: [req.params.companyId],
  }, [
    'sponsorCampaign'
  ]);
  if(!allow.sponsorCampaign){
    res.status(403);
    next('forbidden');
    return;
  }
  var cname = req.user.info.official_name;
  var cid = req.user._id.toString(); //公司id

  var company_in_campaign = req.body.company_in_campaign; //公司id数组,HR可以发布多个公司一起的的联谊或者约战活动,注意:第一个公司默认就是此hr所在的公司!

  if (company_in_campaign === undefined || company_in_campaign === null) {
    company_in_campaign = [cid];
  }
  var providerInfo = {
    'cid':company_in_campaign,
    'cname':[cname],
    'poster':{
      cname:cname,
      cid:cid,
      role:'HR'
    },
    'campaign_type':1,
    'campaign_unit':[{
      'company':{
        _id:req.user._id,
        name:req.user.info.official_name,
        logo:req.user.info.logo
      }
    }]//暂时只有一个公司的活动
  };
  var photoInfo = {
    cid:[cid],
    owner: {
      model: {
        type: 'Campaign'
      },
      companies: [req.user._id]
    },
    name: moment(req.body.start_time).format("YYYY-MM-DD ") + req.body.theme,
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
  };
  campaign_controller.newCampaign(req.body,providerInfo,photoInfo,function(status,data){
    if(status){
      return res.send({'result':0,'msg':data});
    }
    else{
      res.send({
        'result': 1,
        'campaign_id': data.campaign_id
      });

      //生成动态消息
      var groupMessage = new GroupMessage();
      groupMessage.message_type = 0;
      groupMessage.company = {
        cid: cid,
        name: cname,
        logo: req.user.info.logo
      };
      groupMessage.campaign = data.campaign_id;
      groupMessage.save(function(err) {
        if (err) {
          console.log(err);
        }
      });
    }
  });
};

exports.changePassword = function(req, res) {
  Company.findOne({
    _id: req.user.id
  }, function(err, company) {
    if (err) {
      console.log(err);
      res.send({
        'result': 0,
        'msg': '数据错误'
      });
    } else {
      if (company) {
        if (company.authenticate(req.body.nowpassword) === true) {
          company.password = req.body.newpassword;
          company.save(function(err) {
            if (err) {
              console.log(err);
              res.send({
                'result': 0,
                'msg': '密码修改失败'
              });
            } else {
              res.send({
                'result': 1,
                'msg': '密码修改成功'
              });
            }
            return;
          });
        } else {
          res.send({
            'result': 0,
            'msg': '密码不正确，请重新输入'
          });
        }

      } else {
        res.send({
          'result': 0,
          'msg': '您没有登录'
        });
      }
    }
  });
};



exports.editLogo = function(req, res) {
  var _company = req.user;
  Company.findOne({
    _id: _company._id
  }).exec(function(err, company) {
    res.render('company/edit_logo', {
      logo: company.info.logo,
      id: company._id
    });
  });

};
exports.renderTeamInfo = function(req, res) {
  return res.render('company/team_info_list');
};

exports.renderManager = function(req, res) {
  res.render('partials/company_manager');
};

exports.getCompanyInviteQrcode = function(req, res) {
  res.render('partials/company_manager');
};

exports.renderHrManagerPage = function(req, res) {
  var rootPath = meanConfig.root;
  if (req.session.mgcid) {
    res.sendfile(path.join(rootPath, 'company_manager_client/index.html'));
  }
  else {
    res.redirect('/company/manager/login');
  }
};

exports.renderLoginPage = function(req, res) {
  var rootPath = meanConfig.root;
  res.sendfile(path.join(rootPath, 'company_manager_client/login.html'));
};
