'use strict';

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    GroupMessage = mongoose.model('GroupMessage'),
    Campaign = mongoose.model('Campaign'),
    schedule = require('node-schedule');
var finishCampaign = function(){
  Campaign.update({'finish':false,'end_time': {'$lt':new Date()}},{$set:{'finish':true}},{multi: true},function(err,num){
    if(err){
      console.log(err);
    }
    else{
      console.log('finishCampaign:'+num);
    }
  });
}
var countCampaign = function (startTime,endTime,type){
  CompanyGroup.find({'active':true},function(err,teams){
    if(err){
      console.log(err);
    }
    else{
      teams.forEach(function(value){
        var campaignNum=0;
        var memberNum=0;
        Campaign.find({'active':true,'team':value._id,'end_time':{'$lte':endTime,'$gt':startTime}},function(err,campaigns){
          campaigns.forEach(function(campaign){
            if(campaign.camp.length==0){
                campaignNum++;
                memberNum+=campaign.member.length;
            }
            else{
              var camp_index = campaign.camp[0].id.toString()===value._id.toString() ? 0:1;
              campaignNum++;
              memberNum+=campaign.camp[camp_index].member.length;
            }
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
}
var currentWeekCampaignCount = function(){
  var _nowTime=new Date();
  var startTime=new Date();
  startTime.setDate(_nowTime.getDate()-_nowTime.getDay());
  startTime.setHours(24);
  startTime.setMinutes(0);
  startTime.setSeconds(0);
  startTime.setMilliseconds(0);
  countCampaign(startTime,_nowTime,'currentWeek');
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
    CompanyGroup.update({cid: cid},{$set:{cname:company.info.name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    GroupMessage.update({'poster.cid': cid},{$set:{'poster.cname':company.info.name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    Campaign.update({'poster.cid': cid},{$set:{'poster.cname':company.info.name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    Campaign.update({'cid': cid},{$set:{'cname.$':company.info.name}},{multi: true},function(err,num){
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
  }).then(null,console.log);
}

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