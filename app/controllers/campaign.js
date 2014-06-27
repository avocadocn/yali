'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Campaign = mongoose.model('Campaign'),
    model_helper = require('../helpers/model_helper');
var pagesize = 40;
var formatCampaign = function(campaign,pageType,role,user){
  var campaigns = [];
  campaign.forEach(function(_campaign){
    var temp = {
      '_id':_campaign._id,
      'active':_campaign.active,
      'theme':_campaign.theme,
      'content':_campaign.content,
      'member_max':_campaign.member_max,
      'location':_campaign.location,
      'start_time':_campaign.start_time,
      'end_time':_campaign.end_time,
      'deadline':_campaign.deadline,
      'comment_sum':_campaign.comment_sum
    };
    if(_campaign.team.length==0){
      temp.type='companycampaign';
      temp.logo=_campaign.cid[0].info.logo;
      temp.link = '/company/home/'+_campaign.cid._id;
      temp.cid = _campaign.cid[0]._id;
      temp.cname=_campaign.cid[0].info.name;
      temp.member_num = _campaign.member.length >0 ? _campaign.member.length : 0;
    }
    else if(_campaign.camp.length==0){
      temp.type='teamcampaign';
      temp.member_num = _campaign.member.length >0 ? _campaign.member.length : 0;
      temp.logo=_campaign.team[0].logo;
      temp.link = '/group/home/'+_campaign.team[0]._id;
      if(pageType==='user'&&role ==='OWNER' || pageType==='team'&&(role ==='LEADER' ||role ==='MEMBER' ) || pageType==='company'&&role ==='EMPLOYEE'){
        if(model_helper.arrayObjectIndexOf(_campaign.member,user._id,'uid')>-1){
          temp.join_flag = 1;
        }
        else{
          temp.join_flag = -1;
        }
      }
    }
    else{
      temp.type = 'provoke';
      var camp_index = _campaign.camp[0].cid== user.cid ? 0:1;
      temp.member_num = _campaign.camp[camp_index].member.length >0 ? _campaign.camp[camp_index].member.length :0;
      temp.logo=_campaign.camp[camp_index].logo;
      temp.link = '/group/home/'+_campaign.camp[camp_index].id;
      if(model_helper.arrayObjectIndexOf(_campaign.camp[camp_index].member,user._id,'uid')>-1){
        temp.join_flag = 1;
      }
      else{
        temp.join_flag = 0;
      }
    }
    if(pageType==='team'&&(role ==='LEADER' ||role ==='HR' ) || pageType==='company'&&role ==='HR'){
      temp.close_flag=true;
    }
    campaigns.push(temp);
  });
  return campaigns;
};
exports.getCampaigns = function(req, res) {
  var options;
  var pageType = req.params.pageType;
  var campaignType = req.params.campaignType;
  var page = req.params.page;
  if(pageType==='company') {
    options={
      'active':true,
      'end_time':{'$lt':new Date()},
      'cid' : req.session.nowcid
    }
    if(campaignType==='all'){
    }
    else if(campaignType==='company') {
      options.team = [];
    }
    else if(campaignType==='team') {
      options.team = {'$size':2};
    }
    else if(req.session.role ==='EMPLOYEE')  {
      var team_ids = [];
      for( var i = 0; i < req.user.team.length; i ++) {
        team_ids.push(req.user.team[i]._id.toString());
      }
      if(campaignType==='selected') {
        options.team={'$in':team_ids};
      }
      else if(campaignType==='unselected') {
        options.team = {'$nin':team_ids,'$size':2};
      }
    }
    Campaign
      .find(options)
      .skip(page * pagesize)
      .limit(pagesize)
      .populate('team').populate('cid')
      .exec()
      .then(function(campaign) {
        if(campaign===[]){
          return res.send({ result: 0, msg:'查找活动失败' });
        }
        else{
          return res.send({ result: 1, campaigns: formatCampaign(campaign,pageType,req.session.role,req.user) });
        }
      })
      .then(null, function(err) {
        console.log(err);
        return res.send(400);
      });
  }
  else if(pageType==='team' && campaignType==='all') {
    options={
      'active':true,
      'end_time':{'$lt':new Date()},
      'team':req.session.nowtid
    }
    Campaign
    .find(options)
    .skip(page * pagesize)
    .limit(pagesize)
    .populate('team').populate('cid')
    .exec()
    .then(function(campaign) {
      if(campaign===[]){
        return res.send({ result: 0, msg:'查找活动失败' });
      }
      else{
        return res.send({ result: 1, campaigns: formatCampaign(campaign,pageType,req.session.role,req.user) });
      }
    })
    .then(null, function(err) {
      console.log(err);
      res.send(400);
    });
  }
  else if(pageType==='user' && campaignType==='all') {
    User.findOne({_id:req.session.nowuid}).exec(function(err,user){
      if(!err && user){
        var team_ids = [];
        for( var i = 0; i < user.team.length; i ++) {
          team_ids.push(user.team[i]._id.toString());
        }
        options={
          'active':true,
          'end_time':{'$lt':new Date()},
          '$or':[{'team':{'$in':team_ids}},{'cid':user.cid,'team':[]}]
        }
        Campaign
        .find(options)
        .skip(page * pagesize)
        .limit(pagesize)
        .populate('team').populate('cid')
        .exec()
        .then(function(campaign) {
          if(campaign===[]){
            return res.send({ result: 0, msg:'查找活动失败' });
          }
          else{
            return res.send({ result: 1, campaigns: formatCampaign(campaign,pageType,req.session.role,req.user) });
          }
        })
        .then(null, function(err) {
          console.log(err);
          res.send(400);
        });

      }
      else{
        return res.send({ result: 0, msg:'无此用户' });
      }
    });
  }
}
exports.cancelCampaign = function(req, res){
  Campaign
    .findOne({'_id':req.body.campaign_id})
    .populate('team')
    .exec()
    .then(function(campaign) {
      if(!campaign){
        return res.send({ result: 0, msg:'查找活动失败' });
      }
      else{
        if (campaign.camp==[] &&req.session.role==="HR"&&campaign.cid[0].toString()==req.user._id.toString() || campaign.camp==[] && campaign.team.length===2&&req.session.role==='LEADER' && model_helper.arrayObjectIndexOf(campaign.team[0].leader,req.user._id,'_id')>-1){
          campaign.active=false;
          campaign.save(function(err){
            if(!err){
              return res.send({ result: 1, msg:'活动关闭成功' });
            }
          })
        }
        else{
          return res.send({ result: 0, msg:'您没有权限关闭该活动' });
        }
      }
    })
    .then(null, function(err) {
      console.log(err);
      res.send(400);
    });
}

