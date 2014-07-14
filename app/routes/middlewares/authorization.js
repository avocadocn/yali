'use strict';
var model_helper = require('../../helpers/model_helper');
// mongoose and models
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  CompanyGroup = mongoose.model('CompanyGroup'),
  Department = mongoose.model('Department');
/**
 * Generic require login routing middleware
 */
exports.companyAuthorize = function(req, res, next){
    if(req.user.provider==='company' && ( !req.params.companyId || req.params.companyId === req.user._id.toString())){
        req.role = 'HR';
    }
    else if(req.user.provider ==='user' && (!req.params.companyId || req.params.companyId === req.user.cid.toString())){
        req.role = 'EMPLOYEE';
    }
    else{
        if(req.user.role == 'LEADER'){
          req.role = 'GUESTLEADER';
        }else{
          req.role = 'GUEST';
        }
    }
    next();
};
exports.departmentAuthorize = function(req, res, next) {
  Department
  .findById(req.params.departmentId)
  .populate('team')
  .exec()
  .then(function(department) {
    if (!department) {
      return res.send(404);
    }
    req.department = department;
    if (req.user.provider === 'company') {
      if (req.user._id.toString() === department.company._id.toString()) {
        req.role = 'HR';
      }
    } else if (req.user.provider === 'user') {
      if (department.manager) {
        if (req.user._id.toString() === department.manager._id.toString()) {
          req.role = 'DEPARTMENT_MANAGER';
        }
      }
    }

    if (!req.role) {
      req.role = 'GUEST';
    }
    next();
  })
  .then(null, function(err) {
    console.log(err);
    res.send(500);
  });
};
exports.teamAuthorize = function(req, res, next) {
  if(req.user.provider==="company"){
    if(req.user._id.toString() ===req.companyGroup.cid.toString()){
      req.role = 'HR';
    }
    else{
      req.role = 'GUESTHR';
    }
  }
  else if(req.user.provider==="user" && req.user.cid.toString() ===req.companyGroup.cid.toString()){
    var _teamIndex = model_helper.arrayObjectIndexOf(req.user.team,req.companyGroup._id,'_id');
    if(_teamIndex>-1){
      if(req.user.team[_teamIndex].leader === true){
        req.role = 'LEADER';
      }
      else{
        if(req.user.role==='LEADER')
          req.role = 'MEMBERLEADER';
        else
          req.role = 'MEMBER';
      }
    }
    else{
      if(req.user.role==='LEADER')
        req.role = 'PARTNERLEADER'
      else
        req.role = 'PARTNER';
    }
  }
  else{
    if(req.user.role == 'LEADER'){
      for(var i=0;i<req.user.team.length;i++){
        if(req.user.team[i].leader==true && req.user.team[i].gid==req.companyGroup.gid){
          req.role = 'GUESTLEADER';//同类型
          break;
        }
      }
      if(req.role !== 'GUESTLEADER'){
        req.role = 'GUEST';
      }
    }else{
      req.role = 'GUEST';
    }
  }
  next();
};
exports.userAuthorize = function(req, res, next) {
  if(!req.params.userId || req.params.userId === req.user._id.toString()){
    req.role = 'OWNER';
  }
  else if(req.params.userId && req.user._id.toString() === req.profile.cid.toString()){
    req.role = 'HR';
  }
  else if(req.params.userId && req.profile.cid.toString() === req.user.cid.toString()){
    req.role = 'PARTNER';
  }else{
    return res.send(403, 'forbidden!');
  }
  next();
};
exports.groupMessageAuthorize = function(req,res, next){
  if(req.params.pageType==='user'){
    User
    .findOne({
         _id: req.params.pageId
    })
    .exec(function(err, user) {
        if (err) return next(err);
        if (!user) return next(new Error('Failed to load User ' + id));
        req.profile = user;
        exports.userAuthorize(req,res, next);
    });
  }
  else if(req.params.pageType==='team'){
    CompanyGroup
      .findOne({
        _id: req.params.pageId
      })
      .exec(function(err, companyGroup) {
          if (err) return next(err);
          if (!companyGroup) return next(new Error(' Failed to load companyGroup ' + id));
          req.companyGroup = companyGroup;
          exports.teamAuthorize(req,res, next);
      });
  }
}
exports.logoAuthorize = function(req, res, next){
  if(req.body.target==='u'){
    User
    .findOne({
         _id: req.body.userId
    })
    .exec(function(err, user) {
        if (err) return next(err);
        if (!user) return next(new Error('Failed to load User ' + id));
        if(req.user.provider==='company'&&req.user._id.toString()===user.cid.toString()||req.user.provider==='user'&&req.user._id.toString()===user._id.toString()){
          next();
        }
        else{
          return res.send(403, 'forbidden!');
        }
    });

  }
  else if(req.body.target==='g'){
    if(req.user.provider==='company'&&model_helper.arrayObjectIndexOf(req.user.team,req.body.teamId,'id')>-1||req.user.provider==='user'&&req.user.team[model_helper.arrayObjectIndexOf(req.user.team,req.companyGroup._id,'_id')].leader===true){
      next();
    }
    else{
      return res.send(403, 'forbidden!');
    }
  }
  else if(req.body.target==='c'){
    if(req.user._id.toString()===req.body.companyId){
      next();
    }
    else{
      return res.send(403, 'forbidden!');
    }
  }
  else{
    return res.send(403, 'forbidden!');
  }
}