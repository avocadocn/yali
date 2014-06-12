'use strict';
var mongoose = require('mongoose'),
    encrypt = require('../middlewares/encrypt'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    User = mongoose.model('User'),
    GroupMessage = mongoose.model('GroupMessage'),
    Group = mongoose.model('Group'),
    Competition = mongoose.model('Competition'),
    Arena = mongoose.model('Arena'),
    Campaign = mongoose.model('Campaign');


exports.getGroupId = function(req, res) {

};


//约战
exports.provoke = function (req, res) {
  if(req.session.role !=='HR' && req.session.role !=='LEADER'){
    return res.send(403,forbidden);
  }

  var my_team_id = req.params.teamId;
  var team_opposite = req.body.team_opposite;

  var content = req.body.content;
  var competition_format = req.body.competition_format;
  var location = req.body.location;
  var competition_date = req.body.competition_date;
  var deadline = req.body.deadline;
  var remark = req.body.remark;
  var number = req.body.number;
  var competition = new Competition();

  competition.gid = req.companyGroup.gid;
  competition.group_type = req.companyGroup.group_type;

  var camp_a = {
    'id' : my_team_id,
    'cid' : req.companyGroup.cid,
    'start_confirm' : true,
    'tname' : req.companyGroup.name,
    'logo' : req.companyGroup.logo
  };


  competition.camp.push(camp_a);


  var camp_b = {
    'id' : req.body.team_opposite._id,
    'cid' : req.body.team_opposite.cid,
    'tname' : req.body.team_opposite.name,
    'logo' : req.body.team_opposite.logo
  };
  competition.camp.push(camp_b);

  competition.content = req.body.content;
  competition.brief.remark = req.body.remark;
  competition.brief.location.name = location;
  competition.brief.competition_date = competition_date;
  competition.brief.deadline = deadline;
  competition.brief.competition_format = competition_format;
  competition.brief.number = number;


  competition.poster.cname = req.user.cname;
  competition.poster.cid = req.user.cid;
  competition.poster.role = req.session.role;
  competition.poster.uid = req.user._id;
  competition.poster.nickname = req.user.nickname;
  var groupMessage = new GroupMessage();

  groupMessage.team.push(my_team_id);         //发起挑战方小队id
  groupMessage.team.push(team_opposite._id);  //应约方小队id
  groupMessage.group.gid.push(req.companyGroup.gid);
  groupMessage.group.group_type.push(competition.group_type);
  groupMessage.provoke.active = true;
  groupMessage.provoke.competition_format = competition_format;

  var a = {
    'tid':my_team_id.toString(),
    'cid':req.companyGroup.cid,
    'tname':req.companyGroup.name
  };
  var b = {
    'tid':team_opposite._id.toString(),
    'cid':req.body.team_opposite.cid,
    'tname':req.body.team_opposite.name
  };

  groupMessage.provoke.camp.push(a);
  groupMessage.provoke.camp.push(b);

  groupMessage.poster.cid = req.companyGroup.cid;
  if(req.session.role ==='LEADER'){
    groupMessage.poster.uid = req.user._id;
    groupMessage.poster.role = 'LEADER';
    groupMessage.poster.nickname = req.user.nickname;
  }
  groupMessage.cid.push(req.companyGroup.cid);
  if(req.companyGroup.cid !== req.body.team_opposite.cid) {
    groupMessage.cid.push(req.body.team_opposite.cid);
  }
  groupMessage.content = content;
  groupMessage.location = location;
  groupMessage.start_time = competition_date;
  groupMessage.end_time = deadline;

  groupMessage.save(function (err) {
    if (err) {
      console.log('保存约战动态时出错' + err);
      return res.send(err);
    } else {
      competition.provoke_message_id = groupMessage._id;
      competition.save(function(err){
        if(!err){
           return res.send({'result':1,'msg':'挑战成功！'});
        }
      });
    }
    //这里要注意一下,生成动态消息后还要向被约队长发一封私信
  });

};


//应约
exports.responseProvoke = function (req, res) {
  if(req.session.role !=='HR' && req.session.role !=='LEADER'){
    return res.send(403,forbidden);
  }
  var provoke_message_id = req.body.provoke_message_id;
  Competition.findOne({
      'provoke_message_id' : provoke_message_id
    },
    function (err, competition) {
      competition.camp[1].start_confirm = true;
      //还要存入应约方的公司名、队长用户名、真实姓名等
      competition.save(function (err) {
        if (err) {
          res.send(err);
          return res.send({'result':0,'msg':'应战失败！'});
        }
        //双方都确认后就可以将约战变为活动啦
        var campaign = new Campaign();
        campaign.gid.push(competition.gid);
        campaign.group_type.push(competition.group_type);

        if(competition.camp[0].cid !== competition.camp[1].cid){
          campaign.cid.push(competition.camp[1].cid);
        }
        campaign.cid.push(competition.camp[0].cid);   //两家公司同时显示这一条活动

        campaign.team.push(competition.camp[0].id); //约战方小队id
        campaign.team.push(competition.camp[1].id); //应约方小队id

        campaign.poster.cname = competition.poster.cname;
        campaign.poster.cid = competition.poster.cid;
        campaign.poster.uid = competition.poster.uid;
        campaign.poster.role = 'LEADER';
        campaign.poster.nickname = competition.poster.nickname;

        campaign.content = competition.camp[0].tname + ' VS ' + competition.camp[1].tname;
        campaign.location = competition.brief.location.name;
        campaign.start_time = competition.brief.competition_date;
        campaign.end_time = competition.brief.deadline;

        campaign.active = true;
        campaign.provoke.active = true;
        campaign.provoke.competition_id = competition._id;
        campaign.provoke.competition_format = competition.brief.competition_format;
        campaign.provoke.active = true;


        campaign.save(function(err) {
          if (err) {
            console.log(err);
            //检查信息是否重复
            switch (err.code) {
              case 11000:
                break;
              case 11001:
                res.status(400).send('该活动已经存在!');
                break;
              default:
                break;
            }
            return;
          }
          GroupMessage.findOne({'_id' : provoke_message_id}, function (err, group_message) {
            if (err) {
              console.log(err);
            } else {
              group_message.provoke.start_confirm = true;
              group_message.save(function(err){
                if(!err){
                  if(competition.arena_flag){
                    Arena.findOne({
                      _id: competition.arena_id
                    },
                    function(err,arena){
                      if(!err &&arena){
                        arena.champion.provoke_status = true;
                        if(!arena.champion.competition_id){
                          arena.champion.competition_id =[];
                        }
                        arena.champion.competition_id.push(competition._id);
                        arena.save(function(err){
                          if(err){
                            console.log(err);
                          }
                        });
                      }
                    });
                  }
                  res.send({'result':1,'msg':'应战成功'});
                }
              });
            }
          });
        });
    });
  });
};




//比赛
exports.getCompetition = function(req, res){
  if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST'){
    return res.send(403,forbidden);
  }
  var options ={
    'title': '比赛页面',
    'competition' : req.competition,
    'team': req.competition_team,
    'role': req.session.role,
    'msg_show': false,
    'moment':moment
  };
  var nowTeamIndex,otherTeamIndex;
  if(req.session.role==='HR'){
    nowTeamIndex = req.competition.camp[0].cid === req.user.id ? 0:1;
    otherTeamIndex = req.competition.camp[0].cid === req.user.id ? 1:0;
  }
  else{
    nowTeamIndex = req.competition.camp[0].cid === req.user.cid ? 0:1;
    otherTeamIndex = req.competition.camp[0].cid === req.user.cid ? 1:0;
  }
  if((req.session.role==='HR' || req.session.role ==='LEADER') && req.competition.camp[otherTeamIndex].result.confirm && !req.competition.camp[nowTeamIndex].result.confirm) {
    options.msg_show = true;
    options.score_a = req.competition.camp[nowTeamIndex].score;
    options.score_b = req.competition.camp[otherTeamIndex].score;
    options.rst_content = req.competition.camp[otherTeamIndex].result.content;
    options.date = req.competition.camp[otherTeamIndex].result.start_date;
  }
  res.render('competition/football', options);
};



exports.updateFormation = function(req, res){
  if(req.session.role !=='HR' && req.session.role !=='LEADER'){
    return res.send(403,forbidden);
  }
  Competition.findOne({
    '_id':req.params.competitionId
  }).exec(function(err, competition){
    if(req.competition_team === req.body.competition_team){
      var _formation = [];
      var _tempFormation = req.body.formation;
      for (var member in _tempFormation){
        _formation.push({'uid':member_length,
                          'x':_tempFormation[member].x,
                          'y':_tempFormation[member].y

        });
      }
      if(req.competition_team ==='A'){
        competition.camp[0].formation = _formation;
      }
      else{
        competition.camp[1].formation = _formation;
      }
      competition.save(function(err){
        if(err){
          console.log(err);
        }
        return res.send({'result':1,'msg':'更新成功！'});
      });
    }
    else{
      return res.send({'result':0,'msg':'您没有权限修改阵形图'});
    }
  });
};

exports.competition = function(req, res, next, id){
  var cid = req.session.nowcid ? req.session.nowcid :(req.user.provider ==='company' ? req.user.id : req.user.cid);
  Competition.findOne({
      '_id':id
    }).exec(function(err, competition){
      if (err) return next(err);
      req.competition = competition;
      if(cid ===competition.camp[0].cid){
        req.competition_team = 'A';
      }
      else if(cid ===competition.camp[1].cid){
        req.competition_team = 'B';
      }
      else
      {
        return new next(Error('Failed to load competition ' + id));
      }
      next();
  });
};

//某一方发送或者修改比赛成绩确认消息
exports.resultConfirm = function (req, res) {
  if(req.session.role !=='HR' && req.session.role !=='LEADER'){
    return res.send(403,forbidden);
  }
  var competition_id = req.params.competitionId;

  var rst_accept = req.body.rst_accept;

  var score_a = req.body.score_a;
  var score_b = req.body.score_b;
  var rst_content = req.body.rst_content;

  Competition.findOne({'_id' : competition_id}, function (err, competition) {
    if(err) {
      console.log(err);
      res.send(err);
    } else {
      //本组的index
      var _campFlag,_otherCampFlag;
      if(req.session.role ==='HR'){
        _campFlag = req.user.id === competition.camp[0].cid ? 0 : 1;
        _otherCampFlag = req.user.id === competition.camp[0].cid ? 1 : 0;
      }
      else{
        _campFlag = req.user.cid === competition.camp[0].cid ? 0 : 1;
        _otherCampFlag = req.user.cid === competition.camp[0].cid ? 1 : 0;
      }
      competition.camp[_campFlag].result.confirm = true;
      if(!rst_accept) {
        competition.camp[_campFlag].score = score_a;
        competition.camp[_otherCampFlag].score = score_b;
        competition.camp[_otherCampFlag].result.confirm = false;
        competition.camp[_campFlag].result.content = rst_content;
        competition.camp[_campFlag].result.start_date = Date.now();
      }
      competition.save(function (err){
        if(err){
          return res.send(err);
        } else {
          return res.send('ok');
        }
      });
    }
  });
};



exports.group = function(req, res, next, id) {
   CompanyGroup
    .findOne({
        cid: req.session.nowcid,
        _id: id
    })
    .exec(function(err, companyGroup) {
        if (err) return next(err);
        if (!companyGroup) return next(new Error(req.session.nowcid+' Failed to load companyGroup ' + id));
        req.companyGroup = companyGroup;
        next();
    });
};
