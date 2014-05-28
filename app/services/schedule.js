'use strict';

var mongoose = require('mongoose'),
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
    Competition.update({'poster.cid': cid},{$set:{'poster.cname':company.info.name}},{multi: true},function(err,num){
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
    Competition.update({'poster.uid': uid},{$set:{'poster.nickname':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    //目前无法进行嵌套数组的定位，所以分别进行camp A和 camp B的查找
    Competition.update({'camp.0.member.uid': uid},{$set:{'camp.0.member.$.nickname':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    Competition.update({'camp.1.member.uid': uid},{$set:{'camp.1.member.$.nickname':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
  }).then(null,console.log);
}
//同步小组名称
exports.updateTname =function (tid){
  console.log(tid);
  CompanyGroup.findOne({_id: tid}).exec().then(function(companyGroup){
    Company.update({'team.id': tid},{$set:{'team.$.name':companyGroup.name}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    User.find({'group.team.id': tid},function(err,users){
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
                    if(err){
                      console.log(err);
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
      if(err){
        console.log(err);
      }
    });
    Competition.update({'camp.id': tid},{$set:{'camp.$.tname':companyGroup.name}},{multi: true},function(err,num){
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
    Competition.update({'camp.0.member.uid': uid},{$set:{'camp.0.member.$.photo':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    Competition.update({'camp.1.member.uid': uid},{$set:{'camp.1.member.$.photo':user.nickname}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
  }).then(null,console.log);
}

//同步小组logo
exports.updateTlogo =function (tid){
  console.log(tid);
  CompanyGroup.findOne({_id: tid}).exec().then(function(companyGroup){
    Competition.update({'camp.id': tid},{$set:{'camp.$.logo':companyGroup.logo}},{multi: true},function(err,num){
      if(err){
        console.log(err);
      }
    });
    User.find({'group.team.id': tid},function(err,users){
      if(err){
        console.log(err);
      }
      else{
        users.forEach(function(value){
          for(var i=0;i<value.group.length;i++){
            if(value.group[i]._id ==companyGroup.gid){
              for(var j= 0; j<value.group[i].team.length;j++){
                if(value.group[i].team[j].id==tid){
                  value.group[i].team[j].photo = companyGroup.logo;
                  value.save(function(err){
                    if(err){
                      console.log(err);
                    }
                  });
                }
              }
            }
          }
        });
      }
    });
  }).then(null,console.log);
}