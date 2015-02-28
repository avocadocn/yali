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
  auth = require('../services/auth'),
  photo_album_controller = require('./photoAlbum'),
  _ = require('lodash'),
  campaign_controller = require('../controllers/campaign');


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
  var did = req.body.did;
  //-console.log(operate);
  if(operate === 'appoint'){
    if(req.body.member.wait_for_join){
      teamOperate({
        did: did,
        operate: {
          '$push': {
            'member': req.body.member
          }
        },
        user: req.body.member,
        method: true
      }, function (err,data){managerUpdate(did,operate,req.body.member,res)});
    }else{
      managerUpdate(did,operate,req.body.member,res);
    }
  }else{
    managerUpdate(did,operate,req.body.member,res);
  }
}


var managerUpdate = function(did,operate,member,res){
  var department_set,team_set;
  if(operate === 'appoint'){
    department_set = {'$push':{'manager':member}};
    team_set = {'$push':{'leader':member}};
  }else{
    department_set = {'$pull':{'manager':{'_id':member._id}}};
    team_set = {'$pull':{'leader':{'_id':member._id}}};
  }
  Department.findByIdAndUpdate({
    '_id': did
  }, department_set, function(err, department) {
    if (err || !department) {
      if(res!=null)res.send(500);
    } else {
      CompanyGroup.findByIdAndUpdate({'_id':department.team},team_set,function (err,company_group){
        if(err || !company_group){
          if(res!=null)res.send(500);
        }else{
          User.findOne({'_id':member._id},function (err,user){
            if(err || !user){
              if(res!=null)res.send(500);
            }else{
              for(var i = 0; i < user.team.length; i ++){
                if(user.team[i]._id.toString() === company_group._id.toString()){
                  user.team[i].leader = operate == 'appoint' ? true : false;
                  break;
                }
              }
              user.save(function (err){
                if(err){
                  if(res!=null)res.send(500);
                }else{
                  if(res!=null){
                    res.send(200, {
                      'manager': member
                    });
                  }
                }
              });
            }
          });
        }
      });
    }
  });
}

//多部门活动
exports.multiCampaignSponsor = function(req, res) {
  if(req.role !=='HR' && req.role !=='LEADER'){
    res.status(403);
    next('forbidden');
    return;
  }
  var teams = [];
  var team_ids = [];
  var poster;
  var other_departments = req.body.select_departments;
  var _compaignUnits =[];
  var cname = req.user.provider === 'user'? req.user.cname:req.user.info.official_name;
  if(req.user.provider === 'user'){
    poster = {
      'cid':req.user.cid,
      'cname':cname,
      'tname':req.department.team.name,
      'uid':req.user._id,
      'nickname':req.user.nickname,
      'role':'LEADER'
    };
    teams.push({
      'teamid':req.department.team._id,
      'name':req.department.team.name,
      'logo':req.department.team.logo
    });
    _compaignUnits.push({
      'company':{
        '_id':req.user.cid,
        'name':req.user.cname,
        'logo':req.department.company.logo
      },
      'team':{
        '_id':req.department.team._id,
        'name':req.department.team.name,
        'logo':req.department.team.logo
      }
    });
  }else{
    poster = {
      'cid':req.user._id,
      'cname':cname,
      'role':'HR'
    };
  }

  team_ids.push(req.department.team);
  for(var i = 0; i < other_departments.length; i ++){
    // department_campaign.team.push(other_departments[i].team._id);
    team_ids.push(other_departments[i].team._id);
    teams.push({
      'teamid':other_departments[i].team._id,
      'name':other_departments[i].team.name,
      'logo':other_departments[i].team.logo
    });
    _compaignUnits.push({
      'company':{//暂时只有一个公司
        '_id':req.user.provider === 'user'?req.user.cid:req.user._id,
        'name':cname,
        'logo':req.department.company.logo
      },
      'team':{
        '_id':other_departments[i].team._id,
        'name':other_departments[i].team.name,
        'logo':other_departments[i].team.logo
      }
    });
  }

  var providerInfo = {
    tid:team_ids,
    cid:[req.department.company._id],
    // cname:[req.department.company.name],
    poster:poster,
    campaign_type:8,
    campaign_unit:_compaignUnits
  };

  var create_user = {
    _id: poster._id,
    name:req.role==='HR'? poster.cname:poster.nickname,
    type:req.role==='HR'? 'hr':'user'
  };
  var photoInfo = {
    owner: {
      model: {
        // _id: department_campaign._id,
        type: 'Campaign'
      },
      companies: [req.department.company._id],
      teams: team_ids
    },
    name: moment(req.body.start_time).format("YYYY-MM-DD ") + req.body.theme,
    update_user: create_user,
    create_user: create_user
  };
  campaign_controller.newCampaign(req.body,providerInfo,photoInfo,function(status,data){
    if(status){
      return res.send({'result':0,'msg':data});
    }
    else{
      var groupMessage = new GroupMessage();
      groupMessage.message_type = 10;
      groupMessage.team = teams;

      groupMessage.company.push({
        cid: req.department.company._id,
        name: req.department.company.name
      });
      groupMessage.campaign = data.campaign_id;

      // 暂时只有一个其它部门
      groupMessage.department = [req.department._id, other_departments[0]._id];
      groupMessage.save(function (err) {
        if (err) {
          console.log('保存约战动态时出错' + err);
        }else{
          return res.send({'result':0,'msg':'SUCCESS'});
        }
      });
    }
  });
  //缺少给部门加相册
}

//深度搜索部门信息
var getDeptDepartment = function(req,res,did,callback){
  Company.findOne({
    '_id': req.user.provider === 'user' ? req.user.cid : req.user._id
  }, function(err, company) {
    if (err || !company) {
      return {
        'msg':'ERROR',
        'data':[]
      };
    } else {
      stack = null;
      stack = new StackAndQueue.stack();
      var rst = [];
      var find = false;
      stack.push({
        '_id': company._id,
        'department': company.department
      });
      while (!stack.isEmpty()) {
        var pop = stack.pop();
        if (pop.department.length > 0) {
          for (var i = 0; i < pop.department.length; i++) {
            if(pop.department[i]._id.toString() === did.toString() && !find){
              find = true;
              var f_id = pop.department[i]._id;
              var f_department = pop.department[i].department;
              rst.push(f_id);
              stack = null;
              stack = new StackAndQueue.stack();
              stack.push({
                '_id': f_id,
                'department': f_department
              });
              break;
            }
            if(find){
              rst.push(pop.department[i]._id);
            }
            stack.push(pop.department[i]);
          }
        }
      }
      if(rst.length > 0){
        Department.find({'_id':{'$in':rst},'status':{'$ne':'delete'}}).populate('team').exec(function (err,departments){
          if(err || !departments){
            console.log(err);
            return {
              'msg':'ERROR',
              'data':[]
            };
          }else{
            callback(req,res,departments);
          }
        });
      }
    }
  });
}

//获取部门活动的Tags
exports.getTags = function (req,res) {
  Department.findOne({'_id':req.params.departmentId,'status':{'$ne':'delete'}},{'team':1}).populate('team').exec(function (err,department){
    if(err || !department){
      console.log(err);
      return {
        'msg':'ERROR',
        'data':[]
      };
    }else{
      Campaign.aggregate()
      .project({"tags":1,"campaign_type":1,"team":1})
      .match({$and: [
        {'team' : mongoose.Types.ObjectId(department.team._id)},
        {'campaign_type':6}
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
    }
  });

};
//部门发活动
exports.sponsor = function(req, res, next) {
  var allow = auth(req.user, {
    companies: [req.department.company._id],
    teams: [req.department.team._id]
  }, [
    'sponsorCampaign'
  ]);
  if(!allow.sponsorCampaign){
    res.status(403);
    next('forbidden');
    return;
  };
  var _sponsor = function(req,res,departments){

    var tid = req.department.team._id;
    var cid = req.department.company._id;
    var cname = req.department.company.name;
    var tname = req.department.name;

    //生成活动
    var all_teams = [];
    var campaignUnits = [];
    var all_team_ids = [];
    for(var i = 0 ; i < departments.length; i ++){
      all_team_ids.push(departments[i].team._id);
      all_teams.push({
        'teamid':departments[i].team._id,
        'name':departments[i].team.name,
        'logo':departments[i].team.logo
      });
      campaignUnits.push({
        'company':{
          '_id':cid,
          'name':cname,
          'logo':req.department.company.logo
        },
        'team':{
          '_id':departments[i].team._id,
          'name':departments[i].team.name,
          'logo':departments[i].team.logo
        }
      });
    }
    var providerInfo = {
      'cid':[cid],
      'poster':{
        cname:cname,
        cid:cid,
        role:req.session.role,
        tname:tname
      },
      'tid':all_team_ids,
      'campaign_type':6,
      'campaign_unit':campaignUnits
    };
    var photoInfo = {
      owner: {
        model: {
          // _id: campaign._id,
          type: 'Campaign'
        },
        companies: [cid],
        teams: [req.department.team._id]
      },
      name: moment(req.body.start_time).format("YYYY-MM-DD ") + req.body.theme
    };
    var _user;
    if(req.user.provider === 'user'){
      _user ={
        _id: req.user._id,
        name: req.user.nickname,
        type: 'user'
      };
    }else{
      _user={
        _id: req.user._id,
        name: req.user.info.official_name,
        type: 'hr'
      };
    }
    photoInfo.update_user= _user;
    photoInfo.create_user= _user;
    campaign_controller.newCampaign(req.body,providerInfo,photoInfo,function(status,data){
      if(status){
        return res.send({'result':0,'msg':data});
      }
      else{
        req.department.team.photo_album_list.push(data.photo_album_id);
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
            groupMessage.team = all_teams;
            groupMessage.campaign = data.campaign_id;
            groupMessage.department = [req.department._id];
            groupMessage.save(function(err) {
              if (err) {
                console.log(err);
              } else {
                return res.send({'result':1,'campaign_id':data.campaign_id});
              }
            });
          }
        });
      }
    });
  }
  //为了把子部门的小队也放入该活动
  getDeptDepartment(req,res,req.department._id,_sponsor);
};

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
        } else if (!company_group) {
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
                var quit_leader_id = null;
                for(var i = 0 ; i < user.team.length; i ++){
                  if(user.team[i]._id.toString() === company_group._id.toString()){
                    if(user.team[i].leader === true){
                      quit_leader_id = user._id;
                    }
                    user.team.splice(i,1);
                    break;
                  }
                }
                user.save(function (err){
                  if(err){
                    callback(err);
                  }else{
                    if(quit_leader_id!=null)managerUpdate(did,'dismiss',{'_id':quit_leader_id},null);
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

  var user_department;

  if(req.user.provider === 'user'){
    user_department = req.user.department;
  }else{
    user_department = req.body.department;
  }

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
      did: user_department._id,
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
    // 如果有加入部门，先退出之前的部门
    if (user_department && user_department._id && user_department._id.toString() !== did) {
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


var departmentOperate = function(options, callback){
  var did = options.did;
  var user = options.user;
  var method = options.method;
  var member = {
    _id: user._id,
    nickname: user.nickname,
    photo: user.photo,
    apply_status: 'pass'
  }
  var departmentOperate,teamOperate;
  //加入
  if(method) {
    teamOperate = departmentOperate = {
      '$push': {
        'member': member
      }
    }
  }
  //退出
  else {
    departmentOperate = {
      '$pull': {
        'member': {
          '_id': member._id
        },
        'manager':{'_id':member._id}
      }
    }
    teamOperate = {
      '$pull': {
        'member': {
          '_id': member._id
        },
        'leader':{'_id':member._id}
      }
    }
  }
  Department.findByIdAndUpdate({'_id':did},departmentOperate,function(err,department){
    if (err) {
      callback(err);
    }
    else if(!department){
      callback('not found');
    } else {
      CompanyGroup.findByIdAndUpdate({'_id':department.team},teamOperate,function(err,company_group){
        if(err){
          callback(err);
        } else if (!company_group) {
          callback('not found');
        }
        else{
          //加入
          if(method){
            user.department ={'_id':did,'name':department.name};
            user.team.push({'gid':'0','group_type':'virtual','entity_type':'virtual','_id':company_group._id,'name':company_group.name,'logo':company_group.logo})
          }
          //退出
          else{
            user.department = null;
          }
          user.save(function (err){
            if(err){
              callback(err);
            }else{
              callback(null)
            }
          });
        }
      });
    }
  });
}
//手动调用函数
exports.memberOperateByHand = function(user, did,callback) {
  if(user.department) {
    departmentOperate({did:user.department._id,user:user,method:false},function () {
      departmentOperate({did:did,user:user,method:true},callback)
    })
  }
  else {
    departmentOperate({did:did,user:user,method:true},callback)
  }
}

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
    '_id': did,'status':{'$ne':'delete'}
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
    'company._id': cid,'status':{'$ne':'delete'}
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
          'department': undefined
        },
        '$pull':{
          'team':{
            'gid':'0'
          }
        }
      }, {
        'multi': true
      }, function(err, users) {
        Department.update({
          '_id': {
            '$in': delete_ids
          }
        },{'$set':{'status':'delete'}},{'multi':true}, function(err, _department) {
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
  //如果department._id === did 就不用深搜了,直接在department的department里放入子部门
  if (department._id.toString() === did) {
    //操作
    switch (param.type) {
      case 0:
        param.child.parent_id = department._id;
        var parent_level = (department.level != undefined && department.level != null) ? department.level : 0;
        param.child.level = parent_level + 1;

        //console.log(parent_level);

        department.department.push(param.child);

        Department.update({'_id':param.child._id},{'$set':{'level':param.child.level}},function(err,department){
          if(!department){
            console.log({'msg':'DEPARTMENT_LEVEL_SET_NOT_FOUND'});
          }
          if(err){
            console.log({'msg':'DEPARTMENT_LEVEL_SET_ERROR','date':err});
          }
        });
        return department;
      case 1:
        if (department.department.name != undefined) {
          department.department.name = param.name;
        }
        return department;
      default:
        break;
    }
  //did肯定在department的子部门里,因此要深度搜索找到did对应的部门,在其department中放入子部门
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
                param.child.level = pop.department[i].level + 1;
                param.child.parent_id = pop.department[i]._id;
                param.child.department = [];
                pop.department[i].department.push(param.child);

                //console.log(pop.department[i].level);

                Department.update({'_id':param.child._id},{'$set':{'level':param.child.level}},function(err,department){
                  if(!department){
                    console.log({'msg':'DEPARTMENT_LEVEL_SET_NOT_FOUND'});
                  }
                  if(err){
                    console.log({'msg':'DEPARTMENT_LEVEL_SET_ERROR','date':err});
                  }
                });
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
    res.status(403);
    next('forbidden');
    return;
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

          Department
          .findById(did)
          .populate('team')
          .exec()
          .then(function(department) {
            department.name = name;
            department.save(function(err) {
              if (err) {
                console.log(err);
                res.send(500);
              } else {
                department.team.name = name;
                department.team.save(function(err) {
                  if (err) {
                    console.log(err);
                    res.send(500);
                  } else {
                    User.update(
                      {'department._id': department._id},
                      {'department.name': name},
                      {'safe': false, 'multi': true},
                      function(err, users) {
                        if (err) {
                          console.log(err);
                          res.send(500);
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
              }
            });
          })
          .then(null, function(err) {
            console.log(err);
            res.send(500);
          });
        }
      });
    }
  });
};
//删除部门
exports.deleteDepartment = function(req, res) {

  if (req.role !== 'HR') {
    res.status(403);
    next('forbidden');
    return;
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
exports.getDepartment = function(req, res, next) {
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
            'name': company.info.name,
            'department': company.department
          });
          req.session.cid = null;
        }
      })
    } else {
      res.status(403);
      next('forbidden');
      return;
    }
  }else{
    if (req.user&&req.user._id.toString() === req.params.cid) {
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
          name: company.info.name,
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

/**
 * 获取部门树的所有部门的_id，并push进数组中，返回该数组
 *
 * Example:
 * var list = getDepartmentId(company);
 * // list should be [_did1, _did2, ...]
 *
 * 注意: 如果参数department为company对象, 则也会将company._id认为是根节点_id放进返回的数组中
 *
 * @param  {Object} department 部门树的一个节点，可以是company对象
 * @return {Array}            部门的_id数组
 */
var getDepartmentId = function(department) {
  var ids = [department._id];
  if (department.department || department.department.length > 0) {
    for (var i = 0; i < department.department.length; i++) {
      ids = ids.concat(getDepartmentId(department.department[i]));
    }
  }
  return ids;
};


/**
 * 深度优先的方式操作部门树
 * @param  {Object} department 部门树的一个节点，可以是company对象
 * @param  {Function} operate  operate(department)对某一节点进行操作
 */
var doDepartment = function(department, operate) {
  operate(department);
  if (department.department || department.department.length > 0) {
    for (var i = 0; i < department.department.length; i++) {
      doDepartment(department.department[i], operate);
    }
  }
};

/**
 * 复制部门树(仅复制_id和name和level属性)
 * @param  {Object} company mongoose.model('company')
 * @return {Object}         仅包含_id,name,department属性的company对象
 */
var cloneDepartmentTree = function(company) {
  var clone = {
    _id: company._id,
    name: company.info.name,
    level:0
  };

  var _clone = function(departments) {
    var clone = [];
    for (var i = 0; i < departments.length; i++) {
      clone[i] = {
        _id: departments[i]._id,
        name: departments[i].name,
        level: departments[i].level
      };
      if (departments[i].department) {
        clone[i].department = _clone(departments[i].department);
      }
    }
    return clone;
  };

  clone.department = _clone(company.department);
  return clone;
};

/**
 * 返回部门树的详细数据
 * @param  {Object} company        company对象
 * @param  {Array} department_ids 部门_id数组
 * @param  {Object} res            res对象
 */
var sendDepartments = function(company, department_ids, res) {
  Department
  .where('_id').in(department_ids)
  .exec()
  .then(function(departments) {

    var departmentTree = cloneDepartmentTree(company);

    doDepartment(departmentTree, function(department) {
      for (var i = 0; i < departments.length; i++) {
        if (department._id.toString() === departments[i]._id.toString()) {
          department.manager = departments[i].manager;
          break;
        }
      }
    });
    res.send(departmentTree);
  })
  .then(null, function(err) {
    console.log(err);
    res.send(500);
  });
};

/**
 * 获取部门树的详情，包括部门的具体信息
 */
exports.getDepartmentTreeDetail = function(req, res) {
  if (req.user._id.toString() === req.params.cid) {
    var department_ids = getDepartmentId(req.user);
    sendDepartments(req.user, department_ids, res);
  } else {
    Company
    .findById(req.params.cid)
    .exec()
    .then(function(company) {
      if (!company) {
        return res.send(404);
      }

      var department_ids = getDepartmentId(company);
      sendDepartments(company, department_ids, res);
    })
    .then(null, function(err) {
      console.log(err);
      res.send(500);
    });
  }
};


/*
 * param in: req.body.did (部门id,一开始是公司id)
 */
exports.createDepartment = function(req, res) {
  if (req.user.provider === 'company') {
    var did = req.body.did;
    var name = req.body.name;
    var cid = req.body.cid;

    if (req.user._id.toString() !== cid) {
      res.status(403);
      next('forbidden');
      return;
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
          'parent_department': did,
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
                  'level':0,
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
    res.status(403);
    next('forbidden');
    return;
  }
}


exports.renderHome = function(req, res) {
  var department = req.department;
  console.log('run')
  res.redirect('/group/page/' + department.populated('team'));
  // PhotoAlbum
  //   .where('_id').in(department.team.photo_album_list)
  //   .exec()
  //   .then(function(photo_albums) {
  //     if (!photo_albums) {
  //       return res.send(404);
  //     }
  //     var photo_album_thumbnails = [];

  //     for (var i = 0; i < photo_albums.length; i++) {
  //       if (photo_albums[i].owner.model.type === 'Campaign' && photo_albums[i].photos.length === 0) {
  //         continue;
  //       }
  //       if (photo_albums[i].hidden === true) {
  //         continue;
  //       }
  //       var thumbnail_uri = photo_album_controller.photoAlbumThumbnail(photo_albums[i]);
  //       photo_album_thumbnails.push({
  //         uri: thumbnail_uri,
  //         name: photo_albums[i].name,
  //         _id: photo_albums[i]._id
  //       });
  //       if (photo_album_thumbnails.length === 4) {
  //         break;
  //       }
  //     }

  //     if (req.role === 'HR') {
  //       return res.render('department/home', {
  //         'title': department.team.cname+department.team.name,
  //         'department': department,
  //         'role': req.role,
  //         'tname': department.team.name,
  //         'number': department.team.member ? department.team.member.length : 0,
  //         'score': department.team.score ? department.team.score : 0,
  //         'logo': department.team.logo,
  //         'group_id': department.team._id,
  //         'cname': department.team.cname,
  //         'sign': department.team.brief,
  //         'gid': department.team.gid,
  //         'photo_album_thumbnails': photo_album_thumbnails
  //       });
  //     } else {
  //       var myteam = req.user.team;
  //       var _myteam = [];
  //       var myteamLength= myteam.length;
  //       for(var i = 0; i < myteamLength; i ++) {
  //         if(myteam[i].gid !== '0'){
  //           //下面查找的是该成员加入和未加入的所有active小队
  //           if(myteam[i].leader) {
  //             //判断此人是否是此队队长，并作标记
  //             _myteam.unshift({
  //               _id:myteam[i]._id,
  //               name:myteam[i].name,
  //               logo:myteam[i].logo,
  //               leader:myteam[i].leader
  //             });
  //           }
  //           else{
  //             _myteam.push({
  //               _id:myteam[i]._id,
  //               name:myteam[i].name,
  //               logo:myteam[i].logo,
  //               leader:myteam[i].leader
  //             });
  //           }
  //         }
  //       }

  //       return res.render('department/home', {
  //         'title': department.team.cname+department.team.name,
  //         'department': department,
  //         'myteam':_myteam,
  //         'tname': department.team.name,
  //         'number': department.team.member ? department.team.member.length : 0,
  //         'score': department.team.score ? department.team.score : 0,
  //         'role': req.role,
  //         'logo': department.team.logo,
  //         'group_id': department.team._id,
  //         'cname': department.team.cname,
  //         'sign': department.team.brief,
  //         'gid': department.team.gid,
  //         'photo': req.user.photo,
  //         'realname': req.user.realname,
  //         'photo_album_thumbnails': photo_album_thumbnails
  //       });
  //     }

  //   });

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
  res.render('department/info');
};

exports.renderDepartmentManager = function(req, res) {
  res.render('department/manager');
};

