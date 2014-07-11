'use strict';
var mongoose = require('mongoose'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    User = mongoose.model('User'),
    Group = mongoose.model('Group'),
    Campaign = mongoose.model('Campaign'),
    GroupMessage = mongoose.model('GroupMessage'),
    model_helper = require('../helpers/model_helper');


var pagesize = 20;
var day_time = 24 * 60 * 60 * 1000;
exports.renderMessageList =function(req,res){
  res.render('partials/message_list',{
    'role':req.role
  });
};
//根据小队ID返回小组动态消息
exports.getMessage = function(req, res) {
  if(req.params.pageType==="team"&&(req.role ==='GUESTHR' || req.role ==='GUEST' || req.role ==='GUESTLEADER') || req.params.pageType==="user"&&req.role !=='OWNER' ){
    return res.send(403,'forbidden');
  }
  var pageType = req.params.pageType;
  var pageId = req.params.pageId;
  var option = {};
  if(pageType==="team"){
    option ={
      'team.teamid' : pageId,
      'active':true
    };
  }
  else {
    var team_ids = [];
    req.user.team.forEach(function(team){
      team_ids.push(team.id.toString());
    });
    option ={
      '$or':[{'team.teamid':{'$in':team_ids}},{'company.cid':req.user.cid,'team':{'$size': 0}}],
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
      var last_user_index,last_team_index,last_company_index;
      for(var i = 0; i < length; i ++) {
        var push_flag=true;
        var join_role = req.user.provider==='user' && (req.role ==='LEADER' || req.role ==='MEMBER' || req.role ==='OWNER' || req.role==='MEMBERLEADER');
        var _group_message ={
          '_id': group_message[i]._id,
          'message_type' : group_message[i].message_type,
          'company' : group_message[i].company,
          'team' : group_message[i].team,
          'campaign' : group_message[i].campaign,
          'create_time' : group_message[i].create_time,
          'user': [group_message[i].user],
          'join_role':join_role
        };
        switch (group_message[i].message_type){
          case 0://发起公司活动
          _group_message.logo = group_message[i].company[0].logo;
          if(join_role&& new Date()<group_message[i].campaign.deadline){
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
          case 1://发起小队活动
            //_group_message.team_id = 
            _group_message.logo = group_message[i].team[0].logo;
            _group_message.team_id=group_message[i].team[0].teamid;
            if(join_role&& new Date()<group_message[i].campaign.deadline){
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
          case 2://关闭公司活动
            _group_message.logo = group_message[i].company[0].logo;
          break;
          case 3://关闭小组活动
            _group_message.logo = group_message[i].team[0].logo;
            _group_message.team_id = group_message[i].team[0].teamid;
          break;
          case 4://发起挑战
            var camp_flag;
            if(pageType==="team"){
              camp_flag = group_message[i].campaign.camp[0].id== pageId? 0 : 1;
            }
            else{
              camp_flag = model_helper.arrayObjectIndexOf(req.user.team,group_message[i].campaign.camp[0].id,'_id')>-1?0:1;
            }
            _group_message.camp_flag =camp_flag;
            _group_message.logo = group_message[i].team[camp_flag].logo;
            _group_message.team_id = group_message[i].team[camp_flag].teamid;
            _group_message.member_num = group_message[i].campaign.camp[camp_flag].member.length;
            if(join_role&& req.role !=='OWNER'){
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
            if(pageType==="team" &&(req.role === 'HR' || req.role ==='LEADER')){
              if(camp_flag===1 && group_message[i].campaign.camp[1].start_confirm===false)
                _group_message.response_flag = true;
            }
          break;
          case 5://接受应战
            var camp_flag;
            if(pageType==="team"){
              camp_flag = group_message[i].campaign.camp[0].id== pageId? 0 : 1;
            }
            else{
              camp_flag = model_helper.arrayObjectIndexOf(req.user.team,group_message[i].campaign.camp[0].id,'_id')>-1?0:1;
            }
            _group_message.camp_flag =camp_flag;
            _group_message.logo = group_message[i].team[camp_flag ].logo;
            _group_message.team_id = group_message[i].team[camp_flag ].teamid;
            _group_message.member_num = group_message[i].campaign.camp[camp_flag].member.length;
            if(join_role&& new Date()<group_message[i].campaign.deadline){
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
            var camp_flag;
            if(pageType==="team"){
              camp_flag = group_message[i].campaign.camp[0].id== pageId? 0 : 1;
            }
            else{
              camp_flag = model_helper.arrayObjectIndexOf(req.user.team,group_message[i].campaign.camp[0].id,'_id')>-1?0:1;
            }
            _group_message.camp_flag =camp_flag;
            _group_message.logo = group_message[i].team[camp_flag ].logo;
          break;
          case 7:
            if(last_company_index!=undefined && group_message[i].company[0].cid.toString()===group_messages[last_company_index].company[0].cid.toString()&&group_messages[last_company_index].create_time-group_message[i].create_time<day_time){
              group_messages[last_company_index].user.push(group_message[i].user);
              group_messages[last_company_index].logo = group_message[last_company_index].company[0].logo;
              push_flag = false;
            }
            else{
              last_company_index = group_messages.length;
              _group_message.logo = group_message[i].user.logo;
            }
          break;
          case 8://小组新成员加入
            if(last_team_index!=undefined && group_messages[last_team_index].team.length===1 && group_message[i].team[0].teamid.toString()===group_messages[last_team_index].team[0].teamid.toString()&&group_messages[last_team_index].create_time - group_message[i].create_time<day_time){
              group_messages[last_team_index].user.push(group_message[i].user);
              group_messages[last_team_index].logo = group_messages[last_team_index].team[0].logo;
              push_flag = false;
              break;
            }
            else if(last_user_index!=undefined && group_messages[last_user_index].user.length===1 && group_message[i].user.user_id.toString()===group_messages[last_user_index].user[0].user_id.toString()&&group_messages[last_user_index].create_time - group_message[i].create_time<day_time){
              group_messages[last_user_index].team.push(group_message[i].team[0]);
              push_flag = false;
              break;
            }
            else{
              last_team_index = group_messages.length;
              last_user_index = group_messages.length;
              _group_message.logo = group_message[i].user.logo;
            }
          break;
          default:
          break;
        }
        if(push_flag){
          group_messages.push(_group_message);
        }
      }
      return res.send({'result':1,'group_messages':group_messages,'role':req.role,'user':{'_id':req.user._id,'nickname':req.user.nickname,'photo':req.user.photo, 'team':req.user.team}});
     }
  });
};