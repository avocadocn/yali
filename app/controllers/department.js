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


var stack = new StackAndQueue.stack();
var stack_root = new StackAndQueue.stack();
//var queue = new StackAndQueue.queue();






var deleteFromRoot = function(department,req,res){
  var delete_ids = [];
  delete_ids.push(department._id);
  stack.push({
    '_id':department._id,
    'department':department.department
  });
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
  Department.remove({'_id':{'$in':delete_ids}},function(err,department){
    if(err || !department){
      return res.send({'msg':'DEPARTMENT_DELETE_FAILURE','department':[]});
    }else{
      return res.send({'msg':'DEPARTMENT_DELETE_SUCCESS','department':req.user.department});
    }
  });
}

var operateFromRootAndDeleteOne = function(did,req,res){
  //从根部开始找
  stack.push({
    '_id':req.user._id,
    'department':req.user.department
  });
  while(!stack.isEmpty()){
    var pop = stack.pop();
    if(pop.department.length > 0){
      for(var i = 0; i < pop.department.length; i ++){

        if(pop.department[i]._id === did){
          deleteFromRoot(pop.department[i],res);
          pop.department.splice(i,1);
        }else{
          stack.push(pop.department[i]);
        }
      }
    }
  }
}





//深度优先修改算法
//第一次传进来的是company
var departmentFindAndUpdate = function(department,did,param){
  if(department._id === did){
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
          if(pop.department[i]._id === did){
            //操作
            switch(param.type){
              case 0:
                param.child.parent_id = pop.department[i]._id;
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
        company.department = departmentFindAndUpdate(company,did,param).department;
        company.save(function (err){
          if(err){
            res.send({'msg':'DEPARTMENT_UPDATE_FAILURE'});
          }else{
            res.send({'msg':'DEPARTMENT_UPDATE_SUCCESS','department':company.department});
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
    operateFromRootAndDeleteOne(did,req,res);
  }else{
    res.send(403);
  }
}

//获取树形部门数据
exports.getDepartment = function(req,res){
  if(req.session.role === 'HR'){
    res.send({'msg':'DEPARTMENT_GET_SUCCESS','department':req.user.department});
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
                  'name':name
                };
                var param = {
                  'type':0,
                  'child':child
                };
                company.department = departmentFindAndUpdate(company,did,param).department;
                company.save(function (err){
                  if(err){
                    res.send({'msg':'DEPARTMENT_UPDATE_FAILURE'});
                  }else{
                    res.send({'msg':'DEPARTMENT_ADD_SUCCESS','department':company.department});
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