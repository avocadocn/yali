'use strict';
var mongoose = require('mongoose'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    User = mongoose.model('User'),
    Group = mongoose.model('Group'),
    Campaign = mongoose.model('Campaign'),
    GroupMessage = mongoose.model('GroupMessage');


var pagesize = 20;
exports.renderMessageList =function(req,res){
  res.render('partials/message_list',{
    'role':req.session.role
  });
};
//根据小队ID返回小组动态消息
exports.getMessage = function(req, res) {
  if(req.params.pageType==="team"&&req.session.role !=='HR' && req.session.role !=='LEADER' && req.session.role !=='MEMBER' && req.session.role !=='PARTNER' || req.params.pageType==="user"&&req.session.role !=='OWNER' ){
    return res.send(403,'forbidden');
  }
  var option = {};
  if(req.params.pageType==="team"){
    option ={
      'team.teamid' : req.session.nowtid,
      'active':true
    };
  }
  else {
    var team_ids = [];
    req.user.team.forEach(function(team){
      team_ids.push(team.id.toString());
    });
    option ={
      'team.teamid' : req.session.nowtid,
      'active':true
    };
  }
  if(req.params.start_time!=0){
    var _start_Date = new Date();
    option.create_time={'$lt':_start_Date.setTime(req.params.start_time)}
  }
  GroupMessage.find(option)
  .limit(pagesize)
  .sort({'create_time':-1}).populate('campaign')
  .exec(function(err, group_message) {
    if (err || !group_message) {
      console.log(err);
      return res.status(404).send([]);
    } else {
      var group_messages = [];
      var length = group_message.length;
      for(var i = 0; i < length; i ++) {
        var _group_message ={
          '_id': group_message[i]._id,
          'message_type' : group_message[i].message_type,
          'company' : group_message[i].company,
          'team' : group_message[i].team,
          'campaign' : group_message[i].campaign,
          'create_time' : group_message[i].create_time,
          'user': group_message[i].user
        };
        switch (group_message[i].message_type){
          case 0:
          _group_message.logo = group_message[i].company[0].logo;
          if(req.user.provider==='user' && new Date()<group_message[i].campaign.deadline){
            var join_flag = false;
            group_message[i].campaign.member.forEach(function(member){
              if(member.uid.toString() === req.user._id.toString()){
                join_flag = true;
              }
            });
            _group_message.member_num = group_message[i].campaign.member.length;
            _group_message.join_flag = join_flag;
          }
          break;
          case 1:
            _group_message.logo = group_message[i].team[0].logo;
            if(req.user.provider==='user' && new Date()<group_message[i].campaign.deadline){
              var join_flag = false;
              group_message[i].campaign.member.forEach(function(member){
                if(member.uid.toString() === req.user._id.toString()){
                  join_flag = true;
                }
              });
              _group_message.member_num = group_message[i].campaign.member.length;
              _group_message.join_flag = join_flag;
            }
          break;
          case 2:
            _group_message.logo = group_message[i].company[0].logo;
          break;
          case 3:
            _group_message.logo = group_message[i].team[0].logo;
          break;
          case 4:
            var camp_flag = group_message[i].campaign.camp[0].id== req.session.nowtid? 0 : 1;
            _group_message.camp_flag =camp_flag;
            _group_message.logo = group_message[i].team[camp_flag ].logo;
            _group_message.member_num = group_message[i].campaign.camp[camp_flag].member.length;
            if(req.user.provider==='user' && (req.session.role ==='LEADER' || req.session.role ==='MEMBER' )){
              //0：未投票，1：赞成，-1反对
              var vote_flag = 0;
              if(group_message[i].campaign.camp[camp_flag].vote.positive>0 ){
                group_message[i].campaign.camp[camp_flag].vote.positive_member.forEach(function(member){
                  if(member.uid.toString() === req.user._id.toString()){
                    vote_flag = 1;
                  }
                });
              }
              if(group_message[i].campaign.camp[camp_flag].vote.negative>0 ){
                group_message[i].campaign.camp[camp_flag].vote.negative_member.forEach(function(member){
                  if(member.uid.toString() === req.user._id.toString()){
                    vote_flag = -1;
                  }
                });
              }
              _group_message.vote_flag = vote_flag;
            }
            if(req.params.pageType==="team" &&(req.session.role === 'HR' || req.session.role ==='LEADER')){
              if(camp_flag===1 && group_message[i].campaign.camp[1].start_confirm===false)
                _group_message.response_flag = true;
            }
          break;
          case 5:
            var camp_flag = group_message[i].campaign.camp[0].id== req.session.nowtid? 0 : 1;
            _group_message.camp_flag =camp_flag;
            _group_message.logo = group_message[i].team[camp_flag ].logo;
            _group_message.member_num = group_message[i].campaign.camp[camp_flag].member.length;
            if(req.user.provider==='user' && new Date()<group_message[i].campaign.deadline){
              //没有参加为false，参加为true
              var join_flag = false;
              if(group_message[i].campaign.camp[camp_flag].member.length>0){
                group_message[i].campaign.camp[camp_flag].member.forEach(function(member){
                  if(member.uid.toString() === req.user._id.toString()){
                    join_flag = true;
                  }
                });
              }

              _group_message.join_flag = join_flag;
            }
          break;
          case 6:
            var camp_flag = group_message[i].campaign.camp[0].id== req.session.nowtid? 0 : 1;
            _group_message.camp_flag =camp_flag;
            _group_message.logo = group_message[i].team[camp_flag ].logo;
          break;
          case 7:
          case 8:
          _group_message.logo = group_message[i].user.logo;
          break;
          default:
          break;
        }
        group_messages.push(_group_message);
      }
      return res.send({'result':1,'group_messages':group_messages,'role':req.session.role,'user':{'nickname':req.user.nickname,'photo':req.user.photo}});
     }
  });
};