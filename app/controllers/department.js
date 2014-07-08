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
//var queue = new StackAndQueue.queue();

//深度优先插入算法
var departmentFindAndUpdate = function(department,did,child){
  if(department._id === did){
    //插入
    child.parent_id = department._id;
    department.department.push(child);
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
            //插入
            child.parent_id = pop.department[i]._id;
            pop.department[i].department.push(child;)
          }else{
            stack.push(pop.department[i]);
          }
        }
      }
    }
  }
  return department;
}


//只要传进来一个部门id即可
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
              var child = {
                '_id':department._id,
                'name':name
              }
              departmentFindAndUpdate(company,did,child);
              company.department = departmentFindAndUpdate(company,did,child).department;
              company.save(function (err){
                if(err){
                  res.send('msg':'DEPARTMENT_UPDATE_FAILURE');
                }else{
                  res.send('msg':'DEPARTMENT_ADD_SUCCESS','department':child);
                }
              })
            });
          }
        });
      }
    });
  }else{
    res.send(403);
  }
}