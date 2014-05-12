'use strict';
var mongoose = require('mongoose'),
    encrypt = require('../middlewares/encrypt'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    User = mongoose.model('User'),
    UUID = require('../middlewares/uuid'),
    GroupMessage = mongoose.model('GroupMessage'),
    Group = mongoose.model('Group'),
    Competition = mongoose.model('Competition'),
    Arena = mongoose.model('Arena'),
    Campaign = mongoose.model('Campaign');





exports.getGroupId = function(req, res) {

};


//约战
exports.provoke = function (req, res) {
  var uid = req.session.uid;
  var username = req.session.username;

  var gid = req.session.gid;         //约战小组id

  var content = req.body.content;
  var competition_format = req.body.competition_format;
  var location = req.body.location;
  var competition_date = req.body.competition_date;
  var deadline = req.body.deadline;
  var remark = req.body.remark;
  var competition = new Competition();
  var number = req.body.number;


  competition.id = UUID.id();
  competition.gid = gid;
  competition.group_type = req.session.companyGroup.group_type;

  var camp_a = {
    'cid' : req.session.cid,
    'start_confirm' : true,
    'tname' : req.session.companyGroup.name,
    'logo' : req.session.companyGroup.logo
  };


  competition.camp.push(camp_a);

  var photo_album = new PhotoAlbum();
  photo_album.save();

  competition.photo = { pid: photo_album._id, name: photo_album.name };
  fs.mkdir(meanConfig.root + '/public/img/photo_album/' + photo_album._id, function(err) {
    if (err) console.log(err);
  });

  //这个查询就为了找对方小队的一个logo
  //速度换空间
  CompanyGroup.findOne({'cid':req.body.cid_opposite,'gid':gid},function(err, company_group){
    if(err) {
      return res.send(err);
    } else {
      if(company_group) {

        var camp_b = {
          'cid' : req.body.cid_opposite,
          'tname' : req.body.team_opposite,
          'logo' : company_group.logo
        };
        competition.camp.push(camp_b);

        competition.content = req.body.content;
        competition.brief.remark = req.body.remark;
        competition.brief.location.name = location;
        competition.brief.competition_date = competition_date;
        competition.brief.deadline = deadline;
        competition.brief.competition_format = competition_format;
        competition.brief.number = number;


        var groupMessage = new GroupMessage();
        groupMessage.id = UUID.id();
        groupMessage.group.gid.push(gid);
        groupMessage.group.group_type.push(competition.group_type);
        groupMessage.provoke.active = true;
        groupMessage.provoke.competition_format = competition_format;

        var a = {
          'cid':req.session.cid,
          'tname':req.session.companyGroup.name
        };
        var b = {
          'cid':req.body.cid_opposite,
          'tname':req.body.team_opposite
        };

        groupMessage.provoke.camp.push(a);
        groupMessage.provoke.camp.push(b);

        groupMessage.poster.cid = req.session.cid;
        groupMessage.poster.uid = uid;
        groupMessage.poster.role = 'LEADER';
        groupMessage.poster.username = username;
        groupMessage.cid.push(req.session.cid);
        if(req.session.cid !== req.body.cid_opposite) {
          groupMessage.cid.push(req.body.cid_opposite);
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
            competition.provoke_message_id = groupMessage.id;
            competition.save();
          }
          return res.send({'result':1,'msg':'挑战成功！'});
          //这里要注意一下,生成动态消息后还要向被约队长发一封私信
        });
      } else {
        return res.send('null');
      }
    }
  });

};


//应约
exports.responseProvoke = function (req, res) {
  var username = req.session.username;
  var provoke_message_id = req.body.provoke_message_id;
  Competition.findOne({
      'provoke_message_id' : provoke_message_id
    },
    function (err, competition) {
      competition.camp[1].start_confirm = true;
      competition.camp[0].username = username;
      //还要存入应约方的公司名、队长用户名、真实姓名等
      competition.save(function (err) {
        if (err) {
          res.send(err);
          return;
        }
        //双方都确认后就可以将约战变为活动啦
        var campaign = new Campaign();
        campaign.gid.push(competition.gid);
        campaign.group_type.push(competition.group_type);

        if(competition.camp[0].cid !== competition.camp[1].cid){
          campaign.cid.push(competition.camp[1].cid);
        }
        campaign.cid.push(competition.camp[0].cid);   //两家公司同时显示这一条活动
        campaign.id = UUID.id();

        campaign.poster.cname = competition.camp[0].cname;
        campaign.poster.cid = competition.camp[0].cid;
        campaign.poster.uid = competition.camp[0].uid;
        campaign.poster.role = 'LEADER';
        campaign.poster.username = competition.camp[0].username;
        campaign.content = competition.camp[0].tname + ' VS ' + competition.camp[1].tname;
        campaign.location = competition.brief.location.name;
        campaign.start_time = competition.brief.competition_date;
        campaign.end_time = competition.brief.deadline;

        campaign.active = true;
        campaign.provoke.active = true;
        campaign.provoke.competition_id = competition.id;
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
          GroupMessage.findOne({'id' : provoke_message_id}, function (err, group_message) {
            if (err) {
              console.log(err);
            } else {
              group_message.provoke.start_confirm = true;
              group_message.save(function(err){
                if(!err){
                  if(competition.arena_flag){
                    Arena.findOne({
                      id: competition.arena_id
                      },
                    function(err,arena){
                      if(!err &&arena){
                        arena.champion.provoke_status = true;
                        if(!arena.champion.competition_id){
                          arena.champion.competition_id =[];
                        }
                        arena.champion.competition_id.push(competition.id);
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
  var msg_show,score_a,score_b,rst_content,date;

  var is_leader = false;
  for(var i = 0; i < req.user.group.length; i ++) {
    if(req.user.group[i].gid === req.competition.gid){
      is_leader = req.user.group[i].leader;
      break;
    }
  }
  if(req.competition.camp[0].cid === req.session.cid) {
    //发赛方收到应赛方的成绩确认消息
    if(req.competition.camp[1].result.confirm && !req.competition.camp[0].result.confirm) {
      msg_show = is_leader;
      score_a = req.competition.camp[0].score;
      score_b = req.competition.camp[1].score;
      rst_content = req.competition.camp[1].result.content;
      date = req.competition.camp[1].result.start_date;
    } else {
      msg_show = false;
      score_a = 0;
      score_b = 0;
      rst_content = '应赛方发来的消息';
      date = 0;
    }
  } else {
    //应赛方收到发赛方的成绩确认消息
    if(req.competition.camp[0].result.confirm && !req.competition.camp[1].result.confirm) {
      msg_show = is_leader;
      score_a = req.competition.camp[1].score;
      score_b = req.competition.camp[0].score;
      rst_content = req.competition.camp[0].result.content;
      date = req.competition.camp[0].result.start_date;
    } else {
      msg_show = false;
      score_a = 0;
      score_b = 0;
      rst_content = '发赛方发来的消息';
      date = 0;
    }
  }

  var confirm = req.competition.camp[1].result.confirm && req.competition.camp[0].result.confirm;
  console.log(rst_content);
  res.render('competition/football', {
    'title': '发起足球比赛',
    'competition' : req.competition,
    'team': req.competition_team,
    'rst_confirm_show' : is_leader && !confirm,  //双方都确认后就不用再显示发出确认按钮了,只有组长才可以确认
    'msg_show' : msg_show,
    'score_a' : score_a,
    'score_b' : score_b,
    'rst_content' : rst_content,
    'date' : date
  });
};


exports.updateFormation = function(req, res){
  Competition.findOne({
    'id':req.params.competitionId
  }).exec(function(err, competition){
    if(req.competition_team === req.body.competition_team){
      var _formation = [];
      var _tempFormation = req.body.formation;
      for (var member in _tempFormation){
        _formation.push({'uid':member,
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


//某一方发送或者修改比赛成绩确认消息
exports.resultConfirm = function (req, res) {
  var competition_id = req.params.competitionId;

  var rst_accept = req.body.rst_accept;

  var score_a = req.body.score_a;
  var score_b = req.body.score_b;
  var rst_content = req.body.rst_content;

  Competition.findOne({'id' : competition_id}, function (err, competition) {
    if(err) {
      console.log(err);
      res.send(err);
    } else {
      if(req.session.cid === competition.camp[0].cid) {
        //发赛方发出成绩确认请求

        //发赛方接受应赛方的比分确认
        if(rst_accept) {
          competition.camp[0].result.confirm = true;
        //不接受或者第一次发出比赛确认
        } else {
          competition.camp[0].score = score_a;
          competition.camp[1].score = score_b;
          competition.camp[1].result.confirm = false,
          competition.camp[0].result.confirm = true,
          competition.camp[0].result.content = rst_content,
          competition.camp[0].result.start_date = Date.now();
        }
      } else {
        //应赛方发出成绩确认请求

        //应赛方接受发赛方的比分确认
        if(rst_accept) {
          competition.camp[1].result.confirm = true;

        //不接受或者第一次发出比赛确认
        } else {
          competition.camp[0].score = score_b;
          competition.camp[1].score = score_a;
          competition.camp[0].result.confirm = false,
          competition.camp[1].result.confirm = true,
          competition.camp[1].result.content = rst_content,
          competition.camp[1].result.start_date = Date.now();
        }
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


exports.competition = function(req, res, next, id){
  var first = false;

  Competition.findOne({
      'id':id
    }).exec(function(err, competition){
      if (err) return next(err);
      req.competition = competition;

      if(!first) {
        first = true;
        req.session.leader = false;
        var leader = req.session.companyGroup.leader;
        for(var i = 0; i < leader.length; i ++) {
          if(leader[i].uid = req.session.uid) {
            req.session.leader = true;
            break;
          }
        }
      }

      if(req.session.cid ===competition.camp[0].cid){
        req.competition_team = 'A';
      }
      else if(req.session.cid ===competition.camp[1].cid){
        req.competition_team = 'B';
      }
      else
      {
        return new next(Error('Failed to load competition ' + id));
      }
      next();
  });
};


exports.group = function(req, res, next, id) {
  console.log(req.session.gid);
  CompanyGroup
    .findOne({
        cid: req.session.cid,
        gid: id
    })
    .exec(function(err, companyGroup) {
        if (err) return next(err);
        if (!companyGroup) return next(new Error(req.session.cid+' Failed to load companyGroup ' + id));
        req.companyGroup = companyGroup;
        //TODO session不能存太多东西
        req.session.companyGroup = companyGroup;
        next();
    });
};
