'use strict';
var model_helper = require('../../helpers/model_helper');
// mongoose and models
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  CompanyGroup = mongoose.model('CompanyGroup'),
  Company = mongoose.model('Company'),
  Campaign = mongoose.model('Campaign'),
  Department = mongoose.model('Department'),
  Comment = mongoose.model('Comment'),
  PhotoAlbum = mongoose.model('PhotoAlbum');
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
  //pull、push评论不需要分队长非队长，只需cid一样即可，但是为了以防万一以后需要还是设一下member、leader
  //Owner: 个人 本人
  //Guest: 非本公司,不论是否是HR
  //HR: HR
  //Partner: 本公司成员
  //Member: 以防万一先作添加,某team/某活动的teams的member
  //Leader: 以防万一先作添加,某team/某活动的teams的leader
  if (!req.user) {
    return res.redirect('/');
  }
  else {
    switch(req.params.commentType){
      case 'delete'://删除
        //不管在哪，判断这个活动内，这个人是否有权限去删除它
        //故需要传：操作者req.user,commentid->活动id(由comment的host_id去取)
        //reply???
        Comment.findOne({'_id':req.params.hostId},function (err, comment){
          if(err || !comment){
            res.status(403);
            next('forbidden');
            return;
          }
          else if(req.user._id.toString()===comment.poster._id.toString()){
            req.role = 'OWNER';
            next();
          }
          else if(req.user._id.toString() === comment.poster.cid.toString()) {
            req.role = 'HR';
            next();
          }
          else if(req.user.cid.toString()!==comment.poster.cid.toString()){
            req.role = 'GUEST';
            next();
          }
          else if(req.user.role==='LEADER'){
            Campaign.findOne({'_id':comment.host_id},function(err,campaign){
              if(err || !campaign){
                res.status(403);
                next('forbidden');
                return;
              };
              var ct = campaign.campaign_type;
              if(ct === 1){//公司活动，直接partner
                req.role = 'PARTNER';
                next();
              }
              else if(ct === 6){//部门管理员todo

              }
              else {//如果是活动非competition，看这个人是否是某个team的队长即可
                var _teamIndex = null;
                for(var i=0;i<campaign.team.length;i++){
                  _teamIndex = model_helper.arrayObjectIndexOf(req.user.team,campaign.team[i],'_id');
                  if(_teamIndex>-1 && req.user.team[_teamIndex].leader === true){
                    req.role = 'LEADER';
                    next();
                  }
                }
                if(req.role!='LEADER'){
                  req.role = 'PARTNER';
                  next();
                }
              }
              // else{//如果是competition
              //   var teamIds = [];
              //   for(var i=0;i<campaign.camp.length;i++){
              //     teamIds.push(campaign.camp.team[i]._id);
              //   }
              //   CompanyGroup.find({'_id':{$in:teamIds}},function(err,companyGroups){
              //     if(err||!companyGroups){
              //       res.status(403);
              //       next('forbidden');
              //       return;
              //     }
              //     for(var i=0;i<companyGroups.length;i++){
              //       if(model_helper.arrayObjectIndexOf(companyGroups[i].leader,req.user._id,'_id')>-1 ){
              //         req.role = 'LEADER';
              //         next();
              //       }
              //     }
              //   });
              // }
            });
          }
          else{
            req.role = 'PARTNER';
          }
        });
        break;
      case 'competition':
      case 'campaign'://活动详情
        Campaign.findOne({'_id':req.params.hostId},function (err, campaign){
          if(err || !campaign){
            res.status(403);
            next('forbidden');
            return;
          }
          else if(campaign.cid.indexOf(req.user._id.toString()) > -1){
            req.role = 'HR';
          }
          else if(req.user.cid && campaign.cid.indexOf(req.user.cid.toString())>-1){//是这个公司的员工
            if(req.user.role==='LEADER'){
              var _teamIndex;
              for(var i=0;i<campaign.team.length;i++){
                _teamIndex = model_helper.arrayObjectIndexOf(req.user.team,campaign.team[i],'_id')
                if(_teamIndex>-1){
                  if(req.user.team[_teamIndex].leader===true){
                    req.role = 'LEADER';
                    break;
                  }
                }
              }
            }
            if(req.role!=='LEADER'){
              req.role = 'PARTNER';
            }
          }else{
            req.role = 'GUEST';
          }
          next();
        });
        break;
      case 'photo':
        //通过album来判断是否是leader
        PhotoAlbum.findOne({'photos':{"$elemMatch":{'_id':req.params.hostId}}},function (err, photoAlbum){
          if(err || !photoAlbum){
            res.status(403);
            next('forbidden');
            return;            
          }
          else if(photoAlbum.owner.companies.indexOf(req.user._id.toString())>-1){
            req.role = 'HR';
            next();
          }
          else if(req.user.cid && photoAlbum.owner.companies.indexOf(req.user.cid)>-1){//是此相册所属公司员工
            if(req.user.role==='LEADER'){
              var _teamIndex;
              for(var i=0;i<photoAlbum.owner.teams.length;i++){
                _teamIndex = model_helper.arrayObjectIndexOf(req.user.team,photoAlbum.owner.teams[i],'_id')
                if(_teamIndex>-1){
                  if(req.user.team[_teamIndex].leader===true){
                    req.role = 'LEADER';
                    break;
                  }
                }
              }
            }
            if(req.role!=='LEADER'){
              req.role = 'PARTNER';
            }
            next();
          }
          else{
            req.role = 'GUEST';
            next();
          }
        });
        break;
      default:
        res.status(403);
        next('forbidden');
        return;
    }
  }
}
exports.departmentAuthorize = function(req, res, next) {
  if (!req.user) {
    return res.redirect('/');
  }
  if(req.params.cid != undefined && req.params.cid != null && req.params.cid != ""){
    if(req.user.provider == 'company'){
      if(req.user._id.toString() === req.params.cid.toString()){
        req.role = 'HR';
        return next();
      }else{
        req.role = 'GUESTHR';
        return next();
      }
    }else{
      res.status(403);
      next('forbidden');
      return;
    }
  }else{
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
  }
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
    if(req.params.cid != undefined && req.params.cid != null && req.params.cid != ""){
      if(req.user._id.toString() ===req.params.cid.toString()){
        req.role = 'HR';
      }
      else{
        req.role = 'GUESTHR';
      }
    }else{
      if(req.user._id.toString() ===req.companyGroup.cid.toString()){
        req.role = 'HR';
      }
      else{
        req.role = 'GUESTHR';
      }
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
      res.status(403);
      next('forbidden');
      return;
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
      res.status(403);
      next('forbidden');
      return;
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
      res.status(403);
      next('forbidden');
      return;
    }
    User
    .findOne({
         _id: userId,
         app_token:appToken
    })
    .exec(function(err, user) {
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
        res.status(403);
        next('forbidden');
        return;
      }
    });
  }
  else{
    next();
  }
}
