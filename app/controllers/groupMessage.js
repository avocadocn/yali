'use strict';
var mongoose = require('mongoose'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    User = mongoose.model('User'),
    Group = mongoose.model('Group'),
    Campaign = mongoose.model('Campaign'),
    GroupMessage = mongoose.model('GroupMessage');



exports.renderMessageList =function(req,res){
  res.render('partials/message_list',{
      'role':req.session.role
  });
};
//根据小队ID返回小组动态消息
exports.getTeamMessage = function(req, res) {
  if(req.session.role !=='HR' && req.session.role !=='LEADER' && req.session.role !=='MEMBER' && req.session.role !=='PARTNER'){
    return res.send(403,'forbidden');
  }
  GroupMessage.find({'team.teamid' : req.session.nowtid,
      'active':true}).sort({'create_time':-1}).populate('campaign')
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
        if(group_message[i].message_type === 4 || group_message[i].message_type === 5){
          var camp_flag = group_message[i].campaign.camp[0].id== req.session.nowtid? 0 : 1;
          _group_message.camp_flag =camp_flag;
          _group_message.logo = group_message[i].team[camp_flag ].logo;
          if(group_message[i].message_type === 4){
            if(req.user.provider==='user'){
              //0：未投票，1：赞成，-1反对
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
                _group_message.response_flag = true;
            }

          }
          else if(group_message[i].message_type === 5) {
            if(req.user.provider==='user'){
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
          }
        }
        else if(group_message[i].message_type === 0 ||group_message[i].message_type === 1 ){
          _group_message.logo = group_message[i].message_type === 0 ? group_message[i].company[0].logo : group_message[i].team[0].logo;
          if(req.user.provider==='user'){
            var join_flag = false;
            group_message[i].campaign.member.forEach(function(member){
              if(member.uid.toString() === req.user._id.toString()){
                join_flag = true;
              }
            });
            _group_message.join_flag = join_flag;
          }
        }
        else if( group_message[i].message_type===7 ||group_message[i].message_type===8){
          _group_message.logo = group_message[i].user.logo;
        }
        else{
          _group_message.logo = group_message[i].message_type === 0 ? group_message[i].company[0].logo : group_message[i].team[0].logo;
        }
        group_messages.push(_group_message);
      }
      return res.send({'group_messages':group_messages,'role':req.session.role});
     }
  });
};

//列出该user加入的所有小队的动态
exports.getUserMessage = function(req, res) {
  if( req.session.role !=='OWNER'){
    return res.send(403,forbidden);
  }
  var team_ids = [];
  req.user.team.forEach(function(team){
      team_ids.push(team.id.toString());
  });
  GroupMessage.find({
      '$or':[{'team.teamid' : {'$in':team_ids}},{'company.cid':req.user.cid}],
      'active':true
    }).sort({'create_time':-1}).populate('campaign')
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
        if(group_message[i].message_type > 3 && group_message[i].message_type <7){
          var camp_flag = team_ids.indexOf(group_message[i].campaign.camp[0].id.toString()) > -1 ? 0 : 1;
          _group_message.camp_flag =camp_flag;
          _group_message.logo = group_message[i].team[camp_flag ].logo;
          if(group_message[i].message_type === 4){
            //0：未投票，1：赞成，-1反对
            var vote_flag = 0;
            if(group_message[i].campaign.camp[camp_flag].vote.positive>0 ){
              group_message[i].campaign.camp[camp_flag].vote.positive_member.forEach(function(member){
                if(member.uid.toString() === req.user._id.toString()){
                  vote_flag = 1;
                }
              });
            }
            if(group_message[i].campaign.camp[camp_flag].vote.negatuve>0 ){
              group_message[i].campaign.camp[camp_flag].vote.negatuve_member.forEach(function(member){
                if(member.uid.toString() === req.user._id.toString()){
                  vote_flag = -1;
                }
              });
            }
            _group_message.vote_flag = vote_flag;

          }
          else if(group_message[i].message_type === 5) {
            //没有参加为false，参加为true
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
        else if(group_message[i].message_type === 0 || group_message[i].message_type === 1){
          _group_message.logo = group_message[i].message_type === 0 ? group_message[i].company[0].logo : group_message[i].team[0].logo;
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
        else if( group_message[i].message_type===7 ||group_message[i].message_type===8){
          _group_message.logo = group_message[i].user.logo;
        }
        else{
          _group_message.logo = group_message[i].message_type === 2 ? group_message[i].company[0].logo : group_message[i].team[0].logo;
        }
        group_messages.push(_group_message);
      }
      return res.send({'group_messages':group_messages,'role':req.session.role});
     }
  });

};