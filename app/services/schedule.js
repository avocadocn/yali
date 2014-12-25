'use strict';

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    GroupMessage = mongoose.model('GroupMessage'),
    Campaign = mongoose.model('Campaign'),
    Department = mongoose.model('Department'),
    async = require('async'),
    schedule = require('node-schedule');

var userScore = require('./user_score.js');

/**
 * 活动结束更新成员积分
 * @param {Function} callback [description]
 */
var addCampaignMemberScore = function (callback) {

  var pageSize = 20;
  var nowResultLength = 0;
  var totalCount = 0, successCount = 0, failedCount = 0;
  var nextQueryId;

  var updateMemberScore = function (campaign, mapCallback) {
    var memberIds = [];
    campaign.members.forEach(function (member) {
      memberIds.push(member._id);
    });

    User.update({
      _id: {
        $in: memberIds
      }
    }, {
      $inc: {
        "score.officialCampaignSucceded": userScore.scoreItems.officialCampaignSucceded,
        "score.total": userScore.scoreItems.officialCampaignSucceded
      }
    }, {
      multi: true
    }, function (err, num) {
      if (err) {
        console.log('更新活动成员积分出错:', err, '活动id:', campaign._id);
        console.log(err.stack);
        failedCount++;
      } else {
        successCount++
      }
      mapCallback();
    });

  };

  async.doWhilst(function (doWhilstCallback) {
    var query = {
      finish: false,
      end_time: {
        $lt: Date.now()
      }
    };
    if (nextQueryId) {
      query._id = {
        $gt: nextQueryId
      };
    }
    Campaign.find(query)
      .sort('_id')
      .limit(pageSize)
      .exec()
      .then(function (campaigns) {
        if (campaigns.length > 0) {
          nextQueryId = campaigns[campaigns.length - 1]._id;
          nowResultLength = campaigns.length;
          totalCount += campaigns.length;
        }
        async.map(campaigns, updateMemberScore, function (err, results) {
          doWhilstCallback();
        })

      })
      .then(null, function (err) {
        console.log('查找活动出错:', err);
        console.log(err.stack);
        doWhilstCallback();
      });

  }, function () {
    return nowResultLength === pageSize;
  }, function (err) {
    console.log('[更新活动成员分数]处理活动数:', totalCount, '成功:', successCount, '失败:', failedCount);
    callback(err);
  });

}

var finishCampaign = function(){
  //把比赛都开始都没应答的视为关闭
  Campaign.update({'active':true,'start_time':{'$lt':new Date()},'campaign_type':{'$in':[4,5,7,9]},'confirm_status':false},{$set:{'active':false}},{multi:true},function(err,num){
    if(err){
      console.log(err);
    }
    else{
      console.log('closeNoResponseCompetition:'+num);
    }
  })

  addCampaignMemberScore(function (err) {
    if (err) {
      console.log('更新积分出错：', err);
    }

    // 必须在更新完成员积分后再进行，否则无法查询将要设为结束的活动
    // 把时间到了的设为finish
    Campaign.update({'finish':false,'end_time': {'$lt':new Date()}},{$set:{'finish':true}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
      else{
        console.log('finishCampaign:'+num);
      }
    });

  })

  
  //把finish的但是没人参加的活动视为关闭
  //   db.campaigns.find({'$nor':[{'campaign_unit.member':{'$size':{'$gt':0}}}]})
  //   Campaign.find({'finish':true,'campaign_unit':{'$size':1},'campaign_unit.member':{'$size':0}});//可以
  //   Campaign.find({'finish':true,'campaign_unit':{'$size':2},'campaign_unit.0.member':{'$size':0},'campaign_unit.1.member':{'$size':0}})//可以
  // db.campaigns.find({'$not':{'campaign_unit.member':{'$size':{'$gt':0}}}},{'campaign_unit.member':1}).pretty()//无效
  // db.campaigns.find({'campaign_unit.member':{'$size':{'$gt':0}}},{'campaign_unit.member':1}).pretty()



}

var team_time_out = 30;
//统计所有小组的活动数、人员参与数、评论数、照片从而得出分数
var teamPoint = function(){
  CompanyGroup.find({'active':true}).populate('photo_album_list').exec(function(err,teams){
    if(err){
      console.log(err);
    }
    else{
      teams.forEach(function(value){
        var campaignNum=0;
        var participatorNum=0;
        var commentNum = 0;
        var photoNum = 0;
        var memberNum = 0;
        memberNum = value.member.length;
        //统计小队照片总数
        for(var i = 0; i < value.photo_album_list.length; i ++){
          photoNum += value.photo_album_list[i].photo_count;
        }
        Campaign.find({'active':true,'tid':value._id,'end_time':{'$lte':new Date()}}).populate('photo_album').exec(function(err,campaigns){
          campaigns.forEach(function(campaign){
            campaignNum++;
            participatorNum+=campaign.members.length;
            commentNum += campaign.comment_sum;
            photoNum += campaign.photo_album.photo_count; //属于小队的活动的相片总数
          });
          var provoke;
          if(value.score.provoke != undefined || value.score.provoke != null){
            provoke = value.score.provoke;
          }else{
            provoke = 0;
          }
          value.score = {
            'campaign' : campaignNum * 10,
            'album' : parseInt(photoNum/5),
            'comment' : parseInt(commentNum / 20),
            'participator' : participatorNum,
            'member' : memberNum * 10,
            'provoke' : provoke,
            'total' : campaignNum * 10 + parseInt(photoNum/5) + parseInt(commentNum / 20) + participatorNum + memberNum * 10 + provoke
          }
          value.save(function(err){
            if(err){
              console.log('TEAM_POINT_FAILED!',err);
            }
          });
        });
      });
    }
  });
}


var countCampaign = function (startTime,endTime,type,newWeek){
  CompanyGroup.find({'active':true},function(err,teams){
    if(err){
      console.log(err);
    }
    else{
      teams.forEach(function(value){
        var campaignNum=0;
        var memberNum=0;
        Campaign.find({'active':true,'tid':value._id,'end_time':{'$lte':endTime,'$gt':startTime}},function(err,campaigns){
          campaigns.forEach(function(campaign){
            campaignNum++;
            memberNum+=campaign.members.length;
          });
          switch(type){
            case 'currentWeek':
            value.count.current_week_campaign = campaignNum;
            value.count.current_week_member = memberNum;
            break;
            case 'lastWeek':
            value.count.last_week_campaign = campaignNum;
            value.count.last_week_member = memberNum;
            break;
            case 'lastMonth':
            value.count.last_month_campaign = campaignNum;
            value.count.last_month_member = memberNum;
            break;
            default:
            break;
          }
          value.save(function(err){
            if(err){
              console.log(err);
            }
          });
        });
      });
    }
  });
};
var currentWeekCampaignCount = function(){
  var _nowTime=new Date();
  var startTime=new Date();
  startTime.setDate(_nowTime.getDate()-_nowTime.getDay());
  startTime.setHours(24);
  startTime.setMinutes(0);
  startTime.setSeconds(0);
  startTime.setMilliseconds(0);
  countCampaign(startTime,_nowTime,'currentWeek',_nowTime.getDay() === 0);
}
var lastWeekCampaignCount =  function(){
  var _nowTime=new Date();
  var startTime=new Date();
  startTime.setDate(_nowTime.getDate()-_nowTime.getDay()-7);
  startTime.setHours(24);
  startTime.setMinutes(0);
  startTime.setSeconds(0);
  startTime.setMilliseconds(0);
  var endTime=new Date();
  endTime.setDate(_nowTime.getDate()-_nowTime.getDay());
  endTime.setHours(24);
  endTime.setMinutes(0);
  endTime.setSeconds(0);
  endTime.setMilliseconds(0);
  countCampaign(startTime,endTime,'lastWeek');
}
var lastMonthCampaignCount =  function(){
  var _nowTime=new Date();
  var startTime=new Date();
  startTime.setMonth(_nowTime.getMonth()-1);
  startTime.setDate(1);
  startTime.setHours(0);
  startTime.setMinutes(0);
  startTime.setSeconds(0);
  startTime.setMilliseconds(0);
  var endTime=new Date();
  endTime.setDate(1);
  endTime.setHours(0);
  endTime.setMinutes(0);
  endTime.setSeconds(0);
  endTime.setMilliseconds(0);
  countCampaign(startTime,endTime,'lastMonth');
}
exports.init = function(){
  //自动统计小队分数
  var teamPointRule = new schedule.RecurrenceRule();
  teamPointRule.minute = team_time_out;
  var teamPointSchedule = schedule.scheduleJob(teamPointRule, function(){
      teamPoint();
  });
  //自动完成已经结束的活动
  var finishCampaignRule = new schedule.RecurrenceRule();
  finishCampaignRule.minute = 0;
  var finishCampaignSchedule = schedule.scheduleJob(finishCampaignRule, function(){
      finishCampaign();
  });
  //统计本周的活动数和活动人次，每小时一次
  var currentWeekCampaignRule = new schedule.RecurrenceRule();
  currentWeekCampaignRule.minute = 0;
  var currentWeekCampaignSchedule = schedule.scheduleJob(currentWeekCampaignRule,currentWeekCampaignCount );
  //统计上周的活动数和活动人次，每周一的0点运行一次
  var lastWeekCampaignRule = new schedule.RecurrenceRule();
  lastWeekCampaignRule.dayOfWeek = 1;
  lastWeekCampaignRule.hour = 0;
  lastWeekCampaignRule.minute = 0;
  var lastWeekCampaignSchedule = schedule.scheduleJob(lastWeekCampaignRule, lastWeekCampaignCount);
  //统计上月的活动数和活动人次，每月1号的0点运行一次
  var lastMonthCampaignRule = new schedule.RecurrenceRule();
  lastMonthCampaignRule.date = 1;
  lastMonthCampaignRule.hour = 0;
  lastMonthCampaignRule.minute = 0;
  var lastMonthCampaignSchedule = schedule.scheduleJob(lastMonthCampaignRule,lastMonthCampaignCount);
};
//统计活动数
exports.countCampaign = function(){
  currentWeekCampaignCount();
  lastWeekCampaignCount();
  lastMonthCampaignCount();
}
exports.finishCampaign = finishCampaign;
//同步公司名
exports.updateCname =function (cid){
  Company.findOne({_id: cid}).exec().then(function(company){
    User.update({cid: cid},{$set:{cname:company.info.name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    CompanyGroup.update({cid: cid},{$set:{cname:company.info.official_name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    GroupMessage.update({'poster.cid': cid},{$set:{'poster.cname':company.info.official_name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    Campaign.update({'poster.cid': cid},{$set:{'poster.cname':company.info.official_name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    Campaign.update({'cid': cid},{$set:{'cname.$':company.info.official_name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
  }).then(null,console.log);
}
//同步公司logo
exports.updateCompanyLogo =function (cid){

}

//同步用户昵称
exports.updateUname =function (uid){
  User.findOne({_id: uid}).exec().then(function(user){
    CompanyGroup.update({'leader._id': uid},{$set:{'leader.$.nickname':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
      else{
        console.log('updateUname_CompanyGroup_leader',num);
      }
    });
    CompanyGroup.update({'member._id': uid},{$set:{'member.$.nickname':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }else{
        console.log('updateUname_CompanyGroup_member',num);
      }
    });
    Department.update({'manager._id': uid}, {$set: {'manager.$.nickname':user.nickname}}, function(err, num) {
      if(err){
        console.log(err);
      }else{
        console.log('updateUname_Department_manager',num);
      }
    });
  }).then(null,console.log);
}
//同步小队名称
exports.updateTname =function (tid){
  CompanyGroup.findOne({_id: tid}).exec().then(function(companyGroup){
    Company.update({'team.id': tid},{$set:{'team.$.name':companyGroup.name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
      else{
        console.log('updateTname_CompanyGroup',num);
      }
    });
    User.find({'team._id': tid},function(err,users){
      if(err){
        console.log(err);
      }
      else{
        users.forEach(function(value){
          for(var i=0; i < value.team.length; i++){
            if(value.team[i].gid === companyGroup.gid){
              if(value.team[i]._id.toString() === tid.toString()){
                value.team[i].name = companyGroup.name;
                value.save(function(err){
                  if(err){
                    console.log(err);
                  }
                });
              }
            }
          }
        });
      }
    });
  }).then(null,console.log);
}

//同步用户logo
exports.updateUlogo =function (uid){
  User.findOne({_id: uid}).exec().then(function(user){
    CompanyGroup.update({'leader._id': uid},{$set:{'leader.$.photo':user.photo}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
      else{
        console.log('updateUlogo_CompanyGroup',num);
      }
    });
    CompanyGroup.update({'member._id': uid},{$set:{'member.$.photo':user.photo}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }else{
        console.log('updateUlogo_CompanyGroup_member',num);
      }
    });
    Department.update({'manager._id': uid}, {$set: {'manager.$.photo':user.photo}}, function(err, num) {
      if(err){
        console.log(err);
      }else{
        console.log('updateUlogo_Department_manager',num);
      }
    });
  }).then(null,console.log);
};

//同步小队logo
exports.updateTlogo =function (tid){
  CompanyGroup.findOne({_id: tid}).exec().then(function(companyGroup){
    User.find({'team._id': tid},function(err,users){
      if(err){
        console.log(err);
      }
      else{
        users.forEach(function(value){
          for(var i=0; i < value.team.length; i++){
            if(value.team[i].gid === companyGroup.gid){
              if(value.team[i]._id.toString() === tid.toString()){
                value.team[i].logo = companyGroup.logo;
                value.save(function(err){
                  if(err){
                    console.log(err);
                  }
                });
              }
            }
          }
        });
      }
    });
  }).then(null,console.log);
}