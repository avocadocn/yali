'use strict';

//部门

var mongoose = require('mongoose'),
    encrypt = require('../middlewares/encrypt'),
    StackAndQueue = require('../helpers/stackAndQueue'),
    crypto = require('crypto'),
    async = require('async'),
    User = mongoose.model('User'),
    Department = mongoose.model('Department'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup');


//消除递归使用的栈
var stack = new StackAndQueue.stack();
var stack_root = new StackAndQueue.stack();




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



//部门之间挑战
exports.provoke = function(req,res){

}


//部门之间应战
exports.responseProvoke = function(req,res){

}



//部门发活动
exports.sponsor = function(req,res){

}



var teamOperate = function(did,operate,res,req){
  Department.findOne({'_id':did},function(err,department){
    if(err || !department){
      return res.send(500);
    }else{
      CompanyGroup.findByIdAndUpdate({'_id':department.team},operate,function(err,company_group){
        if(err || !department){
          return res.send(500);
        }else{
          return res.send(200,{'member':company_group.member});
        }
      });
    }
  });
}
//前提是User里员工已经提出申请
//部门成员加退
exports.memberOperate = function(req,res){
  var did = req.body.did;
  var operate = req.body.operate;
  var member =req.body.member;
  if(operate === 'join'){
    //员工提出申请后加入
    teamOperate(did,{'$push':{'member':member}},req,res);
  }
  if(operate === 'quit'){
    //踢掉
    teamOperate(did,{'$pull':{'member':{'_id':member._id}}},req,res);
  }
}

//处理员工申请
exports.applyOperate = function(req,res){
  var did = req.body.did;
  var apply_status = req.body.apply_status;
  var apply_members = req.body.apply_members;  //ids是数组,因为可以批量处理申请
  Department.findOne({'_id':did},function (err,department){
    if(err || !department){
      res.send(500);
    }else{
      var members = [];
      for(var i = 0 ; i < department.member_apply.length; i ++){
        for(var j = 0; j < apply_members.length; j ++){
          if(apply_members[j]._id.toString() === department.member_apply[i].toString()){
            members.push(apply_members[j]);
            department.member_apply[i].apply_status = apply_status;
            break;
          }
        }
      }
      department.save(function(err){
        if(err){
          res.send(500);
        }else{
          CompanyGroup.findOne({'_id':department.team},function (err,company_group){
            if(err || !company_group){
              res.send(500);
            }else{
              var old_member = company_group.member;
              company_group.member = old_member.concat(members);
              company_group.save(function(err){
                if(err){
                  res.send(500);
                }else{
                  res.send(200,{'member_apply':department.member_apply})
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
exports.getApplyInfo = function(req,res){
  var did = req.body.did;
  Department.findOne({'_id':did},function (err,department){
    if(err || !department){
      res.send(500);
    }else{
      res.send(200,{'member_apply':department.member_apply});
    }
  })
}

//获取某一部门的详细信息
exports.getDepartmentDetail = function(req,res){
  var did = req.body.did;
  Department.findOne({'_id':did}).populate('team').exec(function(err,department){
    if(err || !department){
      res.send(500,{'department':null});
    }else{
      res.send(200,{'department':department})
    }
  });
}


var deleteFromRoot = function(department,seq,req,res){
  stack = null;
  stack = new StackAndQueue.stack();
  var delete_ids = [];

  //删除某个部门以及其下的所有部门
  if(seq != -1){
    delete_ids.push(department[seq]._id);
    stack.push({
      '_id':department[seq]._id,
      'department':department[seq].department
    });
  //删除公司下的所有部门
  }else{
    stack.push({
      '_id':department._id,
      'department':department.department
    });
  }
  while(!stack.isEmpty()){
    var pop = stack.pop();
    if(pop.department.length > 0){
      for(var i = 0; i < pop.department.length; i ++){
        //待删除的部门id
        delete_ids.push(pop.department[i]._id);
        stack.push(pop.department[i]);
      }
    }
  }
  Department.remove({'_id':{'$in':delete_ids}},function(err,_department){
    if(err || !_department){
      return res.send({'msg':'DEPARTMENT_DELETE_FAILURE','department':[]});
    }else{

      if(seq != -1){
        department.splice(seq,1);
      }else{
        req.user.department = [];
      }

      Company.findOne({'_id':req.user._id},function(err,company){
        if (err || !company){
          res.send({'msg':'DEPARTMENT_DELETE_FAILURE','department':[]});
        }else{
          company.department = req.user.department;
          company.save(function(err){
            if(err){
              res.send({'msg':'DEPARTMENT_DELETE_FAILURE','department':[]});
            }else{
              res.send({
                'msg':'DEPARTMENT_DELETE_SUCCESS',
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
}
var operateFromRootAndDeleteOne = function(did,req,res){
  stack = null;
  stack = new StackAndQueue.stack();
  var find = false;
  //从根部开始找
  stack.push({
    '_id':req.user._id,
    'department':req.user.department
  });
  while(!stack.isEmpty() && !find){
    var pop = stack.pop();
    if(pop.department.length > 0){
      for(var i = 0; i < pop.department.length && !find; i ++){

        if(pop.department[i]._id.toString() === did.toString()){
          find = true;

          //pop.department.splice(i,1);

          deleteFromRoot(pop.department,i,req,res);
          return;

        }else{
          stack.push(pop.department[i]);
        }

      }
    }
  }
  if(!find){
    return res.send({'msg':'DEPARTMENT_DELETE_SUCCESS','department':req.user.department});
  }
}





//深度优先修改算法
//第一次传进来的是company
var departmentFindAndUpdate = function(department,did,param){
  stack = null;
  stack = new StackAndQueue.stack();
  if(department._id.toString() === did){
    //操作
    switch(param.type){
      case 0:
        param.child.parent_id = department._id;
        department.department.push(param.child);
        return department;
      case 1:
        if(department.department.name != undefined){
          department.department.name = param.name;
        }
        return department;
      default:break;
    }
  }else{
    stack.push({
      '_id':department._id,
      'department':department.department
    });
    while(!stack.isEmpty()){
      var pop = stack.pop();
      if(pop.department.length > 0){
        for(var i = 0; i < pop.department.length; i ++){
          if(pop.department[i]._id.toString() === did.toString()){
            //操作
            switch(param.type){
              case 0:
                param.child.parent_id = pop.department[i]._id;
                param.child.department = [];
                pop.department[i].department.push(param.child);
              return department;
              case 1:
                pop.department[i].name = param.name;
              return department;
              default:break;
            }
          }else{
            stack.push(pop.department[i]);
          }
        }
      }
    }
  }
  return department;
}


//修改部门信息
exports.modifyDepartment = function(req,res){
  if(req.session.role === 'HR'){
    var did = req.body.did;
    var name = req.body.name;
    Company.findOne({'_id':req.user._id},function (err,company){
      if(err || !company){
        res.send({'msg':'DEPARTMENT_UPDATE_FAILURE'});
      }else{
        var param = {
          'type':1,
          'name':name
        };
        company.department = departmentFindAndUpdate(req.user,did,param).department;
        company.save(function (err){
          if(err){
            res.send({'msg':'DEPARTMENT_UPDATE_FAILURE'});
          }else{
            res.send({
              'msg':'DEPARTMENT_UPDATE_SUCCESS',
              '_id': company._id,
              'name': company.info.name,
              'department':company.department
            });
          }
        });
      }
    });
  }else{
    res.send(403);
  }
}
//删除部门
exports.deleteDepartment = function(req,res){
  if(req.session.role === 'HR'){
    var did = req.body.did;
    if(did.toString() === req.user._id.toString()){
      //删除该公司下的所有部门
      deleteFromRoot(req.user,-1,req,res);
    }else{
      //删除某个部门以及其下所有子部门
      operateFromRootAndDeleteOne(did,req,res);
    }
  }else{
    res.send(403);
  }
}

//获取树形部门数据
exports.getDepartment = function(req,res){
  if(req.session.role === 'HR'){
    res.send({
      '_id': req.user._id,
      'name': req.user.info.name,
      'department': req.user.department
    });
  }else{
    res.send(403);
  }
}

/*
 * param in: req.body.did (部门id,一开始是公司id)
 */
exports.createDepartment = function(req,res){
  if(req.session.role === 'HR'){
    var did = req.body.did;
    var name = req.body.name;

    var team_create = {
      'cid':req.user._id,
      'gid':'0',
      'group_type':'virtual',
      'cname':req.user.info.name,
      'entity_type':'virtual'
    }
    CompanyGroup.create(team_create,function (err,company_group){
      if(err || !company_group){
        res.send({'msg':'TEAM_CREATE_FAILURE'});
      }else{
        var department_create = {
          'name':name,
          'company':{
            '_id':req.user._id,
            'name':req.user.info.name,
            'logo':req.user.info.logo
          },
          'team':company_group._id
        };
        Department.create(department_create,function (err,department){
          if(err || !department){
            res.send({'msg':'DEPARTMENT_CREATE_FAILURE'});
          }else{
            Company.findOne({'_id':req.user._id},function (err,company){
              if(err || !company){
                res.send({'msg':'DEPARTMENT_UPDATE_FAILURE'});
              }else{
                var child = {
                  '_id':department._id,
                  'name':name,
                  'department':[]
                };
                var param = {
                  'type':0,
                  'child':child
                };
                company.department = departmentFindAndUpdate(req.user,did,param).department;

                company.save(function (err){
                  if(err){
                    res.send({'msg':'DEPARTMENT_UPDATE_FAILURE'});
                  }else{
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
  }else{
    res.send(403);
  }
}