'use strict';
var mongoose = require('mongoose'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    User = mongoose.model('User'),
    Group = mongoose.model('Group'),
    Campaign = mongoose.model('Campaign'),
    GroupMessage = mongoose.model('GroupMessage');




//根据小队ID返回小组动态消息
exports.getMessage = function(req, res) {
  if(req.params.type==='team' && (req.session.role ==='GUESTHR' || req.session.role ==='GUEST') || req.params.type==='user' && req.session.role !=='OWNER'){
    return res.send(403,forbidden);
  }
  var option = {};
  if (req.params.type==='team') {
    option = {
      'team.teamid' : req.session.nowtid,
      'active':true
    }
  }
  else{
    var team_ids = [];
    req.user.group.forEach(function(group){
      group.team.forEach(function(team){
        team_ids.push(team.id);
      });
    })
    option = {
      'team.teamid' : {'$in':team_ids},
      'active':true
    }
  };
  GroupMessage.find(option).sort({'creat_time':-1}).populate('campaign')
  .exec(function(err, group_message) {
    if (err || !group_message) {
      console.log(err);
      return res.status(404).send([]);
    } else {
      var group_messages = [];
      var length = group_message.length;
      for(var i = 0; i < length; i ++) {
        var _group_message ={};
        if(group_message[i].message_type === 3 || group_message[i].message_type === 4){
          var camp_flag = group_message[i].campaign.camp[0].id===group_message[i].team.teamid ? 0 : 1;
          _group_message = {
            'message_type' : group_message[i].message_type,
            'company' : group_message[i].company,
            'team' : group_message[i].team,
            'campaign' : group_message[i].campaign,
            'creat_time' : group_message[i].creat_time,
            'camp_flag':camp_flag
          };
          if(group_message[i].message_type === 3){
            if(req.user.provider==='user'){
              var vote_flag = 0;
              if(group_message[i].campaign.camp[camp_flag].vote.positive>0 ){
                group_message[i].campaign.camp[camp_flag].vote.positive_member.forEach(function(member){
                  if(member.uid === req.user._id){
                    vote_flag = 1;
                  }
                });
              }
              if(group_message[i].campaign.camp[camp_flag].vote.negatuve>0 ){
                group_message[i].campaign.camp[camp_flag].vote.negatuve_member.forEach(function(member){
                  if(member.uid === req.user._id){
                    vote_flag = -1;
                  }
                });
              }
              _group_message.vote_flag = vote_flag;
            }
            if(req.session.role === 'HR' || req.session.role ==='LEADER'){
              if(camp_flag===1 && group_message[i].campaign.camp[1].start_confirm===false)
                _group_message.provoke_accept = true;
            }

          }
          else if(group_message[i].message_type === 3) {
            if(req.user.provider==='user'){
              var join_flag = false;
              if(group_message[i].campaign.camp[camp_flag].member.length>0){
                group_message[i].campaign.camp[camp_flag].member.forEach(function(member){
                  if(member.uid === req.user._id){
                    join_flag = true;
                  }
                });
              }

              _group_message.join_flag = join_flag;
            }
          }
        }
        else if(group_message[i].message_type === 1){
          _group_message = {
            'message_type' : group_message[i].message_type,
            'company' : group_message[i].company,
            'team' : group_message[i].team,
            'campaign' : group_message[i].campaign,
            'creat_time' : group_message[i].creat_time
          };
          if(req.user.provider==='user'){
            var join_flag = false;
            group_message[i].campaign.member.forEach(function(member){
              if(member.uid === req.user._id){
                join_flag = true;
              }
            });
            _group_message.join_flag = join_flag;
          }
        }
        else{
          _group_message = group_message[i];
        }
        group_messages.push(_group_message);
      }
      return res.send({'group_messages':group_messages,'role':req.session.role});
     }
  });
};