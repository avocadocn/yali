'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Campaign = mongoose.model('Campaign'),
    Department = mongoose.model('Department'),
    model_helper = require('../helpers/model_helper'),
    _ = require('lodash'),
    moment = require('moment'),
    photo_album_controller = require('./photoAlbum');
var pagesize = 20;


/**
 * 获取用户的所有活动
 * @param  {Object}   user       mongoose.model('User'), example:req.user
 * @param  {Boolean}  isCalendar 如果是true，则为日历视图获取，包括已结束的活动，否则则为了列表视图获取，不包括结束的活动
 * @param  {Function} callback   callback(campaigns), campaigns为mongoose.model('Campaign'), 如果isCalendar设为false, 则populate(team, cid), 出错或没有找到活动则campaigns为[]
 */
var getUserAllCampaigns = function(user, isCalendar, callback) {
  var team_ids = [];
  for (var i = 0; i < user.team.length; i++) {
    team_ids.push(user.team[i]._id);
  }
  var options = {
    '$or': [
      {
        'cid': user.cid,
        'team': { '$size': 0 }
      },
      {
        'cid': user.cid,
        'team': { '$in': team_ids }
      }
    ],
    'active': true
  };
  if (isCalendar === false) {
    options.end_time = { '$gt': new Date() };
  }
  var query = Campaign.find(options).sort('start_time');
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
};

/**
 * 获取用户已参加的活动
 * @param  {Object}   user       mongoose.model('User'), example:req.user
 * @param  {Boolean}  isCalendar 如果是true，则为日历视图获取，包括已结束的活动，否则则为了列表视图获取，不包括结束的活动
 * @param  {Function} callback   callback(campaigns), campaigns为mongoose.model('Campaign'), 如果isCalendar设为false, 则populate(team, cid), 出错或没有找到活动则campaigns为[]
 */
var getUserJoinedCampaigns = function(user, isCalendar, callback) {
  var team_ids = [];
  for (var i = 0; i < user.team.length; i++) {
    team_ids.push(user.team[i]._id);
  }
  var options = {
    'cid': user.cid,
    '$or': [{ 'member.uid': user._id }, { 'camp.member.uid': user._id }],
    'active': true
  };
  if (isCalendar === false) {
    options.end_time = { '$gt': new Date() };
  }
  var query = Campaign.find(options).sort('start_time');
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
};

/**
 * 获取用户未参加的活动
 * @param  {Object}   user       mongoose.model('User'), example:req.user
 * @param  {Boolean}  isCalendar 如果是true，则为日历视图获取，包括已结束的活动，否则则为了列表视图获取，不包括结束的活动
 * @param  {Function} callback   callback(campaigns), campaigns为mongoose.model('Campaign'), 如果isCalendar设为false, 则populate(team, cid), 出错或没有找到活动则campaigns为[]
 */
var getUserUnjoinCampaigns = function(user, isCalendar, callback) {
  var team_ids = [];
  for (var i = 0; i < user.team.length; i++) {
    team_ids.push(user.team[i]._id);
  }
  var options = {
    '$or': [
      {
        'cid': user.cid,
        'team': { '$size': 0 }
      },
      {
        'cid': user.cid,
        'team': { '$in': team_ids }
      }
    ],
    '$nor': [
      { 'member.uid': user._id },
      { 'camp.member.uid': user._id }
    ],
    'active': true
  };
  if (isCalendar === false) {
    options.end_time = { '$gt': new Date() };
  }
  var query = Campaign.find(options).sort('start_time');
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
};


/**
 * 为日历视图处理活动，返回需要的数据
 * @param  {Object} user      mongoose.model('User'), example: req.user
 * @param  {Array} campaigns [mongoose.model('campaigns')]
 * @return {Array}
 */
var formatCampaignForCalendar = function(user, campaigns) {
  var calendarCampaigns = [];
  campaigns.forEach(function(campaign) {

    // 公司活动
    if (campaign.campaign_type === 1) {
      var logo_owner_id = campaign.cid[0];
      var logo = '/logo/company/' + logo_owner_id + '/27/27';
    } else {
      // 挑战或比赛
      var logo_owner_id;
      for (var i = 0, teams = user.team; i < teams.length; i++) {
        if (campaign.team.indexOf(teams[i]._id) !== -1) {
          logo_owner_id = teams[i]._id;
          var logo = '/logo/group/' + logo_owner_id + '/27/27';
          break;
        }
      }
    }


    // var count = 0;
    // if (campaign.member) {
    //   count = campaign.member.length;
    // }

    var is_joined = false;

    // 活动
    if (campaign.campaign_type < 3) {
      for (var i = 0, members = campaign.member; i < members.length; i++) {
        if (user._id.toString() === members[i].uid) {
          is_joined = true;
          break;
        }
      }
    }

    // 比赛
    if (campaign.campaign_type >= 3) {
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
      'logo': logo,
      'title': campaign.theme,
      'url': '/campaign/detail/' + campaign._id.toString(),
      'class': 'event-info',
      'start': campaign.start_time.valueOf(),
      'end': campaign.end_time.valueOf(),
      //'count': count,
      'is_joined': is_joined
    });
  });
  return calendarCampaigns;
}




/**
 * 计算用户是否参加活动，计算活动所属的公司或组及获取其logo，生成开始时间的提示文字
 * @param  {Object} user     mongoose.model('user')
 * @param  {Object} campaign mongoose.model('campaign'), need populate(team, cid)
 * @return {Object}          处理后的对象
 */
var formatCampaignForApp = function(user, campaign) {
  moment.lang('zh-cn');

  // 公司活动
  if (campaign.campaign_type === 1) {
    var logo = campaign.cid[0].info.logo;
    var owner_name = campaign.cid[0].info.name;
  } else {
    // 挑战或比赛
    var logo_owner_id;
    for (var i = 0, teams = user.team; i < teams.length; i++) {
      var owner_team = _.find(campaign.team, { '_id': teams[i]._id });
      if (owner_team) {
        var logo = owner_team.logo;
        var owner_name = owner_team.name;
        break;
      }
    }
  }

  var is_joined = false;

  // 活动
  if (campaign.campaign_type < 3) {
    for (var i = 0, members = campaign.member; i < members.length; i++) {
      if (user._id.toString() === members[i].uid) {
        is_joined = true;
        break;
      }
    }
  }

  // 比赛
  if (campaign.campaign_type >= 3) {
    for (var i = 0; i < campaign.camp.length; i++) {
      for (var j = 0, camp = campaign.camp[i]; j < camp.member.length; j++) {
        if (user._id.toString() === camp.member[j].uid) {
          is_joined = true;
          break;
        }
      }
    }
  }


  var remind_text, start_time_text;
  var now = new Date();
  var diff_end = now - campaign.end_time;
  if (diff_end >= 0) {
    // 活动已结束
    remind_text = '活动已结束';
    start_time_text = '';
  } else {
    // 活动未结束

    var temp_start_time = new Date(campaign.start_time);
    var during = moment.duration(moment(now).diff(temp_start_time));

    var days = Math.abs(during.days());
    var hours = Math.abs(during.hours());
    var minutes = Math.abs(during.minutes());
    var seconds = Math.abs(during.seconds());

    temp_start_time.setHours(hours);
    temp_start_time.setMinutes(minutes);
    temp_start_time.setSeconds(seconds);

    if (days > 0) {
      remind_text = '活动开始时间';
      start_time_text = moment(temp_start_time).format('YYYY-MM-DD');
    } else {
      // 活动已开始
      if (during >= 0) {
        remind_text = '活动已开始';
      } else {
        // 活动未开始
        remind_text = '距活动开始';
      }
      start_time_text = moment(temp_start_time).format('HH:mm:ss');
    }


  }

  return {
    '_id': campaign._id,
    'logo': logo,
    'owner_name': owner_name,
    'theme': campaign.theme,
    'content': campaign.content,
    'campaign_type': campaign.campaign_type,
    'start_time': campaign.start_time,
    'end_time': campaign.end_time,
    'is_joined': is_joined,
    'photo_album': campaign.photo_album,
    'member': campaign.member,
    'remind_text': remind_text,
    'start_time_text': start_time_text,
    'location':campaign.location
  };
};

/**
 * 为app的活动列表处理活动数据
 * @param  {Object} user      mongoose.model('User'), example: req.user
 * @param  {Array} campaigns  mongoose.model('Campaign'), need populate(team, cid)
 * @return {Array}
 */
var formatCampaignsForApp = function(user, campaigns) {

  var _campaigns = [];
  campaigns.forEach(function(campaign) {
    _campaigns.push(formatCampaignForApp(user, campaign));
  });
  return _campaigns;

};

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
    if(_campaign.campaign_type===1){//公司活动
      temp.type='companycampaign';
      temp.logo=_campaign.cid[0].info.logo;
      temp.link = '/company/home/'+_campaign.cid[0]._id;
      temp.cid = _campaign.cid[0]._id;
      temp.cname=_campaign.cid[0].info.name;
      temp.member_num = _campaign.member.length >0 ? _campaign.member.length : 0;
    }
    else if(_campaign.campaign_type===2){//小队活动
      temp.type='teamcampaign';
      temp.member_num = _campaign.member.length >0 ? _campaign.member.length : 0;
      temp.logo=_campaign.team[0].logo;
      temp.link = '/group/home/'+_campaign.team[0]._id;
      temp.team_id = _campaign.team[0]._id;
      if(new Date()<_campaign.deadline && (pageType==='user'&&role ==='OWNER' || pageType==='team'&&(role ==='LEADER' ||role ==='MEMBER' ) || pageType==='company'&&role ==='EMPLOYEE')){
        if(model_helper.arrayObjectIndexOf(_campaign.member,user._id,'uid')>-1){
          temp.join_flag = 1;
        }
        else{
          temp.join_flag = -1;
        }
      }
    }
    else if (_campaign.campaign_type === 6 || _campaign.campaign_type === 8) {
      temp.type = 'departmentcampaign';
      temp.member_num = _campaign.member.length >0 ? _campaign.member.length : 0;
      temp.logo=_campaign.team[0].logo;
      temp.link = '/group/home/'+_campaign.team[0]._id;
      temp.team_id = _campaign.team[0]._id;
      if(new Date()<_campaign.deadline && (pageType==='user'&&role ==='OWNER' || pageType==='team'&&(role ==='LEADER' ||role ==='MEMBER' ) || pageType==='company'&&role ==='EMPLOYEE')){
        if(model_helper.arrayObjectIndexOf(_campaign.member,user._id,'uid')>-1){
          temp.join_flag = 1;
        }
        else{
          temp.join_flag = -1;
        }
      }
    }
    else if(_campaign.campaign_type !== 7){//动一下
      temp.type = 'provoke';
      var camp_index = _campaign.camp[0].cid== user.cid ? 0:1;
      temp.member_num = _campaign.camp[camp_index].member.length >0 ? _campaign.camp[camp_index].member.length :0;
      temp.logo=_campaign.camp[camp_index].logo;
      temp.link = '/group/home/'+_campaign.camp[camp_index].id;
      temp.team_id =_campaign.camp[camp_index].id;
      if(model_helper.arrayObjectIndexOf(_campaign.camp[camp_index].member,user._id,'uid')>-1){
        temp.join_flag = 1;
      }
      else{
        temp.join_flag = 0;
      }
    }
    if(temp.type != 'provoke' && pageType==='team'&&(role ==='LEADER' ||role ==='HR' ) || pageType==='company'&&role ==='HR'){
      temp.close_flag=true;
    }
    campaigns.push(temp);
  });
  return campaigns;
};



exports.getCampaigns = function(req, res) {
  var option;
  var pageType = req.params.pageType;
  var pageId = req.params.pageId;
  var campaignType = req.params.campaignType;
  if(pageType==='company') {
    option={
      'active':true,
      'finish':false,
      'cid' : pageId
    }
    if(req.params.start_time!=0){
      var _start_Date = new Date();
      option.start_time={'$lt':_start_Date.setTime(req.params.start_time)}
    }
    if(campaignType==='all'){
    }
    else if(campaignType==='company') {
      option.campaign_type = 1;
    }
    else if(campaignType==='team') {
      option.campaign_type = 2;
    }
    else if(campaignType==='department'){
      option.campaign_type = {'$in':[6,8]};
    }
    else if(req.role ==='EMPLOYEE')  {
      var team_ids = [];
      for( var i = 0; i < req.user.team.length; i ++) {
        team_ids.push(req.user.team[i]._id.toString());
      }
      if(campaignType==='selected') {
        option.team={'$in':team_ids};
      }
      else if(campaignType==='unselected') {
        option.team = {'$nin':team_ids};
        option.campaign_type = 2;
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
          return res.send({ result: 1, role:req.role, campaigns: formatCampaign(campaign,pageType,req.role,req.user) });
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
      'finish':false,
      'team':pageId
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
        return res.send({ result: 1, role:req.role, campaigns: formatCampaign(campaign,pageType,req.role,req.user) });
      }
    })
    .then(null, function(err) {
      console.log(err);
      res.send(400);
    });
  }
  else if(pageType==='user' && campaignType==='all') {
    User.findOne({_id:pageId}).exec(function(err,user){
      if(!err && user){
        var team_ids = [];
        for( var i = 0; i < user.team.length; i ++) {
          team_ids.push(user.team[i]._id.toString());
        }
        option={
          'active':true,
          'finish':false,
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
        .exec()
        .then(function(campaign) {
          if(campaign===[]){
            return res.send({ result: 0, msg:'查找活动失败' });
          }
          else{
            return res.send({ result: 1, role:req.role, campaigns: formatCampaign(campaign,pageType,req.role,req.user) });
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
        if (req.role==="LEADER" || req.role==="HR"){
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
  if (req.role === 'OWNER') {
    getUserAllCampaigns(req.user, true, function(campaigns) {
      var format_campaigns = formatCampaignForCalendar(req.user, campaigns);
      res.send({
        success: 1,
        result: format_campaigns
      });
    });
  } else {
      getUserJoinedCampaigns(req.profile, true, function(campaigns) {
        var format_campaigns = formatCampaignForCalendar(req.profile, campaigns);
        res.send({
          success: 1,
          result: format_campaigns
        });
      });
  }
};

exports.getUserJoinedCampaignsForCalendar = function(req, res) {
  getUserJoinedCampaigns(req.user, true, function(campaigns) {
    var format_campaigns = formatCampaignForCalendar(req.user, campaigns);
    res.send({
      success: 1,
      result: format_campaigns
    });
  });
};

exports.getUserUnjoinCampaignsForCalendar = function(req, res) {
  if (req.role !== 'OWNER') {
    res.send(403);
  }
  getUserUnjoinCampaigns(req.user, true, function(campaigns) {
    var format_campaigns = formatCampaignForCalendar(req.user, campaigns);
    res.send({
      success: 1,
      result: format_campaigns
    });
  });
};

exports.getUserAllCampaignsForList = function(req, res) {
  getUserAllCampaigns(req.profile, false, function(campaigns) {
    var format_campaigns = formatCampaign(campaigns, 'user', req.role, req.profile);
    res.send({ result: 1, campaigns: format_campaigns });
  });
};

exports.getUserJoinedCampaignsForList = function(req, res) {
  getUserJoinedCampaigns(req.profile, false, function(campaigns) {
    var format_campaigns = formatCampaign(campaigns, 'user', req.role, req.profile);
    res.send({ result: 1, campaigns: format_campaigns });
  });
};

exports.getUserUnjoinCampaignsForList = function(req, res) {
  getUserUnjoinCampaigns(req.profile, false, function(campaigns) {
    var format_campaigns = formatCampaign(campaigns, 'user', req.role, req.profile);
    res.send({ result: 1, campaigns: format_campaigns });
  });
};

exports.getUserAllCampaignsForAppList = function(req, res) {
  var team_ids = [];
  for (var i = 0; i < req.user.team.length; i++) {
    team_ids.push(req.user.team[i]._id);
  }
  var options = {
    '$or': [
      {
        'cid': req.user.cid,
        'team': { '$size': 0 }
      },
      {
        'cid': req.user.cid,
        'team': { '$in': team_ids }
      }
    ],
    'active': true,
    'end_time': { '$gt': Date.now() }
  };

  Campaign
  .find(options)
  .sort('-start_time')
  .populate('team')
  .populate('cid')
  .exec()
  .then(function(campaigns) {
    var format_campaigns = formatCampaignsForApp(req.user, campaigns);
    res.send({ result: 1, campaigns: format_campaigns });
  })
  .then(null, function(err) {
    console.log(err);
    res.send(500);
  });
};

exports.getUserAllCampaignsForAppCalendar = function(req, res) {
  getUserAllCampaigns(req.user, false, function(campaigns) {
    var format_campaigns = [];
    campaigns.forEach(function(campaign) {
      format_campaigns.push(formatCampaignForApp(req.user, campaign));
    });
    res.send({ campaigns: format_campaigns });
  });
};

exports.renderCampaignDetail = function(req, res) {
  Campaign
  .findById(req.params.campaignId)
  .populate('photo_album')
  .populate('team')
  .populate('cid')
  .exec()
  .then(function(campaign) {
    if (!campaign) {
      throw 'not found';
    }
    if(campaign.camp.length >= 2){
      res.redirect("/competition/"+req.params.campaignId);
    }else{
      //join: 1已经参加，0报名人数已满，-1未参加
      if((req.role ==='MEMBER' ||req.role ==='LEADER' ) && model_helper.arrayObjectIndexOf(campaign.member,req.user._id,'uid')>-1){
        req.join = 1;
      }
      else if(campaign.member_max!==0 && campaign.member_max<=campaign.member.length){
        req.join = 0
      }
      else{
        req.join = -1;
      }
      var parent_name, parent_url;
      if (campaign.team.length === 0 || campaign.campaign_type === 6) {
        parent_name = campaign.cid[0].info.name;
        parent_url = '/company/home';
      }else {
        parent_name = campaign.team[0].name;
        parent_url = '/group/home/' + campaign.team[0]._id;
      }
      var links = [
        {
          text: parent_name,
          url: parent_url
        },
        {
          text: campaign.theme,
          active: true
        }
      ];
      moment.lang('zh-cn');
      return res.render('campaign/campaign_detail', {
        over : campaign.deadline<new Date(),
        join: req.join,
        role:req.role,
        user:{'_id':req.user._id,'nickname':req.user.nickname,'photo':req.user.photo, 'team':req.user.team},
        campaignLogo: campaign.team.length>0 ? campaign.team[0].logo:campaign.cid[0].info.logo,
        campaign: campaign,
        links: links,
        photo_thumbnails: photo_album_controller.photoThumbnailList(campaign.photo_album, 4),
        moment : moment
      });
    }

  })
  .then(null, function(err) {
    console.log(err);
    res.send(404);
  });
};
//员工参加活动
//TODO 加入competition
exports.joinCampaign = function (req, res) {
  if(req.role!=='MEMBER' && req.role!=='LEADER'){
    return res.send(403,'forbidden');
  }
  var cid = req.user.cid.toString();
  var uid = req.user._id.toString();
  var campaign_id = req.body.campaign_id; //该活动的id
  Campaign.findOne({
    _id : campaign_id
  },
  function (err, campaign) {
    if (!err && campaign) {
      if(campaign.end_time<new Date){
        return res.send({ result: 0, msg: '活动已经结束'});
      }
      var camp_length = campaign.camp.length;
      //从campaign里删除该员工信息
      if(camp_length===0){
        var member_index = model_helper.arrayObjectIndexOf(campaign.member,uid,'uid');
        if(member_index<0){
          var member_quit_index = model_helper.arrayObjectIndexOf(campaign.member_quit,uid,'uid');
          if(member_quit_index>-1){
            campaign.member_quit.splice(member_quit_index,1);
          }
          campaign.member.push({
            'cid':cid,
            'uid':uid,
            'nickname':req.user.nickname,
            'photo':req.user.photo
          });
        }
        else{
          return res.send({ result: 0, msg: '您已经参加该活动'});
        }
      }
      else{
        var tid = req.body.tid;
        var camp_index = model_helper.arrayObjectIndexOf(campaign.camp,tid,'id');
        if(camp_index==-1){
           return res.send({ result: 0, msg: '请求错误'});
        }
        var member_index = model_helper.arrayObjectIndexOf(campaign.camp[camp_index].member,uid,'uid');
        if(member_index<0){
          var member_quit_index = model_helper.arrayObjectIndexOf(campaign.camp[camp_index].member_quit,uid,'uid');
          if(member_quit_index>-1){
            campaign.camp[camp_index].member_quit.splice(member_quit_index,1);
          }
          campaign.camp[camp_index].member.push({
            'cid':cid,
            'uid':uid,
            'nickname':req.user.nickname,
            'photo':req.user.photo,
            'camp':camp_index===0?'A':'B'
          });
        }
        else {
          return res.send({ result: 0, msg: '您已经参加该活动'});
        }
      }
      campaign.save(function (err) {
        if(err) {
          return res.send({ result: 0, msg: '保存错误'});
        } else {
          return res.send({ result: 1, msg: '退出活动成功',member:{
            'cid':cid,
            'uid':uid,
            'nickname':req.user.nickname,
            'photo':req.user.photo
          }});
        }
      });
    }
    else {
      return res.send({ result: 0, msg: '没有此活动'});
    }
  });
};


//员工退出活动
exports.quitCampaign = function (req, res) {
  if(req.role!=='MEMBER' && req.role!=='LEADER'){
    return res.send(403,'forbidden');
  }
  var cid = req.user.cid.toString();
  var uid = req.user._id.toString();
  var campaign_id = req.body.campaign_id; //该活动的id
  Campaign.findOne({
        _id : campaign_id
    },
  function (err, campaign) {
    if (!err && campaign) {
      if(campaign.end_time<new Date){
        return res.send({ result: 0, msg: '活动已经结束'});
      }
      var camp_length = campaign.camp.length;
      //从campaign里删除该员工信息
      if(camp_length===0){
        var member_index = model_helper.arrayObjectIndexOf(campaign.member,uid,'uid');
        if(member_index>-1){
          campaign.member.splice(member_index,1);
          campaign.member_quit.push({
            'cid':cid,
            'uid':uid,
            'nickname':req.user.nickname,
            'photo':req.user.photo
          });
        }
        else{
          return res.send({ result: 0, msg: '您没有参加该活动'});
        }
      }
      else{
        var tid = req.body.tid;
        var camp_index = model_helper.arrayObjectIndexOf(campaign.camp,tid,'id');
        if(camp_index==-1){
           return res.send({ result: 0, msg: '请求错误'});
        }
        var member_index = model_helper.arrayObjectIndexOf(campaign.camp[camp_index].member,uid,'uid');
        if(member_index>-1){
          campaign.camp[camp_index].member.splice(member_index,1);
          campaign.member_quit.push({
            'cid':cid,
            'uid':uid,
            'nickname':req.user.nickname,
            'photo':req.user.photo
          });
          var formation_index = model_helper.arrayObjectIndexOf(campaign.camp[camp_index].formation,uid,'uid');
          if(formation_index>-1){
            campaign.camp[camp_index].member.splice(formation_index,1);
          }
        }
        if(member_index<0){
          return res.send({ result: 0, msg: '您没有参加该活动'});
        }
      }
      campaign.save(function (err) {
        if(err) {
          return res.send(err);
        } else {
          return res.send({ result: 1, msg: '退出活动成功',member:{
            'cid':cid,
            'uid':uid,
            'nickname':req.user.nickname,
            'photo':req.user.photo
          }});
        }
      });
    }
    else {
      return res.send({ result: 0, msg: '没有此活动'});
    }
  });
};
//员工投票是否参加约战
//记得要做重复投票检查 TODO
exports.vote = function (req, res) {
  if(req.role!=='MEMBER' && req.role!=='LEADER'){
    return res.send(403,'forbidden');
  }
  var tid = req.body.tid;
  var cid = req.user.cid;
  var uid = req.user._id;
  var aOr = req.body.aOr;
  var value = 1;
  var competition_id = req.body.competition_id;

  Campaign.findOne({
    '_id' : competition_id
  },
  function (err, campaign) {
    if (campaign) {

      var camp_index = model_helper.arrayObjectIndexOf(campaign.camp,tid,'id');
      var positive_index = model_helper.arrayObjectIndexOf(campaign.camp[camp_index].vote.positive_member,uid,'uid');
      var negative_index = model_helper.arrayObjectIndexOf(campaign.camp[camp_index].vote.negative_member,uid,'uid');
      if(aOr && negative_index > -1 || !aOr && positive_index > -1){
        return res.send({result: 0, msg:'您已经投过票，无法再次投票'});
      }
      else if(aOr && positive_index > -1 || !aOr && negative_index > -1) {
        campaign.camp[camp_index].vote[aOr?'positive_member':'negative_member'].splice(aOr?positive_index:negative_index,1);
        campaign.camp[camp_index].vote[aOr?'positive':'negative'] = campaign.camp[camp_index].vote[aOr?'positive':'negative']-1;
      }
      else if(aOr && positive_index <0 || !aOr && negative_index <0){
        campaign.camp[camp_index].
          vote[aOr?'positive_member':'negative_member'].
            push({
                  'cid':cid,
                  'uid':uid,
                  'nickname':req.user.nickname,
                  'photo':req.user.photo
                });
        campaign.camp[camp_index].vote[aOr?'positive':'negative'] = campaign.camp[camp_index].vote[aOr?'positive':'negative']+1;
      }

      campaign.save(function (err) {
        if(err) {
          return res.send({result: 0, msg:'投票发生错误'});
        }
        else{
          return res.send({result: 1, msg:'成功',data:{
              quit: aOr && positive_index <0 || !aOr && negative_index <0,
              positive : campaign.camp[camp_index].vote.positive,
              negative : campaign.camp[camp_index].vote.negative
            }
          });
        }
      });
    } else {
      console.log('没有此约战!');
      return res.send({result: 0, msg:'没有此约战'});
    }
  });
};

exports.getCampaignDetail = function(req, res) {
  Campaign
  .findById(req.params.campaignId)
  .populate('team')
  .populate('cid')
  .exec()
  .then(function(campaign) {
    if (!campaign) {
      return res.send(404);
    }
    res.send({ result: 1, msg: '获取活动成功', campaign: formatCampaignForApp(req.user, campaign) });
  })
  .then(null, function(err) {
    console.log(err);
    res.send(500);
  });
};

exports.campaign = function(req, res, next, id){
  Campaign
      .findOne({
           _id: id
      })
      .exec(function(err, campaign) {
          if (err) return next(err);
          if (!campaign) return next(new Error('Failed to load Campaign ' + id));
          req.campaign = campaign;
          next();
      });
}
