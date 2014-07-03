'use strict';

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    GroupMessage = mongoose.model('GroupMessage'),
    Campaign = mongoose.model('Campaign'),
    schedule = require('node-schedule');
function finishCampaign(){
  Campaign.update({'active':true,'finish':false,'end_time': {'$lt':new Date()}},{$set:{'finish':true}},{multi: true},function(err,num){
    if(err){
      console.log(err);
    }
    else{
      console.log('finishCampaign:'+num);
    }
  });
}
function countCampaign(){
  CompanyGroup.find({'active':true},function(err,teams){
    if(err){
      console.log(err);
    }
    else{
      teams.forEach(function(value){
        var _now_time=new Date();
        var lastweek_time=new Date();
        var lastmonth_time=new Date();
        lastweek_time.setDate(new Date().getDate()-7);
        lastmonth_time.setMonth(new Date().getMonth()-1);
        var last_week_campaign=0;
        var last_week_member=0;
        var last_month_campaign=0;
        var last_month_member=0;
        var week_flag = false;
        Campaign.find({'active':true,'team':value._id,'end_time':{'$lt':new Date(),'$gt':lastmonth_time}},function(err,campaigns){
          campaigns.forEach(function(campaign){
            if(campaign.camp.length==0){
              last_month_campaign++;
              last_month_member+=campaign.member.length;
              if(week_flag){
                last_week_campaign++;
                last_week_member+=campaign.member.length;
              }
              else if(campaign.end_time>lastweek_time){
                week_flag = true;
                last_week_campaign++;
                last_week_member+=campaign.member.length;
              }
            }
            else{
              var camp_index = campaign.camp[0].id.toString()===value._id.toString() ? 0:1;
              last_month_campaign++;
              last_month_member+=campaign.camp[camp_index].member.length;
              if(week_flag){
                last_week_campaign++;
                last_week_member+=campaign.camp[camp_index].member.length;
              }
              else if(campaign.end_time>lastweek_time){
                week_flag = true;
                last_week_campaign++;
                last_week_member+=campaign.camp[camp_index].member.length;
              }
            }
          });
          value.count ={
            last_week_campaign: last_week_campaign,
            last_week_member: last_week_member,
            last_month_campaign: last_month_campaign,
            last_month_member:last_month_member
          }
          console.log(value._id,value.name,value.count);
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
exports.init = function(){
  var rule = new schedule.RecurrenceRule();
  rule.minute = 0;
  //rule.seconds = 0;
  var j = schedule.scheduleJob(rule, function(){
      finishCampaign();
      countCampaign();
  });
};
//统计活动数
exports.countCampaign = countCampaign;
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
    });
    CompanyGroup.update({'member._id': uid},{$set:{'member.$.nickname':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    GroupMessage.update({'poster.uid': uid},{$set:{'poster.nickname':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    Campaign.update({'poster.uid': uid},{$set:{'poster.nickname':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    Campaign.update({'member.uid': uid},{$set:{'member.$.nickname':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    //目前无法进行嵌套数组的定位，所以分别进行camp A和 camp B的查找
    Campaign.update({'camp.0.member.uid': uid},{$set:{'camp.0.member.$.nickname':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    Campaign.update({'camp.1.member.uid': uid},{$set:{'camp.1.member.$.nickname':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
  }).then(null,console.log);
}
//同步小队名称
exports.updateTname =function (tid){
  console.log(tid);
  CompanyGroup.findOne({_id: tid}).exec().then(function(companyGroup){
    Company.update({'team.id': tid},{$set:{'team.$.name':companyGroup.name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
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
    GroupMessage.update({'provoke.active':true,'provoke.camp.tid': tid},{$set:{'provoke.camp.$.tname':companyGroup.name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    Campaign.update({'camp.id': tid},{$set:{'camp.$.tname':companyGroup.name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
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
    });
    CompanyGroup.update({'member._id': uid},{$set:{'member.$.photo':user.photo}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    //目前无法进行嵌套数组的定位，所以分别进行camp A和 camp B的查找
    Campaign.update({'camp.0.member.uid': uid},{$set:{'camp.0.member.$.photo':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    Campaign.update({'camp.1.member.uid': uid},{$set:{'camp.1.member.$.photo':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
  }).then(null,console.log);
}

//同步小队logo
exports.updateTlogo =function (tid){
  console.log(tid);
  CompanyGroup.findOne({_id: tid}).exec().then(function(companyGroup){
    Competition.update({'camp.id': tid},{$set:{'camp.$.logo':companyGroup.logo}},{multi: true},function(err,num){
      if(err){
        console.log(err);
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