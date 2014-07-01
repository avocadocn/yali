'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Campaign = mongoose.model('Campaign'),
    model_helper = require('../helpers/model_helper');
var pagesize = 20;


function getUserAllCampaigns(user, isCalendar, callback) {
  var options = {
    'cid': user.cid,
    'active': true
  };
  if (isCalendar === false) {
    options.end_time = { '$gt': new Date() };
  }
  var query = Campaign.find(options);
  if (isCalendar === false) {
    query = query.populate('team').populate('cid');
  }

  query
  .exec()
  .then(function(campaigns) {
    callback(campaigns);
  })
  .then(null, function(err) {
    console.log(err);
    callback([]);
  });
}

function getUserJoinedCampaigns(user, isCalendar, callback) {
  var options = {
    '$or': [{ 'member.uid': user._id }, { 'camp.member.uid': user._id }],
    'active': true
  };
  if (isCalendar === false) {
    options.end_time = { '$gt': new Date() };
  }
  var query = Campaign.find(options);
  if (isCalendar === false) {
    query = query.populate('team').populate('cid');
  }

  query
  .exec()
  .then(function(campaigns) {
    callback(campaigns);
  })
  .then(null, function(err) {
    console.log(err);
    callback([]);
  });
}

function getUserUnjoinCampaigns(user, isCalendar, callback) {
  var options = {
    'cid': user.cid,
    '$nor': [
      { 'member.uid': user._id },
      { 'camp.member.uid': user._id }
    ],
    'active': true
  };
  if (isCalendar === false) {
    options.end_time = { '$gt': new Date() };
  }
  var query = Campaign.find(options);
  if (isCalendar === false) {
    query = query.populate('team').populate('cid');
  }

  query
  .exec()
  .then(function(campaigns) {
    callback(campaigns);
  })
  .then(null, function(err) {
    console.log(err);
    callback([]);
  });
}

function formatCampaignForCalendar(user, campaigns) {
  var calendarCampaigns = [];
  campaigns.forEach(function(campaign) {
    var team_id;
    for (var i = 0, teams = user.team; i < teams.length; i++) {
      if (campaign.team.indexOf(teams[i]._id) !== -1) {
        team_id = teams[i]._id;
      }
    }

    var count = 0;
    if (campaign.member) {
      count = campaign.member.length;
    }

    var is_joined = false;

    // 活动
    if (campaign.team.length <= 1) {
      for (var i = 0, members = campaign.member; i < members.length; i++) {
        if (user._id.toString() === members[i].uid) {
          is_joined = true;
          break;
        }
      }
    }

    // 比赛
    if (campaign.team.length > 1) {
      for (var i = 0; i < campaign.camp.length; i++) {
        for (var j = 0, camp = campaign.camp[i]; j < camp.member.length; j++) {
          if (user._id.toString() === camp.member[j].uid) {
            is_joined = true;
            break;
          }
        }
      }
    }

    calendarCampaigns.push({
      'id': campaign._id,
      'team_id': team_id,
      'title': campaign.theme,
      'url': '/group/campaign/' + campaign._id.toString(),
      'class': 'event-info',
      'start': campaign.start_time.valueOf(),
      'end': campaign.end_time.valueOf(),
      'count': count,
      'is_joined': is_joined
    });
  });
  return {
    'success': 1,
    'result': calendarCampaigns
  };
}
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
  var option;
  var pageType = req.params.pageType;
  var campaignType = req.params.campaignType;
  var page = req.params.page;
  if(pageType==='company') {
    option={
      'active':true,
      'end_time':{'$gt':new Date()},
      'cid' : req.session.nowcid
    }
    if(req.params.start_time!=0){
      var _start_Date = new Date();
      option.start_time={'$lt':_start_Date.setTime(req.params.start_time)}
    }
    if(campaignType==='all'){
    }
    else if(campaignType==='company') {
      option.team = {'$size':0};
    }
    else if(campaignType==='team') {
      option.team = {'$size':2};
    }
    else if(req.session.role ==='EMPLOYEE')  {
      var team_ids = [];
      for( var i = 0; i < req.user.team.length; i ++) {
        team_ids.push(req.user.team[i]._id.toString());
      }
      if(campaignType==='selected') {
        option.team={'$in':team_ids};
      }
      else if(campaignType==='unselected') {
        option.team = {'$nin':team_ids,'$size':2};
      }
    }
    Campaign
      .find(option)
      .limit(pagesize)
      .populate('team').populate('cid')
      .sort({'start_time':-1})
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
    option={
      'active':true,
      'end_time':{'$gt':new Date()},
      'team':req.session.nowtid
    }
    if(req.params.start_time!=0){
      var _start_Date = new Date();
      option.start_time={'$lt':_start_Date.setTime(req.params.start_time)}
    }
    Campaign
    .find(option)
    .limit(pagesize)
    .populate('team').populate('cid')
    .sort({'start_time':-1})
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
        option={
          'active':true,
          'end_time':{'$gt':new Date()},
          '$or':[{'team':{'$in':team_ids}},{'cid':user.cid,'team':{'$size':0}}]
        }
        if(req.params.start_time!=0){
          var _start_Date = new Date();
          option.start_time={'$lt':_start_Date.setTime(req.params.start_time)}
        }
        Campaign
        .find(option)
        .limit(pagesize)
        .populate('team').populate('cid')
        .sort({'start_time':-1})
        .sort({'start_time':-1})
        .exec()
        .then(function(campaign) {
          if(campaign===[]){
            return res.send({ result: 0, msg:'查找活动失败' });
          }
          else{
            console.log(campaign);
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
        if (campaign.camp.length===0 &&req.session.role==="HR"&&campaign.cid[0].toString()==req.user._id.toString() || campaign.camp.length===0 && campaign.team.length===1&&req.session.role==='LEADER' && model_helper.arrayObjectIndexOf(campaign.team[0].leader,req.user._id,'_id')>-1){
          campaign.active=false;
          campaign.save(function(err){
            if(!err){
              return res.send({ result: 1, msg:'活动关闭成功' });
            }
          });
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


exports.getUserAllCampaignsForCalendar = function(req, res) {
  if (req.session.role === 'OWNER') {
    getUserAllCampaigns(req.user, true, function(campaigns) {
      var format_campaigns = formatCampaignForCalendar(req.user, campaigns);
      res.send(format_campaigns);
    });
  } else {
    User
    .findById(req.session.nowuid)
    .exec()
    .then(function(user) {
      if (!user) {
        throw 'not found';
      }
      getUserJoinedCampaigns(user, true, function(campaigns) {
        var format_campaigns = formatCampaignForCalendar(req.user, campaigns);
        res.send(format_campaigns);
      });
    })
    .then(null, function(err) {
      console.log(err);
      res.send(500);
    });
  }
};

exports.getUserJoinedCampaignsForCalendar = function(req, res) {
  if (req.session.role !== 'OWNER') {
    res.send(403);
  }
  getUserJoinedCampaigns(req.user, true, function(campaigns) {
    var format_campaigns = formatCampaignForCalendar(req.user, campaigns);
    res.send(format_campaigns);
  });
};

exports.getUserUnjoinCampaignsForCalendar = function(req, res) {
  if (req.session.role !== 'OWNER') {
    res.send(403);
  }
  getUserUnjoinCampaigns(req.user, true, function(campaigns) {
    var format_campaigns = formatCampaignForCalendar(req.user, campaigns);
    res.send(format_campaigns);
  });
};

exports.getUserAllCampaignsForList = function(req, res) {
  getUserAllCampaigns(req.user, false, function(campaigns) {
    var format_campaigns = formatCampaign(campaigns, 'user', req.session.role, req.user);
    res.send({ result: 1, campaigns: format_campaigns });
  });
};

exports.getUserJoinedCampaignsForList = function(req, res) {
  getUserJoinedCampaigns(req.user, false, function(campaigns) {
    var format_campaigns = formatCampaign(campaigns, 'user', req.session.role, req.user);
    res.send({ result: 1, campaigns: format_campaigns });
  });
};

exports.getUserUnjoinCampaignsForList = function(req, res) {
  getUserUnjoinCampaigns(req.user, false, function(campaigns) {
    var format_campaigns = formatCampaign(campaigns, 'user', req.session.role, req.user);
    res.send({ result: 1, campaigns: format_campaigns });
  });
};
