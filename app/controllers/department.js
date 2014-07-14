'use strict';

//部门

var mongoose = require('mongoose'),
  encrypt = require('../middlewares/encrypt'),
  StackAndQueue = require('../helpers/stackAndQueue'),
  crypto = require('crypto'),
  async = require('async'),
  fs = require('fs'),
  moment = require('moment'),
  User = mongoose.model('User'),
  Department = mongoose.model('Department'),
  Campaign = mongoose.model('Campaign'),
  Company = mongoose.model('Company'),
  CompanyGroup = mongoose.model('CompanyGroup'),
  PhotoAlbum = mongoose.model('PhotoAlbum'),
  GroupMessage = mongoose.model('GroupMessage'),
  meanConfig = require('../../config/config');


//消除递归使用的栈
var stack = new StackAndQueue.stack();
var stack_root = new StackAndQueue.stack();



exports.department = function(req, res, next) {
  Department
  .findById(req.params.departmentId)
  .populate('team')
  .exec()
  .then(function(department) {
    if (!department) {
      return res.send(404);
    }
    req.department = department;
    next();
  })
  .then(null, function(err) {
    console.log(err);
    res.send(500);
  });
};

//先搜索
//任撤部门管理员
exports.managerOperate = function(req,res){
  var manager = req.body.manager;
  var did = req.body.did;
  Department.findByIdAndUpdate({'_id':did},{'$set':{'manager':manager}},function(err,department){
    if(err || !message){
      res.send(500);
    }else{
      res.send(200,{'manager':department.manager});
    }
  });
}


//先搜索
//任撤部门管理员
exports.managerOperate = function(req, res) {
  var manager = req.body.manager;
  var did = req.body.did;
  Department.findByIdAndUpdate({
    '_id': did
  }, {
    '$set': {
      'manager': manager
    }
  }, function(err, department) {
    if (err || !message) {
      res.send(500);
    } else {
      res.send(200, {
        'manager': department.manager
      });
    }
  });
}



//部门之间挑战
exports.provoke = function(req, res) {

}


//部门之间应战
exports.responseProvoke = function(req, res) {


}



//部门发活动
exports.sponsor = function(req, res) {
  if(req.role !=='HR') {
    return res.send(403,forbidden);
  }
  var theme = req.body.theme;
  var content = req.body.content;//活动内容
  var location = req.body.location;//活动地点
  var group_type = '虚拟组';
  var tid = req.department.team._id;
  var cid = req.department.company._id;
  var cname = req.department.company.name;
  var tname = req.department.name;
  var member_min = req.body.member_min ? req.body.member_min : 0;
  var member_max = req.body.member_max ? req.body.member_max : 0;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;
  var deadline = req.body.deadline ? req.body.deadline : end_time;
  //生成活动
  var campaign = new Campaign();
  campaign.team.push(tid);
  campaign.cid =[cid];//其实只有一个公司
  campaign.cname =[cname];
  campaign.poster.cname = cname;
  campaign.poster.cid = cid;
  campaign.poster.role = req.session.role;
  campaign.poster.tname = tname;
  // 有部门管理员后设置为管理员
  // if(req.session.role==='LEADER'){
  //   campaign.poster.uid = req.user._id;
  //   campaign.poster.nickname = req.user.nickname;
  // }
  campaign.member_min = member_min;
  campaign.member_max = member_max;

  campaign.content = content;
  campaign.location = location;
  campaign.theme = theme;
  campaign.active = true;
  campaign.campaign_type = 6; // 部门活动

  campaign.start_time = start_time;
  campaign.end_time = end_time;
  campaign.deadline = deadline;
  var photo_album = new PhotoAlbum({
    owner: {
      model: {
        _id: campaign._id,
        type: 'Campaign'
      },
      companies: [cid],
      teams: [req.department.team._id]
    },
    name: moment(campaign.start_time).format("YYYY-MM-DD ") + campaign.theme
  });
  if (req.user.provider = 'company') {
    var update_user = {
      _id: req.user._id,
      name: req.user.info.name,
      type: 'hr'
    };
    photo_album.update_user = update_user;
    photo_album.create_user = update_user;
  }


  fs.mkdir(meanConfig.root + '/public/img/photo_album/' + photo_album._id, function(err) {
    if (err) {
      console.log(err);
      return res.send(500);
    }

    photo_album.save(function(err) {
      if (err) {
        console.log(err);
        return res.send(500);
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
        else{
          req.department.team.photo_album_list.push(photo_album._id);
          req.department.team.save(function(err) {
            if (err) {
              return res.send(500);
            } else {
              //生成动态消息
              var groupMessage = new GroupMessage();
              groupMessage.message_type = 1;
              groupMessage.company = {
                cid : cid,
                name : cname
              };
              groupMessage.team= {
                teamid : tid,
                name : tname,
                logo : req.department.team.logo
              };
              groupMessage.campaign = campaign._id;
              groupMessage.save(function (err) {
                if (err) {
                  console.log(err);
                } else {
                  return res.send(200);
                }
              });
            }
          });
        }
      });
    });
  });
}
var teamOperate = function(did,operate,res,req){
  Department.findByIdAndUpdate({'_id':did},operate,function(err,department){
    if(err || !department){
      if(res != null)return res.send(500);
    }else{
      CompanyGroup.findByIdAndUpdate({'_id':department.team},operate,function(err,company_group){
        if(err || !department){
          if(res!=null)return res.send(500);
        }else{
          if(res!=null)return res.send(200,{'member':company_group.member});
        }
      });
    }
  });
}

//通过路由加退成员
exports.memberOperateByRoute = function(req,res){
  var did = req.body.did;
  var operate = req.body.operate;
  var member = req.body.member;
  if (operate === 'join') {
    //员工提出申请后加入
    teamOperate(did, {
      '$push': {
        'member': member
      }
    }, req, res);
  }
  if (operate === 'quit') {
    //踢掉
    teamOperate(did, {
      '$pull': {
        'member': {
          '_id': member._id
        }
      }
    }, req, res);
  }
}

//手动调用函数
exports.memberOperateByHand = function(operate,member,did){
  if(operate === 'join'){
    //员工提出申请后加入
    teamOperate(did,{'$push':{'member':member}},null,null);
  }
  if(operate === 'quit'){
    //踢掉
    teamOperate(did,{'$pull':{'member':{'_id':member._id}}},null,null);
  }
}


//处理员工申请
exports.applyOperate = function(req, res) {
  var did = req.body.did;
  var apply_status = req.body.apply_status;
  var apply_members = req.body.apply_members; //ids是数组,因为可以批量处理申请
  Department.findOne({
    '_id': did
  }, function(err, department) {
    if (err || !department) {
      res.send(500);
    } else {
      var members = [];
      for (var i = 0; i < department.member.length; i++) {
        for (var j = 0; j < apply_members.length; j++) {
          if (apply_members[j]._id.toString() === department.member[i].toString()) {
            members.push(apply_members[j]);
            department.member[i].apply_status = apply_status;
            break;
          }
        }
      }
      department.save(function(err) {
        if (err) {
          res.send(500);
        } else {
          CompanyGroup.findOne({
            '_id': department.team
          }, function(err, company_group) {
            if (err || !company_group) {
              res.send(500);
            } else {
              var old_member = company_group.member;
              company_group.member = old_member.concat(members);
              company_group.save(function(err) {
                if (err) {
                  res.send(500);
                } else {
                  res.send(200, {
                    'member': department.member
                  })
                }
              })
            }
          });
        }
      });
    }
  })
}

//获取所有员工的申请信息
exports.getApplyInfo = function(req, res) {
  var did = req.body.did;
  Department.findOne({
    '_id': did
  }, function(err, department) {
    if (err || !department) {
      res.send(500);
    } else {
      res.send(200, {
        'member': department.member
      });
    }
  })
}

//获取某一部门的详细信息
exports.getDepartmentDetail = function(req, res) {
  var did = req.body.did;
  Department.findOne({
    '_id': did
  }).populate('team').exec(function(err, department) {
    if (err || !department) {
      res.send(500, {
        'department': null
      });
    } else {
      res.send(200, {
        'department': department
      })
    }
  });
}


var deleteFromRoot = function(department, seq, req, res) {
  stack = null;
  stack = new StackAndQueue.stack();
  var delete_ids = [];

  //删除某个部门以及其下的所有部门
  if (seq != -1) {
    delete_ids.push(department[seq]._id);
    stack.push({
      '_id': department[seq]._id,
      'department': department[seq].department
    });
    //删除公司下的所有部门
  } else {
    stack.push({
      '_id': department._id,
      'department': department.department
    });
  }
  while (!stack.isEmpty()) {
    var pop = stack.pop();
    if (pop.department.length > 0) {
      for (var i = 0; i < pop.department.length; i++) {
        //待删除的部门id
        delete_ids.push(pop.department[i]._id);
        stack.push(pop.department[i]);
      }
    }
  }

  //员工的部门、小队也要删掉
  Department.find({'_id': {
      '$in': delete_ids
    }
  }, function (err,departments){
    var user_ids = [];
    var team_ids = [];
    if(departments){
      for(var i = 0; i < departments.length; i ++){
        for(var j = 0; j < departments[i].member.length; j ++){
          user_ids.push(departments[i].member[j]._id);
        }
        team_ids.push(departments[i].team);
      }

      User.update({'_id':{'$in':user_ids}},{'$set':{'department':null}},{'multi':true},function (err,users){
        CompanyGroup.remove({'_id':{'$in':team_ids}},function (err,company_group){
          Department.remove({
            '_id': {
              '$in': delete_ids
            }
          }, function(err, _department) {
            if (err || !_department) {
              return res.send({
                'msg': 'DEPARTMENT_DELETE_FAILURE',
                'department': []
              });
            } else {

              if (seq != -1) {
                department.splice(seq, 1);
              } else {
                req.user.department = [];
              }

              Company.findOne({
                '_id': req.user._id
              }, function(err, company) {
                if (err || !company) {
                  res.send({
                    'msg': 'DEPARTMENT_DELETE_FAILURE',
                    'department': []
                  });
                } else {
                  company.department = req.user.department;
                  company.save(function(err) {
                    if (err) {
                      res.send({
                        'msg': 'DEPARTMENT_DELETE_FAILURE',
                        'department': []
                      });
                    } else {
                      res.send({
                        'msg': 'DEPARTMENT_DELETE_SUCCESS',
                        '_id': req.user._id,
                        'name': req.user.info.name,
                        'department': company.department
                      });
                    }
                  })
                }
              })
            }
          });
        });
      });
    }
  });
}
var operateFromRootAndDeleteOne = function(did, req, res) {
  stack = null;
  stack = new StackAndQueue.stack();
  var find = false;
  //从根部开始找
  stack.push({
    '_id': req.user._id,
    'department': req.user.department
  });
  while (!stack.isEmpty() && !find) {
    var pop = stack.pop();
    if (pop.department.length > 0) {
      for (var i = 0; i < pop.department.length && !find; i++) {

        if (pop.department[i]._id.toString() === did.toString()) {
          find = true;

          //pop.department.splice(i,1);

          deleteFromRoot(pop.department, i, req, res);
          return;

        } else {
          stack.push(pop.department[i]);
        }

      }
    }
  }
  if (!find) {
    return res.send({
      'msg': 'DEPARTMENT_DELETE_SUCCESS',
      'department': req.user.department
    });
  }
}



//深度优先修改算法
//第一次传进来的是company
var departmentFindAndUpdate = function(department, did, param) {
  stack = null;
  stack = new StackAndQueue.stack();
  if (department._id.toString() === did) {
    //操作
    switch (param.type) {
      case 0:
        param.child.parent_id = department._id;
        department.department.push(param.child);
        return department;
      case 1:
        if (department.department.name != undefined) {
          department.department.name = param.name;
        }
        return department;
      default:
        break;
    }
  } else {
    stack.push({
      '_id': department._id,
      'department': department.department
    });
    while (!stack.isEmpty()) {
      var pop = stack.pop();
      if (pop.department.length > 0) {
        for (var i = 0; i < pop.department.length; i++) {
          if (pop.department[i]._id.toString() === did.toString()) {
            //操作
            switch (param.type) {
              case 0:
                param.child.parent_id = pop.department[i]._id;
                param.child.department = [];
                pop.department[i].department.push(param.child);
                return department;
              case 1:
                pop.department[i].name = param.name;
                return department;
              default:
                break;
            }
          } else {
            stack.push(pop.department[i]);
          }
        }
      }
    }
  }
  return department;
}


//修改部门信息
exports.modifyDepartment = function(req, res) {
  if (req.session.role === 'HR') {
    var did = req.body.did;
    var name = req.body.name;
    Company.findOne({
      '_id': req.user._id
    }, function(err, company) {
      if (err || !company) {
        res.send({
          'msg': 'DEPARTMENT_UPDATE_FAILURE'
        });
      } else {
        var param = {
          'type': 1,
          'name': name
        };
        company.department = departmentFindAndUpdate(req.user, did, param).department;
        company.save(function(err) {
          if (err) {
            res.send({
              'msg': 'DEPARTMENT_UPDATE_FAILURE'
            });
          } else {
            res.send({
              'msg': 'DEPARTMENT_UPDATE_SUCCESS',
              '_id': company._id,
              'name': company.info.name,
              'department': company.department
            });
          }
        });
      }
    });
  } else {
    res.send(403);
  }
}
//删除部门
exports.deleteDepartment = function(req, res) {
  if (req.session.role === 'HR') {
    var did = req.body.did;
    if (did.toString() === req.user._id.toString()) {
      //删除该公司下的所有部门
      deleteFromRoot(req.user, -1, req, res);
    } else {
      //删除某个部门以及其下所有子部门
      operateFromRootAndDeleteOne(did, req, res);
    }
  } else {
    res.send(403);
  }
}

//获取树形部门数据
exports.getDepartment = function(req, res) {
  if (req.session.role === 'HR') {
    res.send({
      '_id': req.user._id,
      'name': req.user.info.name,
      'department': req.user.department
    });
  }else{
    if(req.session.cid != undefined){
      Company.findOne({'_id':req.session.cid},function (err,company){
        if(err || !company){
          res.send(500);
        }else{
          res.send({
            '_id': company._id,
            'name': company.name,
            'department': company.department
          });
          delete req.session.cid;
        }
      })
    }else{
      res.send(403);
    }
  }
}

/*
 * param in: req.body.did (部门id,一开始是公司id)
 */
exports.createDepartment = function(req, res) {
  if (req.session.role === 'HR') {
    var did = req.body.did;
    var name = req.body.name;

    var team_create = {
      'cid': req.user._id,
      'gid': '0',
      'group_type': 'virtual',
      'cname': req.user.info.name,
      'entity_type': 'virtual'
    }
    CompanyGroup.create(team_create, function(err, company_group) {
      if (err || !company_group) {
        res.send({
          'msg': 'TEAM_CREATE_FAILURE'
        });
      } else {
        var department_create = {
          'name': name,
          'company': {
            '_id': req.user._id,
            'name': req.user.info.name,
            'logo': req.user.info.logo
          },
          'team': company_group._id
        };
        Department.create(department_create, function(err, department) {
          if (err || !department) {
            res.send({
              'msg': 'DEPARTMENT_CREATE_FAILURE'
            });
          } else {
            Company.findOne({
              '_id': req.user._id
            }, function(err, company) {
              if (err || !company) {
                res.send({
                  'msg': 'DEPARTMENT_UPDATE_FAILURE'
                });
              } else {
                var child = {
                  '_id': department._id,
                  'name': name,
                  'department': []
                };
                var param = {
                  'type': 0,
                  'child': child
                };
                company.department = departmentFindAndUpdate(req.user, did, param).department;

                company.save(function(err) {
                  if (err) {
                    res.send({
                      'msg': 'DEPARTMENT_UPDATE_FAILURE'
                    });
                  } else {
                    res.send({
                      '_id': req.user._id,
                      'name': req.user.info.name,
                      'department': company.department
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  } else {
    res.send(403);
  }
}


exports.renderHome = function(req, res) {
  Department
    .findById(req.params.departmentId)
    .populate('team')
    .exec()
    .then(function(department) {
      if (!department) {
        throw 'not found';
      }
      return res.render('department/home', {
        department: department
      });
    })
    .then(null, function(err) {
      console.log(err);
      // TO DO: temp err handle
      res.send(500);
    });
};

exports.renderCampaigns = function(req, res) {
  res.render('partials/campaign_list');
};
