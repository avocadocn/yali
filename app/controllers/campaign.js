'use strict';
var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Campaign = mongoose.model('Campaign'),
  Department = mongoose.model('Department'),
  Comment = mongoose.model('Comment'),
  PhotoAlbum = mongoose.model('PhotoAlbum'),
  MessageContent = mongoose.model('MessageContent'),
  model_helper = require('../helpers/model_helper'),
  _ = require('lodash'),
  moment = require('moment'),
  async = require('async'),
  photo_album_controller = require('./photoAlbum'),
  auth = require('../services/auth'),
  systemConfig = require('../config/config');
var pageSize = 100;
var blockSize = 20;


/**
 * 获取一个队的所有未关闭的、未开始的活动, 并按开始时间排序
 * @param  {Object|String}   team_id  小队_id
 * @param  {Function} callback callback(campaigns, err), campaigns为小队的所有活动, 类型为数组, 没有populate的mongoose.model('Campaign'), 没有找到则为空数组
 */
var getTeamAllCampaigns = function(team_id, callback) {
  Campaign
  .find({ 'tid': team_id, 'active': true })
  .sort('start_time')
  .exec()
  .then(function(campaigns) {
    callback(campaigns);
  })
  .then(null, function(err) {
    callback([], err);
  });
};


/**
 * 获取用户的所有活动
 * @param  {Object}   user       mongoose.model('User'), example:req.user
 * @param  {Boolean}  isCalendar 如果是true，则为日历视图获取，包括已结束的活动，否则则为了列表视图获取，不包括结束的活动
 * @param  {Object}   _query 包括from和to分别为活动的开始和结束时间
 * @param  {Function} callback   callback(campaigns), campaigns为mongoose.model('Campaign'), 出错或没有找到活动则campaigns为[]
 */
var getUserAllCampaigns = function(user, isCalendar, _query, callback) {
  var team_ids = [];
  for (var i = 0; i < user.team.length; i++) {
    team_ids.push(user.team[i]._id);
  }
  var options = {
    '$or': [
      {
        'cid': user.cid,
        'tid': { '$size': 0 }
      },
      {
        'cid': user.cid,
        'tid': { '$in': team_ids }
      }
    ],
    'active': true
  };
  if (isCalendar === false) {
    options.end_time = { '$gt': new Date() };
  }
  else{
    options.start_time = { '$lte': new Date(parseInt(_query.to)) };
    options.end_time = { '$gte': new Date(parseInt(_query.from)) };
  }
  var query = Campaign.find(options).sort('start_time');

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
 * @param  {Object}   _query 包括from和to分别为活动的开始和结束时间
 * @param  {Function} callback   callback(campaigns), campaigns为mongoose.model('Campaign'), 出错或没有找到活动则campaigns为[]
 */
var getUserJoinedCampaigns = function(user, isCalendar, _query, callback) {
  var team_ids = [];
  for (var i = 0; i < user.team.length; i++) {
    team_ids.push(user.team[i]._id);
  }
  var options = {
    'cid': user.cid,
    'campaign_unit.member._id': user._id,
    'active': true
  };
  if (isCalendar === false) {
    options.end_time = { '$gt': new Date() };
  }
  else{
    options.start_time = { '$lte': new Date(parseInt(_query.to)) };
    options.end_time = { '$gte': new Date(parseInt(_query.from)) };
  }
  var query = Campaign.find(options).sort('start_time');

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
 * @param  {Object}   _query 包括from和to分别为活动的开始和结束时间
 * @param  {Function} callback   callback(campaigns), campaigns为mongoose.model('Campaign'), 出错或没有找到活动则campaigns为[]
 */
var getUserUnjoinCampaigns = function(user, isCalendar, _query, callback) {
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
  else{
    options.start_time = { '$lte': new Date(parseInt(_query.to)) };
    options.end_time = { '$gte': new Date(parseInt(_query.from)) };
  }
  var query = Campaign.find(options).sort('start_time');

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
        if (campaign.tid.indexOf(teams[i]._id) !== -1) {
          logo_owner_id = teams[i]._id;
          var logo = '/logo/group/' + logo_owner_id + '/27/27';
          break;
        }
      }
    }

    var is_joined = false;
    if(model_helper.arrayObjectIndexOf(campaign.members,user._id,'_id')>-1){
      is_joined = true;
    }

    calendarCampaigns.push({
      'id': campaign._id,
      'logo': logo,
      'title': campaign.theme,
      'url': '/campaign/detail/' + campaign._id.toString(),
      'class': 'event-info',
      'start': campaign.start_time.valueOf(),
      'end': campaign.end_time.valueOf(),
      'is_joined': is_joined,
      'location':campaign.location,
    });
  });
  return calendarCampaigns;
}

var formatTime = function(start_time,end_time){
  var remind_text, start_time_text,start_flag;
  var now = new Date();
  var diff_end = now - end_time;
  if (diff_end >= 0) {
    // 活动已结束
    remind_text = '活动已结束';
    start_time_text = '';
    start_flag = -1;
  } else {
    // 活动未结束
    var temp_start_time = new Date(start_time);
    var during = moment.duration(moment(now).diff(temp_start_time));
    var years = Math.abs(during.years());
    var months = Math.abs(during.months());
    var days = Math.floor(Math.abs(during.asDays()));
    var hours = Math.abs(during.hours());
    var minutes = Math.abs(during.minutes());
    var seconds = Math.abs(during.seconds());

    temp_start_time.setHours(hours);
    temp_start_time.setMinutes(minutes);
    temp_start_time.setSeconds(seconds);

    // 活动已开始
    if (during >= 0) {
      start_flag = 1;
      remind_text = '活动已开始';
    } else {
      // 活动未开始
      start_flag = 0;
      remind_text = '距离活动开始还有';
      if(days>=3){
        start_time_text =  days + '天';
      }
      else if(days>=1){
        start_time_text = days + '天' + (hours ? hours + '小时' : '') ;
      }
      else if(hours>=1){
        start_time_text = hours + '小时'  + minutes + '分';
      }
      else{
        start_time_text = (minutes ?  minutes + '分' : '' ) + seconds + '秒';
      }

    }
  }
  return { start_flag:start_flag,
            remind_text:remind_text,
            start_time_text: start_time_text
          }
}


/**
 * 计算用户是否参加活动，计算活动所属的公司或组及获取其logo，生成开始时间的提示文字
 * @param  {Object} user     mongoose.model('user')
 * @param  {Object} campaign mongoose.model('campaign'), need populate(team, cid)
 * @param  {Boolean} user      mongoose.model('User'), example: req.user
 * @return {Object}          处理后的对象
 */
var formatCampaignForApp = function(user, campaign, nowFlag) {
  moment.lang('zh-cn');
  var is_joined = false,myteam=[];
  // 公司活动
  if (campaign.campaign_type === 1) {
    var logo = campaign.cid[0].info.logo;
    var owner_name = campaign.cid[0].info.name;
  } else {
    // 挑战或比赛
    var logo_owner_id;
    for (var i = 0, teams = user.team; i < teams.length; i++) {
      var owner_team = model_helper.arrayObjectIndexOf(campaign.team,teams[i]._id,'_id');
      if (owner_team>-1) {
        var logo = campaign.team[owner_team].logo;
        var owner_name = campaign.team[owner_team].name;
        break;
      }
    }
  }

  // 活动
  if (campaign.campaign_type < 3) {
    for (var i = 0, members = campaign.member; i < members.length; i++) {
      if (user._id.toString() === members[i].uid) {
        is_joined = true;
        break;
      }
    }
  }
  // 多小队活动
  else if (campaign.campaign_type == 3) {
    is_joined = model_helper.arrayObjectIndexOf(campaign.member,user._id,'uid')>-1;
    for (var i = 0; i < campaign.team.length; i++) {
      var owner_team = model_helper.arrayObjectIndexOf(user.team,campaign.team[i]._id,'_id');
      if (owner_team>-1) {
        myteam.push({
          'id':campaign.team[i]._id,
          'name':campaign.team[i].name,
          'logo':campaign.team[i].logo
        });
      }
    }
  }
  // 比赛
  else {
    for (var i = 0; i < campaign.camp.length; i++) {
      var owner_team = model_helper.arrayObjectIndexOf(user.team,campaign.camp[i].id,'_id');
      if (owner_team>-1) {
        myteam.push({
          'id':campaign.camp[i].id,
          'name':campaign.camp[i].tname,
          'logo':campaign.camp[i].logo,
          'member':campaign.camp[i].member
        });
        is_joined = is_joined || model_helper.arrayObjectIndexOf(campaign.camp[i].member,user._id,'uid')>-1;
      }
    }
  }


  var _formatTime = formatTime(campaign.start_time,campaign.end_time);

  var result = {
    '_id': campaign._id,
    'logo': logo,
    'owner_name': owner_name,
    'theme': campaign.theme,
    'content': campaign.content,
    'campaign_type': campaign.campaign_type,
    'start_time': campaign.start_time,
    'end_time': campaign.end_time,
    'deadline': campaign.deadline,
    'is_joined': is_joined,
    //'photo_album': campaign.photo_album,
    'member': campaign.member,
    'start_flag': _formatTime.start_flag,
    'remind_text': _formatTime.remind_text,
    'start_time_text': _formatTime.start_time_text,
    'location':campaign.location,
    'active': campaign.active,
    'finish': campaign.finish,
    'myteam':myteam,
    'comment_sum':campaign.comment_sum
  };
  if(nowFlag){
    result.photo_thumbnails = photo_album_controller.photoThumbnailList(campaign.photo_album, 3);
  }
  return result;
};

/**
 * 为app的活动列表处理活动数据
 * @param  {Object} user      mongoose.model('User'), example: req.user
 * @param  {Array} campaigns  mongoose.model('Campaign'), need populate(team, cid)
 * @param  {Boolean} user      mongoose.model('User'), example: req.user
 * @return {Array} nowFlag    true:nowCampaign
 */
var formatCampaignsForApp = function(user, campaigns, nowFlag) {

  var _campaigns = [];
  campaigns.forEach(function(campaign) {
    _campaigns.push(formatCampaignForApp(user, campaign,nowFlag));
  });
  return _campaigns;

};
/**
 * [formatCampaign description]
 * @param  {[type]} campaign [description]
 * @param  {[type]} pageType [description]
 * @param  {[type]} role     [description]
 * @param  {[type]} user     [description]
 * @param  {[type]} other    [description]
 * @return {[type]}          [description]
 */
var formatCampaign = function(campaign,pageType,role,user,other){
  var _other = other ? other :{};
  var campaigns = [];
  var a = new Date();
  campaign.forEach(function(_campaign,_index){
    var ct = _campaign.campaign_type;
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
      'comment_sum':_campaign.comment_sum,
      'join_flag':model_helper.arrayObjectIndexOf(_campaign.members,user._id,'_id')>-1?1:-1,
      'due_flag':new Date()<_campaign.deadline?1:0
    };
    if(ct===1){//公司活动
      temp.type='companycampaign';
      temp.logo=_campaign.campaign_unit[0].company.logo;
      temp.link = '/company/home/'+_campaign.cid[0];
      temp.name = _campaign.campaign_unit[0].company.name;
      temp.cid = _campaign.campaign_unit[0].company._id;
      temp.cname=_campaign.campaign_unit[0].company.info.name;
      temp.member_num = _campaign.members.length >0 ? _campaign.members.length : 0;
    }
    else if(ct===2 || ct===3){//小队活动
      temp.type='teamcampaign';
    }
    else if (ct === 6 || ct === 8) {//部门
      temp.type = 'departmentcampaign';
    }
    if(ct===2||ct===3||ct===6||ct===8) {
      temp.member_num = _campaign.members.length >0 ? _campaign.members.length : 0;
      temp.logo=_campaign.campaign_unit[0].team.logo;
      temp.link = '/group/page/'+_campaign.tid[0];
      temp.name=_campaign.campaign_unit[0].team.name;
      temp.team_id = [{'_id':_campaign.tid[0]}];
    }
    else if(ct!==1) {//挑战
      temp.type = 'provoke';
      temp.join_flag = 0;
      temp.team_id = [];
      for(var i =0;i<_campaign.campaign_unit.length;i++){
        if(model_helper.arrayObjectIndexOf(user.team,_campaign.campaign_unit[i].team._id,'_id')>-1){//这个unit是否为user参加的小队
          temp.team_id.push(_campaign.campaign_unit[i].team._id);
          temp.logo = _campaign.campaign_unit[i].team.logo;
          temp.name = _campaign.campaign_unit[i].team.name;
          temp.link = '/group/page/'+_campaign.campaign_unit[i].team._id.toString();
        }
      }
    }
    if(temp.type != 'provoke' && pageType==='team'&&(role ==='LEADER' ||role ==='HR' ) || pageType==='company'&&role ==='HR'){
      temp.close_flag=true;
    }
    if(_other.photoFlag){
      temp.photo_thumbnails = photo_album_controller.photoThumbnailList(_campaign.photo_album, 4);
      temp.camp = _campaign.camp;//...
    }
    if(_other.nowFlag){
      var _formatTime = formatTime(_campaign.start_time,_campaign.end_time);
      temp.start_flag = _formatTime.start_flag;
      temp.remind_text =_formatTime.remind_text;
      temp.start_time_text = _formatTime.start_time_text;
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
    if(campaignType==='all'){
    }
    else if(campaignType==='company') {
      option.campaign_type = 1;
    }
    else if(campaignType==='team') {
      option.campaign_type = {'$in':[2,3,4,5,7]};//4?5?7?
    }
    else if(campaignType==='department'){
      option.campaign_type = {'$in':[6,8]};//9?
    }
    else if(req.role ==='EMPLOYEE')  {
      var team_ids = [];
      for( var i = 0; i < req.user.team.length; i ++) {
        team_ids.push(req.user.team[i]._id.toString());
      }
      if(campaignType==='selected') {
        option.tid={'$in':team_ids};
      }
      else if(campaignType==='unselected') {
        option.tid = {'$nin':team_ids};
        option.campaign_type = 2;
      }
    }
    Campaign
    .find(option)
    .skip(req.params.campaignPage*pageSize+req.params.campaignBlock*blockSize)
    .limit(blockSize)
    .sort({'start_time':-1})
    .exec()
    .then(function(campaign) {
      if(campaign===[]){
        return res.send({ result: 0, msg:'查找活动失败' });
      }
      else{
        return res.send({ result: 1, role:req.role, campaignLength: campaign.length, campaigns: formatCampaign(campaign,pageType,req.role,req.user) });
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
      'tid':pageId,
      'cid':req.companyGroup.cid
    }
    Campaign
    .find(option)
    .skip(req.params.campaignPage*pageSize+req.params.campaignBlock*blockSize)
    .limit(blockSize)
    // .populate('team').populate('cid')
    .sort({'start_time':-1})
    .exec()
    .then(function(campaign) {
      if(campaign===[]){
        return res.send({ result: 0, msg:'查找活动失败' });
      }
      else{
        return res.send({ result: 1, role:req.role, campaignLength: campaign.length, campaigns: formatCampaign(campaign,pageType,req.role,req.user) });
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
          'cid': req.profile.cid,
          '$or':[{'tid':{'$in':team_ids}},{'tid':{'$size':0}}]
        }
        Campaign
        .find(option)
        .skip(req.params.campaignPage*pageSize+req.params.campaignBlock*blockSize)
        .limit(blockSize)
        // .populate('team').populate('cid')
        .sort({'start_time':1})
        .exec()
        .then(function(campaign) {
          if(campaign===[]){
            return res.send({ result: 0, msg:'查找活动失败' });
          }
          else{
            return res.send({ result: 1, role:req.role, campaignLength: campaign.length, campaigns: formatCampaign(campaign,pageType,req.role,req.user) });
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
    .exec()
    .then(function(campaign) {
      if(!campaign){
        return res.send({ result: 0, msg:'查找活动失败' });
      }
      else{
        if (req.role === "HR" || campaign.campaign_type != 3 && req.role === "LEADER" ){
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
exports.editCampaign = function(req, res){
  Campaign
    .findOne({'_id':req.params.campaignId})
    .exec()
    .then(function(campaign) {
      if(!campaign){
        return res.send({ result: 0, msg:'查找活动失败' });
      }
      else{
        if (req.role === "HR" || campaign.campaign_type != 3 && req.role === "LEADER" ){
          campaign.content=req.body.content;
          campaign.save(function(err){
            if(!err){
              return res.send({ result: 1, msg:'活动编辑成功' });
            }
          });
        }
        else{
          return res.send({ result: 0, msg:'您没有权限编辑该活动' });
        }
      }
    })
    .then(null, function(err) {
      console.log(err);
      res.send(400);
    });
}


exports.getUserCampaignsForHome = function(req, res) {
  var now = new Date();
  var startTimeLimit = new Date();
  startTimeLimit.setHours(startTimeLimit.getHours()+systemConfig.CAMPAIGN_STAY_HOUR);
  var endTimeLimit = new Date();
  endTimeLimit.setHours(endTimeLimit.getHours()-systemConfig.CAMPAIGN_STAY_HOUR);
  var serchCampaign = function(startSet, endSet, joinFlag, photoFlag, callback){
    var options = {
      'cid': req.user.cid,
      'active': true
    };
    var _sort;
    if(startSet){
      options.start_time = startSet;
    }
    if(endSet){
      options.end_time = endSet;
    }
    if(joinFlag){
      options['$or'] = [{ 'member.uid': req.user._id }, { 'camp.member.uid': req.user._id }];
      _sort ='start_time';
    }
    else{
      options['$nor'] = [{ 'member.uid': req.user._id }, { 'camp.member.uid': req.user._id }];
      _sort ='-create_time';
    }

    var query = Campaign.find(options).sort(_sort);
    if(photoFlag){
      query = query.populate('photo_album');
    }

    query.exec()
    .then(function(campaigns){
      callback(null,formatCampaign(campaigns,'user',req.role,req.user,{photoFlag:photoFlag,nowFlag:joinFlag}));
    });
  }
  async.series([
    function(callback){
      serchCampaign({'$gte':now },undefined, false, false, callback);
    },//所有新活动的活动，（未参加）
    function(callback){
      serchCampaign({ '$gte':now }, undefined, true, false, callback);
    },//马上开始的活动,（已参加）
    function(callback){
      serchCampaign({ '$lt': now},{'$gte':now }, true, true, callback);
    }//正在进行的活动
  ], function(err, values) {
    if(err){
      console.log(err);
      return res.send({ result: 0, campaigns: [] });
    }
    else{
      return res.send({ result: 1, campaigns: values });
    }
  });
};
exports.getUserAllCampaignsForCalendar = function(req, res) {
  var allow = auth(req.user,{
    users:[req.params.userId]
  },[
    'getUserAllCampaignsForCalendar'
  ]);
  if(allow.getUserAllCampaignsForCalendar === true){
    getUserAllCampaigns(req.user, true, req.query, function(campaigns) {
      var format_campaigns = formatCampaignForCalendar(req.user, campaigns);
      res.send({
        success: 1,
        result: format_campaigns
      });
    });
  } else {
      getUserJoinedCampaigns(req.profile, true, req.query, function(campaigns) {
        var format_campaigns = formatCampaignForCalendar(req.profile, campaigns);
        res.send({
          success: 1,
          result: format_campaigns
        });
      });
  }
};

exports.getUserJoinedCampaignsForCalendar = function(req, res) {
  getUserJoinedCampaigns(req.profile, true, req.query, function(campaigns) {
    var format_campaigns = formatCampaignForCalendar(req.profile, campaigns);
    res.send({
      success: 1,
      result: format_campaigns
    });
  });
};

exports.getUserUnjoinCampaignsForCalendar = function(req, res) {
  if (req.role !== 'OWNER') {
    res.status(403);
    next('forbidden');
    return;
  }
  getUserUnjoinCampaigns(req.profile, true, req.query, function(campaigns) {
    var format_campaigns = formatCampaignForCalendar(req.profile, campaigns);
    res.send({
      success: 1,
      result: format_campaigns
    });
  });
};
//已全部用getCampaigns M
// exports.getUserAllCampaignsForList = function(req, res) {
//   getUserAllCampaigns(req.profile, false, function(campaigns) {
//     var format_campaigns = formatCampaign(campaigns, 'user', req.role, req.profile);
//     res.send({ result: 1, campaigns: format_campaigns });
//   });
// };

// exports.getUserJoinedCampaignsForList = function(req, res) {
//   getUserJoinedCampaigns(req.profile, false, function(campaigns) {
//     var format_campaigns = formatCampaign(campaigns, 'user', req.role, req.profile);
//     res.send({ result: 1, campaigns: format_campaigns });
//   });
// };

// exports.getUserUnjoinCampaignsForList = function(req, res) {
//   getUserUnjoinCampaigns(req.profile, false, function(campaigns) {
//     var format_campaigns = formatCampaign(campaigns, 'user', req.role, req.profile);
//     res.send({ result: 1, campaigns: format_campaigns });
//   });
// };
var firstLength = 1;
var twoLength =6;
var threeLength = 3;

exports.getUserNowCampaignsForAppList = function(req, res) {
  var now = new Date();
  var startTimeLimit = new Date();
  startTimeLimit.setHours(startTimeLimit.getHours()+systemConfig.CAMPAIGN_STAY_HOUR);
  var endTimeLimit = new Date();
  endTimeLimit.setHours(endTimeLimit.getHours()-systemConfig.CAMPAIGN_STAY_HOUR);
  var serchCampaign = function(startSet, endSet, limit, sort, callback){
    var options = {
      'cid': req.user.cid,
      '$or': [{ 'member.uid': req.user._id }, { 'camp.member.uid': req.user._id }],
      'active': true
    };
    if(startSet){
      options.start_time = startSet;
    }
    if(endSet){
      options.end_time = endSet;
    }
    Campaign
    .find(options)
    .sort(sort)
    .limit(limit)
    .populate('team')
    .populate('cid')
    .populate('photo_album')
    .exec()
    .then(function(campaigns) {
      callback(null,formatCampaignsForApp(req.user, campaigns, true));
    });
  }
  async.series([
    function(callback){
      serchCampaign({ '$lt': startTimeLimit,'$gte':now }, undefined, firstLength, 'start_time', callback);
    },//马上开始的1个活动
    function(callback){
      serchCampaign({ '$lt': now},{'$gte':now }, twoLength, 'start_time', callback);
    },//正在进行的6个活动
    function(callback){
      serchCampaign(undefined,{ '$lt': now,'$gte': endTimeLimit}, threeLength, '-end_time', callback);
    }//已经完成的3个活动
  ], function(err, values) {
    if(err){
      console.log(err);
      return res.send({ result: 0, campaigns: [] });
    }
    else{
      var resultCampaign = [];
      values[0].length>0 && resultCampaign.push(values[0][0]);
      if(values[1].length>0){
        resultCampaign = resultCampaign.concat(values[1]);
      }
      if(values[2].length > 0){
        resultCampaign = resultCampaign.concat(values[2]);
      }
      return res.send({ result: 1, campaigns: resultCampaign });
    }
  });
};

exports.getUserNewCampaignsForAppList = function(req, res) {
  var endTimeLimit = new Date();
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
    'end_time': { '$gt': endTimeLimit }
  };
  Campaign
  .find(options)
  .sort('-create_time')
  .populate('team')
  .populate('cid')
  .exec()
  .then(function(campaigns) {
    var format_campaigns = formatCampaignsForApp(req.user, campaigns, false);
    return res.send({ result: 1, campaigns: format_campaigns });
  })
  .then(null, function(err) {
    console.log(err);
    return res.send({ result: 0, campaigns: [] });
  });
};
var newFinishSize =10;
var findLimitTime = 2;
/**
 * 查找新结束的newFinishSize个活动，选择照片数最大的返回，如果都为0则继续查找，最大查找findLimtiTime次
 * @param  {[object]} options  查找条件
 * @param  {[number]} skipSize 查找结果忽略的个数
 * @param  {[number]} findTime 查找次数
 * @param  {[object]} res res
 * @return {[type]} object       返回照片最多的活动
 */
var findUserNewFinishCampaigns= function(options, skipSize, findTime, res){
  Campaign
  .find(options)
  .skip(skipSize)
  .limit(newFinishSize)
  .sort('-end_time')
  .populate('team')
  .populate('cid')
  .populate('photo_album')
  .exec()
  .then(function(campaigns) {
    var campaign_index=0;
    var maxPhotoCount = 0;
    campaigns.forEach(function(_campaign,_index){
      if(_campaign.photo_album.photo_count>maxPhotoCount){
        campaign_index = _index;
        maxPhotoCount = _campaign.photo_album.photo_count;
      }
    });
    if(maxPhotoCount<3){
      skipSize = skipSize+newFinishSize;
      if(findTime>=findLimitTime){
        return res.send({ result: 1, campaigns: null });
      }
      else{
        findTime++;
        findUserNewFinishCampaigns(options, skipSize, findTime, res);
      }
    }
    else{
      var format_campaigns = {
        'finishStatus': true,
        '_id':campaigns[campaign_index]._id,
        'theme': campaigns[campaign_index].theme,
        'formatTime':model_helper.formatTime(campaigns[campaign_index].end_time),
        'photo_thumbnails': photo_album_controller.photoThumbnailList(campaigns[campaign_index].photo_album, 4)
      }
      return res.send({ result: 1, campaigns: format_campaigns });
    }
  })
  .then(null, function(err) {
    console.log(err);
    res.send(500);
  });
}
exports.getUserNewFinishCampaignsForAppList = function(req, res) {
  var endTimeLimit = new Date();
  var options = {
    'cid': req.user.cid,
    '$or': [{ 'member.uid': req.user._id }, { 'camp.member.uid': req.user._id }],
    'active': true,
    'end_time': { '$lte': endTimeLimit }
  };
  var skipSize=0;
  var findTime =1;
  findUserNewFinishCampaigns(options, skipSize, findTime, res);
};
exports.getTeamCampaigns = function(req, res) {
  getTeamAllCampaigns(req.params.teamId, function(campaigns, err) {
    var format_campaigns = formatCampaignForCalendar(req.user, campaigns);
    res.send({
      success: 1,
      result: format_campaigns
    });
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
  .sort('-start_time').skip(blockSize*req.params.page).limit(blockSize)
  .populate('team')
  .populate('cid')
  .exec()
  .then(function(campaigns) {
    var format_campaigns = formatCampaignsForApp(req.user, campaigns, false);
    res.send({ result: 1, campaigns: format_campaigns });
  })
  .then(null, function(err) {
    console.log(err);
    res.send(500);
  });
};

exports.getUserJoinedCampaignsForAppList = function(req, res) {
  var team_ids = [];
  for (var i = 0; i < req.user.team.length; i++) {
    team_ids.push(req.user.team[i]._id);
  }
  var startLimit = new Date();
  startLimit.setFullYear(startLimit.getFullYear()+1);
  var options = {
    'cid': req.user.cid,
    '$or': [{ 'member.uid': req.user._id }, { 'camp.member.uid': req.user._id }],
    'active': true,
    'start_time': { '$gt': Date.now(),'$lte':startLimit }
  };

  Campaign
  .find(options)
  .sort('start_time').skip(blockSize*req.params.page).limit(blockSize)
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


exports.addRichCommentIfNot = function (req, res, next) {
  var campaign = req.campaign;
  if (!campaign.modularization) {
    var RichComment = mongoose.model('RichComment');

    RichComment.establish(campaign, function (err, richComment) {
      campaign.components.push({
        name: 'RichComment',
        _id: richComment._id
      });
      campaign.modularization = true;
      campaign.save(function (err) {
        if (err) { next(err); }
        else { next(); }
      });
    });

  } else {
    next();
  }
};

exports.getOneNotice = function (req, res, next) {
  MessageContent.find({
    'campaign_id': campaign._id,
    'status': 'undelete'
  })
    .sort('-post_date')
    .limit(1)
    .exec()
    .then(function (messageContents) {
      req.notice = messageContents[0];
      next();
    })
    .then(null, function (err) {
      console.log(err);
      // 获取公告失败依然渲染活动页面
      next();
    });
}

exports.renderCampaignDetail = function (req, res) {
  var campaign = req.campaign;
  moment.lang('zh-cn');

  var memberIds = [];
  campaign.members.forEach(function (member) {
    memberIds.push(member._id);
  });
  var allow = auth(req.user, {
    companies: campaign.cid,
    teams: campaign.tid,
    users: memberIds
  }, [
    'publishComment',
    'setScoreBoardScore',
    'confirmScoreBoardScore'
  ]);

  // todo 面包屑


  var isJoin = Boolean(campaign.whichUnit(req.user._id));

  res.render('campaign/campaign_detail', {
    campaign: campaign,
    over: campaign.deadline < Date.now(),
    isStart: campaign.start_time < Date.now(),
    isEnd: campaign.end_time < Date.now(),
    isJoin: isJoin,
    notice: req.notice,
    moment: moment,
    allow: allow
  });


};



//员工参加活动
exports.joinCampaign = function (req, res) {
  var campaign = req.campaign;

  if (campaign.campaign_type === 1) {
    var allow = auth(req.user, {
      companies: campaign.cid
    }, ['joinCompanyCampaign']);
    if (!allow.joinCompanyCampaign) {
      return res.send(403);
    }
  } else {
    var allow = auth(req.user, {
      teams: campaign.tid
    }, ['joinTeamCampaign']);
    if (!allow.joinTeamCampaign) {
      return res.send(403);
    }
  }

  var joinResult = campaign.join({
    cid: req.body.cid,
    tid: req.body.tid
  }, req.user);

  if (!joinResult.success) {
    return res.send({ result: 0, msg: joinResult.msg });
  } else {
    campaign.save(function (err) {
      if (err) {
        console.log(err);
        return res.send({ result: 0, msg: '参加失败，请重试' });
      } else {
        return res.send({ result: 1 });
      }
    });
  }

};


//员工退出活动
exports.quitCampaign = function (req, res) {
  var campaign = req.campaign;

  var uids = [];
  campaign.members.forEach(function (member) {
    uids.push(member._id);
  });
  var allow = auth(req.user, {
    users: uids
  }, ['quitCampaign']);
  if (!allow.quitCampaign) {
    return res.send(403);
  }

  var quitResult = campaign.quit(req.user._id);
  if (quitResult) {
    campaign.save(function (err) {
      if (err) {
        res.send({ result: 0, msg: '退出活动失败，请重试。' });
      } else {
        res.send({ result: 1 });
      }
    });
  } else {
    res.send({ result: 0, msg: '退出活动失败，请重试。' });
  }
};



//员工投票是否参加约战
//记得要做重复投票检查 TODO
exports.vote = function (req, res) {
  if(req.role!=='MEMBER' && req.role!=='LEADER'){
    res.status(403);
    next('forbidden');
    return;
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

exports.getCampaignDetail = function(req, res, next) {
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


//发活动接口
exports.newCampaign = function(basicInfo, providerInfo, photoInfo, callback){
//basicInfo: req.body,
//provider_info: for poster、campaign_type、campaignUnit、tid、cid etc
//photoInfo: photo_album needed

  //---basicInfo
  var campaign = new Campaign();
  campaign.theme = basicInfo.theme;//主题
  campaign.content = basicInfo.content; //活动内容
  campaign.location = basicInfo.location; //活动地点
  campaign.start_time = basicInfo.start_time;
  campaign.end_time = basicInfo.end_time;
  campaign.member_min = basicInfo.member_min ? basicInfo.member_min : 0;
  campaign.member_max = basicInfo.member_max ? basicInfo.member_max : 0;
  campaign.start_time = basicInfo.start_time;
  campaign.end_time = basicInfo.end_time;
  campaign.deadline = basicInfo.deadline ? basicInfo.deadline : basicInfo.start_time;
  campaign.active = true;
  if(basicInfo.tags.length>0)
    campaign.tags = basicInfo.tags;
  var _now = new Date();
  if (campaign.start_time < _now || campaign.end_time < _now || campaign.deadline < _now) {
    callback(400,'活动的时间比现在更早');
  }
  else{
    //---providerInfo
    for (var attr in providerInfo) {
      campaign[attr] = providerInfo[attr];
    }

    //---Photo
    var photo_album = new PhotoAlbum();
    for (var attr in photoInfo){
      photo_album[attr]=photoInfo[attr];
    }
    photo_album.owner.model._id=campaign._id;

    //---save

    photo_album.save(function(err) {
      if(err) callback(500,'保存相册失败');
      campaign.photo_album = photo_album._id;

      campaign.components = [];
      campaign.modularization = true;
      var componentNames = ['RichComment']; // 'ScoreBoard'已可用，可在比赛中使用

      // todo component data

      async.map(componentNames, function (componentName, asyncCallback) {
        mongoose.model(componentName).establish(campaign, function (err, component) {
          if (err) { asyncCallback(err); }
          else {
            campaign.components.push({
              name: componentName,
              _id: component._id
            });
            asyncCallback(null, component);
          }
        });
      }, function (err, results) {
        if (err) { callback(500, '创建活动组件失败'); }
        else {
          campaign.save(function(err) {
            if(err) callback(500,'保存活动失败');
            else callback(null,{'campaign_id':campaign._id,'photo_album_id':photo_album._id});
          });
        }
      });
    });
  }
};

exports.campaign = function(req, res, next, id){
  Campaign
    .findById(id)
    .populate('photo_album')
    .exec()
    .then(function (campaign) {
      if (!campaign) {
        res.status(404);
        return next('not found');
      }
      req.campaign = campaign;
      next();
    })
    .then(null, function (err) {
      next(err);
    });
};
