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
  meanConfig = require('../../config/config'),
  path = require('path'),
  photo_album_controller = require('./photoAlbum');


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

// {'$pull':{'member':{'_id':ObjectId("53c50f643f5bc7910ff6c42f")}}}
// db.companygroups.update({'_id':ObjectId("53bf810948cc8d5e21a3d7e3")},{'$pull':{'member':{'_id':ObjectId("53c50fd33f5bc7910ff6c432")}}})
// db.companygroups.update({'_id':ObjectId("53bf810948cc8d5e21a3d7e3")},{'$pull':{'member':{'_id':ObjectId("53c50ffc3f5bc7910ff6c435")}}})
//先搜索
//任撤部门管理员
exports.managerOperate = function(req, res) {
  var operate = req.body.operate;
  var department_set,team_set;

  console.log(operate);
  if(operate === 'appoint'){
    department_set = {'$push':{'manager':req.body.member}};
    team_set = {'$push':{'leader':req.body.member}};
  }
  if(operate === 'dismiss'){
    department_set = {'$pull':{'manager':{'_id':req.body.member._id}}};
    team_set = {'$pull':{'leader':{'_id':req.body.member._id}}};
  }
  var did = req.body.did;
  Department.findByIdAndUpdate({
    '_id': did
  }, department_set, function(err, department) {
    if (err || !department) {
      res.send(500);
    } else {
      CompanyGroup.findByIdAndUpdate({'_id':department.team},team_set,function (err,company_group){
        if(err || !company_group){
          res.send(500);
        }else{
          User.findOne({'_id':req.body.member._id},function (err,user){
            if(err || !user){
              res.send(500);
            }else{
              for(var i = 0; i < user.team.length; i ++){
                if(user.team[i]._id.toString() === company_group._id.toString()){
                  user.team[i].leader = operate == 'appoint' ? true : false;
                  break;
                }
              }
              user.save(function (err){
                if(err){
                  res.send(500);
                }else{
                  res.send(200, {
                    'manager': req.body.member
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}

//部门之间互相发活动
exports.multiCampaignSponsor = function(req, res) {
  if(req.role !=='HR' && req.role !=='LEADER'){
    console.log(req.role);
    return res.send(403,'forbidden');
  }
  var poster;
  var other_departments = req.body.select_departments;//其实只有一个
  if(req.user.provider === 'user'){
    poster = {
      'cid':req.user.cid,
      'cname':req.user.cname,
      'tname':req.department.team.name,
      'uid':req.user._id,
      'nickname':req.user.nickname,
      'role':'LEADER'
    };
  }else{
    poster = {
      'cid':req.user._id,
      'cname':req.user.info.name,
      'role':'HR'
    };
  }
  var theme = req.body.theme;
  var content = req.body.content;
  var member_num = req.body.member_num;
  var location = req.body.location;
  var time = req.body.time;

  var department_campaign = new Campaign();
  department_campaign.campaign_type = 7;
  department_campaign.active = true;
  department_campaign.team.push(req.department.team);
  var teams = [];
  var team_ids = [];

  teams.push({
    'teamid':req.department.team._id,
    'name':req.department.team.name,
    'logo':req.department.team.logo
  });
  for(var i = 0; i < other_departments.length; i ++){
    department_campaign.team.push(other_departments[i].team._id);
    team_ids.push(other_departments[i].team._id);
    teams.push({
      'teamid':other_departments[i].team._id,
      'name':other_departments[i].team.name,
      'logo':other_departments[i].team.logo
    });
    console.log('-3-3-3',other_departments[i].team);
  }

  department_campaign.cid.push(req.department.company._id);
  department_campaign.cname.push(req.department.company.name);
  department_campaign.poster = poster;
  department_campaign.theme = theme;
  department_campaign.content = content;
  department_campaign.member_min = member_num.min;
  department_campaign.member_max = member_num.max;
  department_campaign.location = location;
  department_campaign.start_time = time.start;
  department_campaign.end_time = time.end;
  department_campaign.deadline = time.deadline;

  var photo_album = new PhotoAlbum({
    owner: {
      model: {
        _id: department_campaign._id,
        type: 'Campaign'
      },
      companies: [req.department.company._id],
      teams: team_ids
    },
    name: moment(department_campaign.start_time).format("YYYY-MM-DD ") + department_campaign.theme,
    update_user: {
      _id: department_campaign.poster._id,
      name: department_campaign.poster.nickname,
      type: 'user'
    },
    create_user: {
      _id: department_campaign.poster._id,
      name: department_campaign.poster.nickname,
      type: 'user'
    }
  });
  fs.mkdir(path.join(meanConfig.root, '/public/img/photo_album/', photo_album._id.toString()), function(err) {
    if (err) {
      console.log(err);
      return res.send(500);
    } else {
      photo_album.save(function(err){
        if(!err){
          department_campaign.photo_album = photo_album._id;

          department_campaign.save(function(err){
            if(!err){
              var groupMessage = new GroupMessage();
              groupMessage.message_type = 10;
              groupMessage.team = teams;

              groupMessage.company.push({
                cid: req.department.company._id,
                name: req.department.company.name
              });
              groupMessage.campaign = department_campaign._id;

              // 暂时只有一个其它部门
              groupMessage.department = [req.department._id, other_departments[0]._id];
              groupMessage.save(function (err) {
                if (err) {
                  console.log('保存约战动态时出错' + err);
                }else{
                  return res.send({'result':0,'msg':'SUCCESS'});
                }
              });
            }else{
              return res.send({'result':0,'msg':'ERROR'});
            }
          });
        }
      });
    }
  });
}



//部门发活动
exports.sponsor = function(req, res) {
  if (req.role !== 'HR' && req.role !== 'LEADER') {
    return res.send(403, 'forbidden');
  }
  var theme = req.body.theme;
  var content = req.body.content; //活动内容
  var location = req.body.location; //活动地点
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
  campaign.cid = [cid]; //其实只有一个公司
  campaign.cname = [cname];
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
  if (req.user.provider === 'company') {
    var update_user = {
      _id: req.user._id,
      name: req.user.info.name,
      type: 'hr'
    };
    photo_album.update_user = update_user;
    photo_album.create_user = update_user;
  } else if (req.user.provider === 'user') {
    var update_user = {
      _id: req.user._id,
      name: req.user.nickname,
      type: 'user'
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
        } else {
          req.department.team.photo_album_list.push(photo_album._id);
          req.department.team.save(function(err) {
            if (err) {
              return res.send(500);
            } else {
              //生成动态消息
              var groupMessage = new GroupMessage();
              groupMessage.message_type = 9;
              groupMessage.company = {
                cid: cid,
                name: cname
              };
              groupMessage.team = {
                teamid: tid,
                name: tname,
                logo: req.department.team.logo
              };
              groupMessage.campaign = campaign._id;
              groupMessage.department = req.department._id;
              groupMessage.save(function(err) {
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
var teamOperate = function(options, callback){
  var did = options.did;
  var operate = options.operate;
  var user = options.user;
  var method = options.method;
  Department.findByIdAndUpdate({'_id':did},operate,function(err,department){
    if (err) {
      callback(err);
    }
    else if(!department){
      callback('not found');
    } else {
      CompanyGroup.findByIdAndUpdate({'_id':department.team},operate,function(err,company_group){
        if(err){
          callback(err);
        } else if (!department) {
          callback('not found');
        }
        else{
          var _set;
          //加入
          if(method){
            _set = {'department':{'_id':did,'name':department.name}};
            var _push = {'team':{'gid':'0','group_type':'virtual','entity_type':'virtual','_id':company_group._id,'name':company_group.name,'logo':company_group.logo}};
            User.findByIdAndUpdate({'_id':user._id},{'$set':_set,'$push':_push},function (err,user){
              if(err){
                callback(err)
              } else if (!user) {
                callback('not found');
              } else {
                callback(null, {'member':company_group.member});
              }
            });
          //退出
          }else{
            User.findOne({'_id':user._id},function (err,user){
              if(err){
                callback(err)
              } else if (!user) {
                callback('not found');
              } else{
                user.department = null;
                for(var i = 0 ; i < user.team.length; i ++){
                  if(user.team[i]._id.toString() === company_group._id.toString()){
                    user.team.splice(i,1);
                    break;
                  }
                }
                user.save(function (err){
                  if(err){
                    callback(err);
                  }else{
                    callback(null, {'member':company_group.member})
                  }
                });
              }
            });
          }
        }
      });
    }
  });
}

//通过路由加退成员
exports.memberOperateByRoute = function(req, res) {
  var did = req.params.departmentId;
  var operate = req.body.operate;
  var member = req.body.member;

  var join = function(callback) {
    teamOperate({
      did: did,
      operate: {
        '$push': {
          'member': member
        }
      },
      user: member,
      method: true
    }, function(err, data) {
      if (err) {
        console.log(err);
        if (err === 'not found') {
          return res.send(404);
        } else {
          return res.send(500);
        }
      }

      callback(data);

    });
  };

  var quit = function(callback) {
    teamOperate({
      did: req.user.department._id,
      operate: {
        '$pull': {
          'member': {
            '_id': member._id
          }
        }
      },
      user: member,
      method: false
    }, function(err, data) {
      if (err) {
        console.log(err);
        if (err === 'not found') {
          return res.send(404);
        } else {
          return res.send(500);
        }
      }

      callback(data);

    });
  };


  if (operate === 'join') {
    //员工提出申请后加入
    // 如果有加入部门，先退出之前的部门
    if (req.user.department && req.user.department._id && req.user.department._id.toString() !== did) {

      quit(function(data) {
        join(res.send);
      });

    } else {
      join(res.send);
    }
  }
  if (operate === 'quit') {
    //踢掉
    quit(res.send);
  }
}

//手动调用函数
exports.memberOperateByHand = function(operate, member, did) {
  if (operate === 'join') {
    //员工提出申请后加入
    teamOperate(did,{'$push':{'member':member}},null,null,member,true);
  }
  if (operate === 'quit') {
    //踢掉
    teamOperate(did,{'$pull':{'member':{'_id':member._id}}},null,null,member,false);
  }
}

//下面的千万不要删啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊,以后还会用的

// //处理员工申请
// exports.applyOperate = function(req, res) {
//   var did = req.body.did;
//   var apply_status = req.body.apply_status;
//   var apply_members = req.body.apply_members; //ids是数组,因为可以批量处理申请
//   Department.findOne({
//     '_id': did
//   }, function(err, department) {
//     if (err || !department) {
//       res.send(500);
//     } else {
//       var members = [];
//       for (var i = 0; i < department.member.length; i++) {
//         for (var j = 0; j < apply_members.length; j++) {
//           if (apply_members[j]._id.toString() === department.member[i].toString()) {
//             members.push(apply_members[j]);
//             department.member[i].apply_status = apply_status;
//             break;
//           }
//         }
//       }
//       department.save(function(err) {
//         if (err) {
//           res.send(500);
//         } else {
//           CompanyGroup.findOne({
//             '_id': department.team
//           }, function(err, company_group) {
//             if (err || !company_group) {
//               res.send(500);
//             } else {
//               var old_member = company_group.member;
//               company_group.member = old_member.concat(members);
//               company_group.save(function(err) {
//                 if (err) {
//                   res.send(500);
//                 } else {
//                   res.send(200, {
//                     'member': department.member
//                   })
//                 }
//               })
//             }
//           });
//         }
//       });
//     }
//   })
// }

// //获取所有员工的申请信息
// exports.getApplyInfo = function(req, res) {
//   var did = req.body.did;
//   Department.findOne({
//     '_id': did
//   }, function(err, department) {
//     if (err || !department) {
//       res.send(500);
//     } else {
//       res.send(200, {
//         'member': department.member
//       });
//     }
//   })
// }

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
};


//获取部门列表
exports.getMultiDepartmentDetail = function(req, res) {
  var cid = req.params.cid;
  Department.find({
    'company._id': cid
  }).populate('team').exec(function(err, departments) {
    if (err || !departments) {
      res.send(500, {
        'departments': null
      });
    } else {
      res.send(200, {
        'departments': departments
      })
    }
  });
};

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
  Department.find({
    '_id': {
      '$in': delete_ids
    }
  }, function(err, departments) {
    var user_ids = [];
    var team_ids = [];
    if (departments) {
      for (var i = 0; i < departments.length; i++) {
        for (var j = 0; j < departments[i].member.length; j++) {
          user_ids.push(departments[i].member[j]._id);
        }
        team_ids.push(departments[i].team);
      }

      User.update({
        '_id': {
          '$in': user_ids
        }
      }, {
        '$set': {
          'department': null
        }
      }, {
        'multi': true
      }, function(err, users) {
        CompanyGroup.remove({
          '_id': {
            '$in': team_ids
          }
        }, function(err, company_group) {
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

  if (req.role !== 'HR') {
    return res.send(403);
  }

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
};
//删除部门
exports.deleteDepartment = function(req, res) {

  if (req.role !== 'HR') {
    return res.send(403);
  }

  var did = req.params.departmentId;
  if (did.toString() === req.user._id.toString()) {
    //删除该公司下的所有部门
    deleteFromRoot(req.user, -1, req, res);
  } else {
    //删除某个部门以及其下所有子部门
    operateFromRootAndDeleteOne(did, req, res);
  }
};

//获取树形部门数据
exports.getDepartment = function(req, res) {
  if(req.params.cid === '0'){
    if (req.session.cid) {
      Company.findOne({
        '_id': req.session.cid
      }, function(err, company) {
        if (err || !company) {
          res.send(500);
        } else {
          res.send({
            '_id': company._id,
            'name': company.name,
            'department': company.department
          });
          req.session.cid = null;
        }
      })
    } else {
      res.send(403);
    }
  }else{
    if (req.user._id.toString() === req.params.cid) {
      res.send({
        '_id': req.user._id,
        'name': req.user.info.name,
        'department': req.user.department
      });
    } else {
      Company
      .findById(req.params.cid)
      .exec()
      .then(function(company) {
        if (!company) {
          return res.send(404);
        }
        return res.send({
          _id: company._id,
          name: company.name,
          department: company.department
        });
      })
      .then(null, function(err) {
        console.log(err);
        res.send(500);
      });
    }
  }
}

/*
 * param in: req.body.did (部门id,一开始是公司id)
 */
exports.createDepartment = function(req, res) {
  if (req.user.provider === 'company') {
    var did = req.body.did;
    var name = req.body.name;
    var cid = req.body.cid;

    if (req.user._id.toString() !== cid) {
      return res.send(403);
    }

    var team_create = {
      'cid': req.user._id,
      'gid': '0',
      'group_type': 'virtual',
      'name':req.body.name,
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
  var department = req.department;
  PhotoAlbum
    .where('_id').in(department.team.photo_album_list)
    .exec()
    .then(function(photo_albums) {
      if (!photo_albums) {
        return res.send(404);
      }
      var photo_album_thumbnails = [];

      for (var i = 0; i < photo_albums.length; i++) {
        if (photo_albums[i].owner.model.type === 'Campaign' && photo_albums[i].photos.length === 0) {
          continue;
        }
        if (photo_albums[i].hidden === true) {
          continue;
        }
        var thumbnail_uri = photo_album_controller.photoAlbumThumbnail(photo_albums[i]);
        photo_album_thumbnails.push({
          uri: thumbnail_uri,
          name: photo_albums[i].name,
          _id: photo_albums[i]._id
        });
        if (photo_album_thumbnails.length === 4) {
          break;
        }
      }

      if (req.role === 'HR') {
        return res.render('department/home', {
          'department': department,
          'role': req.role,
          'tname': department.team.name,
          'number': department.team.member ? department.team.member.length : 0,
          'score': department.team.score ? department.team.score : 0,
          'logo': department.team.logo,
          'group_id': department.team._id,
          'cname': department.team.cname,
          'sign': department.team.brief,
          'gid': department.team.gid,
          'photo_album_thumbnails': photo_album_thumbnails
        });
      } else {
        var selected_teams = [];
        var unselected_teams = [];
        var user_teams = [];
        var photo_album_ids = [];
        for (var i = 0; i < req.user.team.length; i++) {
          user_teams.push(req.user.team[i]._id.toString());
        }
        //此处不需传那么多吧……M
        CompanyGroup.find({
          'cid': req.user.cid
        }, {
          '_id': 1,
          'gid': 1,
          'group_type': 1,
          'logo': 1,
          'name': 1,
          'cname': 1,
          'active': 1
        }, function(err, company_groups) {
          if (err || !company_groups) {
            return res.send([]);
          } else {
            for (var i = 0; i < company_groups.length; i++) {
              if (company_groups[i].gid !== '0' && company_groups[i].active === true) {
                //下面查找的是该成员加入和未加入的所有active小队
                if (user_teams.indexOf(company_groups[i]._id.toString()) > -1) {
                  selected_teams.push(company_groups[i]);
                } else {
                  unselected_teams.push(company_groups[i]);
                }
              }
            }

            return res.render('department/home', {
              'department': department,
              'selected_teams': selected_teams,
              'unselected_teams': unselected_teams,
              'tname': department.team.name,
              'number': department.team.member ? department.team.member.length : 0,
              'score': department.team.score ? department.team.score : 0,
              'role': req.role,
              'logo': department.team.logo,
              'group_id': department.team._id,
              'cname': department.team.cname,
              'sign': department.team.brief,
              'gid': department.team.gid,
              'photo': req.user.photo,
              'realname': req.user.realname,
              'photo_album_thumbnails': photo_album_thumbnails
            });
          };
        });
      }

    });

};

exports.renderCampaigns = function(req, res) {
  res.render('partials/campaign_list');
};

exports.renderApplyList = function(req, res) {
  res.render('partials/apply_list', {
    department: req.department
  });
};

exports.renderDepartmentInfo = function(req, res) {
  res.render('department/department_info');
};
