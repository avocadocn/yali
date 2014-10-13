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
//属于活动的活动类型
var campaign_list = [1,2,3,6,8];
exports.renderMessageList =function(req,res){
  var cid = req.user.provider=='company'? req.user._id :req.user.cid;
  res.render('partials/message_list',{
    'role':req.role,
    'cid':cid
  });
};
//根据小队ID返回小组动态消息
exports.getMessage = function(req, res, next) {
  if(req.params.pageType==="team"&&(req.role ==='GUESTHR' || req.role ==='GUEST' || req.role ==='GUESTLEADER') || req.params.pageType==="user"&&req.role !=='OWNER' ){
    res.status(403);
    next('forbidden');
    return;
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
          'department' : group_message[i].department,
          'user': [group_message[i].user],
          'join_role':join_role,
          'create_time_format':model_helper.formatTime(group_message[i].create_time)
        };
        switch (group_message[i].message_type){
          case 0://发起公司活动
          _group_message.logo = group_message[i].company[0].logo;
          _group_message.member_num = group_message[i].campaign.member.length;
          if(group_message[i].campaign.active && join_role&& new Date()<group_message[i].campaign.deadline){
            var join_flag = false;
            group_message[i].campaign.member.forEach(function(member){
              if(member.uid.toString() === req.user._id.toString()){
                join_flag = true;
              }
            });
            _group_message.join_flag = join_flag;
            _group_message.campaign_flag = campaign_list.indexOf(group_message[i].campaign.campaign_type)>-1;
          }
          break;
          case 1://发起小队活动
            //_group_message.team_id = 
            _group_message.logo = group_message[i].team[0].logo;
            _group_message.team_id=group_message[i].team[0].teamid;
            _group_message.member_num = group_message[i].campaign.member.length;
            if(group_message[i].campaign.active && join_role&& new Date()<group_message[i].campaign.deadline){
              var join_flag = false;
              group_message[i].campaign.member.forEach(function(member){
                if(member.uid.toString() === req.user._id.toString()){
                  join_flag = true;
                }
              });
              _group_message.join_flag = join_flag;
              _group_message.myteam = [];
              group_message[i].team.forEach(function(_team){
                if(model_helper.arrayObjectIndexOf(req.user.team,_team.teamid,'_id')>-1){
                  _group_message.myteam.push({
                    _id : _team.teamid,              //小队id
                    logo: _team.logo,                            //队徽路径
                    name: _team.name
                  });
                }
              })
            }
            _group_message.campaign_flag = campaign_list.indexOf(group_message[i].campaign.campaign_type)>-1;
          break;
          case 2://关闭公司活动
            _group_message.logo = group_message[i].company[0].logo;
          break;
          case 3://关闭小组活动
            _group_message.logo = group_message[i].team[0].logo;
            _group_message.team_id = group_message[i].team[0].teamid;
          break;
          case 4://发起挑战
            _group_message.myteam =[];
            for(var ii =0;ii<group_message[i].campaign.camp.length;ii++){
              if(model_helper.arrayObjectIndexOf(req.user.team,group_message[i].campaign.camp[ii].id,'_id')>-1){
                _group_message.myteam.push( {
                  index:ii,
                  _id : group_message[i].campaign.camp[ii].id,              //小队id
                  logo: group_message[i].campaign.camp[ii].logo,                            //队徽路径
                  name: group_message[i].campaign.camp[ii].tname
                });
              }
            }

            _group_message.logo = group_message[i].team[_group_message.myteam[0].index ].logo;
            _group_message.team_id = group_message[i].team[_group_message.myteam[0].index ].teamid;
            _group_message.member_num = group_message[i].campaign.camp[_group_message.myteam[0].index ].member.length;
            if(!_group_message.campaign.finish &&join_role&&group_message[i].campaign.camp[0].start_confirm){
              //0：未投票，1：赞成，-1反对
              var vote_flag = 0;
              if(group_message[i].campaign.camp[_group_message.myteam[0].index ].vote.positive>0 ){
                group_message[i].campaign.camp[_group_message.myteam[0].index ].vote.positive_member.forEach(function(member){
                  if(member.uid.toString() === req.user._id.toString()){
                    vote_flag = 1;
                  }
                });
              }
              if(group_message[i].campaign.camp[_group_message.myteam[0].index ].vote.negative>0 ){
                group_message[i].campaign.camp[_group_message.myteam[0].index ].vote.negative_member.forEach(function(member){
                  if(member.uid.toString() === req.user._id.toString()){
                    vote_flag = -1;
                  }
                });
              }
              _group_message.vote_flag = vote_flag;
            }
            //是同类型的 grouptype_flag = true 不是则为false 
            //_group_message.grouptype_flag = group_message[i].campaign.camp[0].gid === group_message[i].campaign.camp[1].gid ? true : false ;
            //console.log(i,group_message.grouptype_flag);
            //要到小队主页、是HR\LEADER才有应战按钮->response_flag = true;
            if(!_group_message.campaign.finish &&pageType==="team" &&(req.role === 'HR' || req.role ==='LEADER')&& group_message[i].campaign.camp[1].start_confirm===false&&group_message[i].campaign.camp[0].start_confirm){
              if(_group_message.myteam[0] ===1 ){
                _group_message.response_flag = true;
              }
              else{
                _group_message.cancel_flag = true;
              }
            }
          break;
          case 5://接受应战
            _group_message.myteam =[];
            for(var ii =0;ii<group_message[i].campaign.camp.length;ii++){
              if(model_helper.arrayObjectIndexOf(req.user.team,group_message[i].campaign.camp[ii].id,'_id')>-1){
                _group_message.myteam.push( {
                  index:ii,
                  _id : group_message[i].campaign.camp[ii].id,              //小队id
                  logo: group_message[i].campaign.camp[ii].logo,                            //队徽路径
                  name: group_message[i].campaign.camp[ii].tname
                });
              }
            }
            _group_message.logo = group_message[i].team[_group_message.myteam[0].index ].logo;
            _group_message.team_id = group_message[i].team[_group_message.myteam[0].index ].teamid;
            _group_message.member_num = group_message[i].campaign.camp[_group_message.myteam[0].index].member.length;
            if(join_role&& new Date()<group_message[i].campaign.deadline){
              //没有参加为false，参加为true
              var join_flag = false;
              for(var _camp_index=0;_camp_index<group_message[i].campaign.camp.length;_camp_index++){
                if(group_message[i].campaign.camp[_camp_index].member.length>0){
                  group_message[i].campaign.camp[_camp_index].member.forEach(function(member){
                    if(member.uid.toString() === req.user._id.toString()){
                      join_flag = true;
                      return;
                    }
                  });
                  if(join_flag){
                    break;
                  }
                }
              }

            //是同类型的 grouptype_flag = true 不是则为false 
            //_group_message.grouptype_flag = group_message[i].campaign.camp[0].gid === group_message[i].campaign.camp[1].gid ? true : false ;
              _group_message.join_flag = join_flag;
            }
            _group_message.campaign_flag = campaign_list.indexOf(group_message[i].campaign.campaign_type)>-1;
          break;
          case 6:
            _group_message.myteam =[];
            for(var ii =0;ii<group_message[i].campaign.camp.length;ii++){
              if(model_helper.arrayObjectIndexOf(req.user.team,group_message[i].campaign.camp[ii].id,'_id')>-1){
                _group_message.myteam.push( {
                  index:ii,
                  _id : group_message[i].campaign.camp[ii].id,              //小队id
                  logo: group_message[i].campaign.camp[ii].logo,                            //队徽路径
                  name: group_message[i].campaign.camp[ii].tname
                });
              }
            }
            _group_message.logo = group_message[i].team[_group_message.myteam[0].index  ].logo;
            _group_message.campaign_flag = campaign_list.indexOf(group_message[i].campaign.campaign_type)>-1;
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
          case 9://部门内部活动
            _group_message.logo = group_message[i].team[0].logo;
            _group_message.team_id=group_message[i].team[0].teamid;
            if(group_message[i].campaign.active && join_role&& new Date()<group_message[i].campaign.deadline){
              var join_flag = false;
              group_message[i].campaign.member.forEach(function(member){
                if(member.uid.toString() === req.user._id.toString()){
                  join_flag = true;
                }
              });
              _group_message.member_num = group_message[i].campaign.member.length;
              _group_message.join_flag = join_flag;
              _group_message.department_id = group_message[i].department;
            }
            _group_message.campaign_flag = campaign_list.indexOf(group_message[i].campaign.campaign_type)>-1;
            break;
          case 10:
            _group_message.logo = group_message[i].team[0].logo;
            _group_message.team_id=group_message[i].team[0].teamid;
            _group_message.member_num = group_message[i].campaign.member.length;

            if(join_role&& new Date()<group_message[i].campaign.deadline){
              var join_flag = false;
              group_message[i].campaign.member.forEach(function(member){
                if(member.uid.toString() === req.user._id.toString()){
                  join_flag = true;
                }
              });
              _group_message.join_flag = join_flag;
            }
            _group_message.campaign_flag = campaign_list.indexOf(group_message[i].campaign.campaign_type)>-1;
            break;
          default:
          break;
        }
        if(push_flag){
          group_messages.push(_group_message);
        }
      }
      return res.send({'result':1,'group_messages':group_messages,'message_length':group_message.length,'role':req.role,'user':{'_id':req.user._id,'nickname':req.user.nickname,'photo':req.user.photo, 'team':req.user.team}});
     }
  });
};