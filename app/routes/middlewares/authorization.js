'use strict';
var model_helper = require('../../helpers/model_helper');
// mongoose and models
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  CompanyGroup = mongoose.model('CompanyGroup'),
  Company = mongoose.model('Company'),
  Campaign = mongoose.model('Campaign'),
  Department = mongoose.model('Department');
var userController = require('../../controllers/users');
/**
 * Generic require login routing middleware
 */
exports.companyAuthorize = function(req, res, next){
  if (!req.user) {
    return res.redirect('/');
  }

  if(req.route.path==='/company/home' && !req.company){
    if(req.user.provider==='company'){
      req.role = 'HR';
    }
    else{
      req.role = 'EMPLOYEE';
    }

  }
  else{
    if(req.user.provider==='company' && req.company._id.toString() === req.user._id.toString()){
      req.role = 'HR';
    }
    else if(req.user.provider ==='user' && req.company._id.toString() === req.user.cid.toString()){
      req.role = 'EMPLOYEE';
    }
    // else{
    //   if(req.user.role == 'LEADER'){
    //     req.role = 'GUESTLEADER';
    //   }
    else{
      req.role = 'GUEST';
    }
  }
  next();
};



exports.commentAuthorize = function(req, res, next) {
  if (!req.user) {
    return res.redirect('/');
  }
  else {
    switch(req.params.commentType){
      case 'campaign':
        Campaign.findOne({'_id':req.params.commentId},function (err, campaign){
          if(err || !campaign){
            return res.send(403,'forbidden!');
          }else{
            if(campaign.team.indexOf(req.user._id.toString()) > -1){
              req.role = 'HR';
              next();
            }else{
              campaign.team.forEach(function(team){
                var team_index = model_helper.arrayObjectIndexOf(req.user.team,team,'_id');
                if (team_index>-1){
                  if(req.user.team[team_index].leader ===true){
                    req.role = 'LEADER';
                  }
                  else if(req.role !== 'LEADER'){
                    req.role = 'MEMBER';
                  }

                }
                else if(req.role==undefined){
                  req.role = 'PARTNER';
                }
              });
              next();
            }
          }
        });
        break;
      case 'team':
        CompanyGroup.findOne({'_id':req.params.commentId},function (err,company_group){
          if(err || !company_group){
            return res.send(403,'forbidden!');
          }else{
            if(req.user._id.toString() === company_group.cid.toString()){
              req.role === 'HR';
              next();
            }else{
              var _teamIndex = model_helper.arrayObjectIndexOf(req.user.team,company_group._id,'_id');
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
              next();
            }
          }
        });
        break;
      case 'album':
        //暂时不用做
        next();
        break;
      case 'user':
        next();
        break;
      default:
        return res.send(403,'forbidden!');
        break;
    }
  }
}
exports.departmentAuthorize = function(req, res, next) {
  if (!req.user) {
    return res.redirect('/');
  }
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
        return next();
      }
    } else if (req.user.provider === 'user') {
      if (department.manager) {
        for (var i = 0; i < department.manager.length; i++) {
          if (req.user._id.toString() === department.manager[i]._id.toString()) {
            req.role = 'LEADER';
            return next();
          }
        }
      }
      for (var i = 0, members = department.team.member; i < members.length; i++) {
        if (req.user._id.toString() === members[i]._id.toString()) {
          req.role = 'MEMBER';
          return next();
        }
      }
      if (req.user.cid.toString() === department.company._id.toString()) {
        req.role = 'PARTNER';
        return next();
      }
    }

    req.role = 'GUEST';
    return next();
  })
  .then(null, function(err) {
    console.log(err);
    res.send(500);
  });
};

exports.messageAuthorize = function(req,res,next){
  if (!req.user) {
    return res.redirect('/');
  }
  if(req.user.provider === 'user'){
    if(req.params.teamId != undefined && req.params.teamId != null && req.params.teamId != ''){
      //队长
      CompanyGroup.findOne({'_id':req.params.teamId},function (err,company_group){
        if(err || !company_group){
          return res.send(404);
        }else{
          req.companyGroup = company_group;
          exports.teamAuthorize(req,res,next);
        }
      });
      //个人
    }else{
      req.role = 'MEMBER';
      next();
    }
  }else{
    //公司
    req.role = 'HR';

    if(req.params.teamId != undefined && req.params.teamId != null && req.params.teamId != ''){
      //公司给小队发站内信
      CompanyGroup.findOne({'_id':req.params.teamId},function (err,company_group){
        if(err || !company_group){
          return res.send(404);
        }else{
          req.companyGroup = company_group;
          next();
        }
      });
      //个人
    }else{
      next();
    }
  }
}

exports.teamAuthorize = function(req, res, next) {
  if (!req.user) {
    return res.redirect('/');
  }
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
  if (!req.user) {
    return res.redirect('/');
  }
  if(req.route.path==='/users/home' && !req.profile){
    req.role = 'OWNER';
  }
  else{
    if(req.profile && req.profile._id.toString() === req.user._id.toString()){
      req.role = 'OWNER';
    }
    else if(req.profile && req.user._id.toString() === req.profile.cid.toString()){
      req.role = 'HR';
    }
    else if(req.profile && req.profile.cid.toString() === req.user.cid.toString()){
      req.role = 'PARTNER';
    }else{
      return res.send(403, 'forbidden!');
    }
  }
  next();
};
exports.listAuthorize = function(req,res, next){
  if (!req.user) {
    return res.redirect('/');
  }
  if(req.params.pageType==='user'){
    User
    .findOne({
         _id: req.params.pageId
    })
    .exec(function(err, user) {
        if (err) return next(err);
        if (!user) return next(new Error('Failed to load User ' + req.params.pageId));
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
          if (!companyGroup) return next(new Error(' Failed to load companyGroup ' + req.params.pageId));
          req.companyGroup = companyGroup;
          exports.teamAuthorize(req,res, next);
      });
  }
  else if(req.params.pageType==='company'){
    Company
      .findOne({
        _id: req.params.pageId
      })
      .exec(function(err, company) {
          if (err) return next(err);
          if (!company) return next(new Error(' Failed to load company ' + req.params.pageId));
          req.company = company;
          exports.companyAuthorize(req,res, next);
      });
  }
}
exports.logoAuthorize = function(req, res, next){
  // if(req.body.target==='u'){
  //   User
  //   .findOne({
  //        _id: req.body.userId
  //   })
  //   .exec(function(err, user) {
  //       if (err) return next(err);
  //       if (!user) return next(new Error('Failed to load User ' + id));
  //       if(req.user.provider==='company'&&req.user._id.toString()===user.cid.toString()||req.user.provider==='user'&&req.user._id.toString()===user._id.toString()){
  //         next();
  //       }
  //       else{
  //         return res.send(403, 'forbidden!');
  //       }
  //   });

  // }
  if (!req.user) {
    return res.redirect('/');
  }
  if(req.body.target==='g'){
    if(req.user.provider==='company'&&model_helper.arrayObjectIndexOf(req.user.team,req.body.teamId,'id')>-1||req.user.provider==='user'&&req.user.team[model_helper.arrayObjectIndexOf(req.user.team,req.companyGroup._id,'_id')].leader===true){
      next();
    }
    else{
      return res.send(403, 'forbidden!');
    }
  } else {
    next();
  }
  // else if(req.body.target==='c'){
  //   if(req.user._id.toString()===req.body.companyId){
  //     next();
  //   }
  //   else{
  //     return res.send(403, 'forbidden!');
  //   }
  // }
  // else{
  //   return res.send(403, 'forbidden!');
  // }
}
exports.campaginAuthorize = function(req, res, next){
  if (!req.user) {
    return res.redirect('/');
  }
  if(req.user.provider==='company' && req.campaign.cid.indexOf(req.user._id.toString())>-1){
    req.role = 'HR';
  }
  else if(req.user.provider==='user' && req.campaign.cid.indexOf(req.user.cid.toString())>-1){
    if(req.campaign.team.length===0){
      req.role = 'MEMBER';
    }
    else {
      req.campaign.team.forEach(function(team){
        var team_index = model_helper.arrayObjectIndexOf(req.user.team,team,'_id');
        if (team_index>-1){
          if(req.user.team[team_index].leader ===true){
            req.role = 'LEADER';
          }
          else if(req.role !== 'LEADER'){
            req.role = 'MEMBER';
          }

        }
        else if(req.role==undefined){
          req.role = 'PARTNER';
        }
      });
    }
  }
  else{
    return res.send(403,'forbidden');
  }
  next();
}
exports.appToken = function(req, res, next){
  if (!req.user) {
    var userId,appToken;
    if(req.params.userId){
      userId = req.params.userId;
      appToken = req.params.appToken;
    }
    else if(req.body.userId){
      userId = req.body.userId;
      appToken = req.body.appToken;
    }
    else{
      return res.send(403,'forbidden');
    }
    User
    .findOne({
         _id: req.params.userId,
         app_token:req.params.appToken
    })
    .exec(function(err, user) {
      console.log(user);
      if(!err&&user){
        req.login(user, function(err) {
          if (err) {
          return next(err);
          }
          else{
            next();
          }
        });
      }
      else{
        return res.send(403,'forbidden');
      }
    });
  }
  else{
    next();
  }
}
