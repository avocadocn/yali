'use strict';

//部门

var mongoose = require('mongoose'),
    encrypt = require('../middlewares/encrypt'),
    crypto = require('crypto'),
    async = require('async'),
    meanConfig = require('../../config/config'),
    User = mongoose.model('User'),
    Department = mongoose.model('Department')
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup');


var departmentFindAndUpdate = function(department,did,child){
  for(var i = 0; i < department.department.length; i ++){
    if(department._id.toString() === did){

    }else{
      
    }
  }
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
            //没有任何部门,进来的是公司id
            if(req.user._id === did){
              var child = {
                'parent_id':req.user._id,
                '_id':department._id,
                'name':name
              }
              Company.findByIdAndUpdate({'_id':req.user._id},{'$push':{'department':child}},function (err,company){
                if(err || !company){
                  res.send({'msg':'COMPANY_DEPARTMENT_UPDATE_FAILURE'});
                }else{
                  res.send('msg':'DEPARTMENT_ADD_SUCCESS','department':child);
                }
              });
            //已经有部门了
            }else{
              Company.findOne({'_id':req.user._id},function (err,company){

              });
            }
          }
        });
      }
    });
  }else{
    res.send(403);
  }
}