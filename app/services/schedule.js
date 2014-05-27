'use strict';

var schedule = require('node-schedule'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    GroupMessage = mongoose.model('GroupMessage'),
    Campaign = mongoose.model('Campaign'),
    Competition = mongoose.model('Competition');

// exports.init = function(){
//   var rule = new schedule.RecurrenceRule();
//   rule.second = 42;
//   var num=0;
//   //处理要做的事情
//   var j = schedule.scheduleJob(rule, function(){
//       console.log(num++,new Date());
//   });
// }
exports.updateCname =function (cid){
  Company.findOne({_id: cid}).exec().then(function(company){
    User.update({cid: cid},{$set:{cname:company.info.name}},{multi: true},function(err,num){
       console.log('User');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    CompanyGroup.update({cid: cid},{$set:{cname:company.info.name}},{multi: true},function(err,num){
      console.log('CompanyGroup');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    GroupMessage.update({'poster.cid': cid},{$set:{'poster.cname':company.info.name}},{multi: true},function(err,num){
      console.log('GroupMessage');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    Competition.update({'poster.cid': cid},{$set:{'poster.cname':company.info.name}},{multi: true},function(err,num){
      console.log('Competitionposter');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    Campaign.update({'poster.cid': cid},{$set:{'poster.cname':company.info.name}},{multi: true},function(err,num){
      console.log('Campaignposter');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    Campaign.update({'cid': cid},{$set:{'cname.$':company.info.name}},{multi: true},function(err,num){
      console.log('Campaignposter');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
  }).then(null,console.log);
}
exports.updateCompanyLogo =function (cid){

}
exports.updateUname =function (uid){
  console.log(uid);
  User.findOne({_id: uid}).exec().then(function(user){
    CompanyGroup.update({'leader._id': uid},{$set:{'leader.$.nickname':user.nickname}},{multi: true},function(err,num){
      console.log('CompanyGroupleader');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    CompanyGroup.update({'member._id': uid},{$set:{'member.$.nickname':user.nickname}},{multi: true},function(err,num){
      console.log('CompanyGroupmember');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    GroupMessage.update({'poster.uid': uid},{$set:{'poster.nickname':user.nickname}},{multi: true},function(err,num){
      console.log('GroupMessageposternickname');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    Campaign.update({'poster.uid': uid},{$set:{'poster.nickname':user.nickname}},{multi: true},function(err,num){
      console.log('Competitionposter');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    Campaign.update({'member.uid': uid},{$set:{'member.$.nickname':user.nickname}},{multi: true},function(err,num){
      console.log('Campaign.member');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    Competition.update({'poster.uid': uid},{$set:{'poster.nickname':user.nickname}},{multi: true},function(err,num){
      console.log('Competitionposter');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    //目前无法进行嵌套数组的定位，所以分别进行camp A和 camp B的查找
    Competition.update({'camp.0.member.uid': uid},{$set:{'camp.0.member.$.nickname':user.nickname}},{multi: true},function(err,num){
      console.log('Competitioncamp0.member');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    Competition.update({'camp.1.member.uid': uid},{$set:{'camp.1.member.$.nickname':user.nickname}},{multi: true},function(err,num){
      console.log('Competitioncamp1.member');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
  }).then(null,console.log);
}
exports.updateTname =function (tid){
  console.log(tid);
  CompanyGroup.findOne({_id: tid}).exec().then(function(companyGroup){
    Company.update({'team.id': tid},{$set:{'team.$.name':companyGroup.name}},{multi: true},function(err,num){
      console.log('Company');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    User.find({'group.team.id': tid},function(err,users){
      console.log('users');
      if(err){
        console.log(err);
      }
      else{
        users.forEach(function(value){
          for(var i=0;i<value.group.length;i++){
            if(value.group[i]._id ==companyGroup.gid){
              for(var j= 0; j<value.group[i].team.length;j++){
                if(value.group[i].team[j].id==tid){
                  value.group[i].team[j].name = companyGroup.name;
                  value.save(function(err){
                    if(!err){
                      console.log('userssuccess');
                    }
                  });
                }
              }
            }
          }
        });
      }
    });
    GroupMessage.update({'provoke.active':true,'provoke.camp.tid': tid},{$set:{'provoke.camp.$.tname':companyGroup.name}},{multi: true},function(err,num){
      console.log('GroupMessagetname');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
    Competition.update({'camp.id': tid},{$set:{'camp.$.tname':companyGroup.name}},{multi: true},function(err,num){
      console.log('Competitiontname');
      if(err){
        console.log(err);
      }
      else{
        console.log(num);
      }
    });
  }).then(null,console.log);
}