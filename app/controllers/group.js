'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    encrypt = require('../middlewares/encrypt'),
    crypto = require('crypto'),
    meanConfig = require('../../config/config'),
    GroupMessage = mongoose.model('GroupMessage'),
    Campaign = mongoose.model('Campaign'),
    User = mongoose.model('User'),
    Company = mongoose.model('Company'),
    Group = mongoose.model('Group'),
    UUID = require('../middlewares/uuid'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    Competition = mongoose.model('Competition'),
    Arena = mongoose.model('Arena'),
    PhotoAlbum = mongoose.model('PhotoAlbum'),
    validator = require('validator'),
    async = require('async'),
    fs = require('fs'),
    gm = require('gm'),
    path = require('path'),
    moment = require('moment');


//返回组件模型里的所有组件(除了虚拟组),待HR选择
exports.getGroups = function(req,res) {
  Group.find(null,function(err,group){
      if (err) {
          console.log(err);
          res.status(400).send([]);
          return;
      }
      var _length = group.length;
      var groups = [];


      for(var i = 0; i < _length; i++ ){
        if(group[i]._id!=='0'){
          groups.push({'_id':group[i]._id,'type':group[i].group_type,'select':'0', 'entity_type':group[i].entity_type});
        }
      }
      res.send(groups);
  });
};



exports.renderInfo = function (req, res) {
  res.render('group/group_info');
};


//小队信息维护 TODO
exports.info =function(req,res) {

  console.log(req.companyGroup);
  var entity_type = req.companyGroup.entity_type;
  var Entity = mongoose.model(entity_type);//将对应的增强组件模型引进来
  if(req.session.tid !== null ) {
    Entity.findOne({
        'cid': req.companyGroup.cid.toString(),
        'gid': req.companyGroup.gid,
        'tid': req.session.tid
      },function(err, entity) {
          if (err) {
              console.log(err);
              return res.send(err);
          } else {
              console.log(typeof req.companyGroup.cid,typeof req.companyGroup.gid,typeof req.session.tid,entity_type);
              return res.send({
                  'companyGroup': req.companyGroup,  //父小组信息
                  'entity': entity,                          //实体小组信息
                  'companyname':req.companyGroup.cname
              });
          }
      });
  } else
    res.render('group/home',{
      'msg' : '请选择一个小队'
    });
};


//TODO
exports.saveInfo =function(req,res,next,id) {
    if(req.session.cid !== null) {

        CompanyGroup.findOne({cid : req.companyGroup.cid, gid : req.companyGroup.gid, _id:req.session.tid}, function(err, companyGroup) {
            if (err) {
                console.log('数据错误');
                res.send({'result':0,'msg':'数据查询错误'});
                return;
            }
            if(companyGroup) {
                companyGroup.name = req.body.name;
                companyGroup.brief = req.body.brief;
                companyGroup.save(function (s_err){
                    if(s_err){
                        console.log(s_err);
                        res.send({'result':0,'msg':'数据保存错误'});
                        return;
                    }
                    var entity_type = req.companyGroup.entity_type;
                    var Entity = mongoose.model(entity_type);//将对应的增强组件模型引进来
                    Entity.findOne({
                        'cid': req.session.cid,
                        'gid': req.session.gid,
                        'tid': req.session.tid
                      },function(err, entity) {
                          if (err) {
                              console.log(err);
                              return res.send(err);
                          } else if(entity){
                            console.log(res.body);
                            entity.home_court = req.body.homecourt;
                            entity.save(function(err){
                              if(err){
                                console.log(err);
                                return;
                              }
                              res.send({'result':1,'msg':'更新成功'});
                            });
                          }
                      });
                });
            } else {
                res.send({'result':0,'msg':'不存在组件！'});
            }
        });
    }
    else
        res.send({'result':0,'msg':'未登录'});
};
//小队信息维护



//返回小队页面
exports.home = function(req, res) {

  if (req.params.teamId !== null) {
    req.session.tid = req.params.teamId;
  }
  if (req.params.gid !== null) {
    req.session.gid = req.params.gid;
  }
  var selected_teams = [];
  var unselected_teams = [];
  var user_teams = [];
  var photo_album_ids = [];
  var current_team; //当前小队的信息,如果用户没有点击任何小队就进入小队页面那么默认返回他所属的第一个小队,否则就返回他点击的小队

  Array.prototype.S=String.fromCharCode(2);
  Array.prototype.in_array=function(e)
  {
    var r=new RegExp(this.S+e+this.S);
    return (r.test(this.S+this.join(this.S)+this.S));
  }

  for(var i = 0; i < req.user.group.length; i ++) {
    for(var j = 0; j < req.user.group[i].team.length; j ++) {
      user_teams.push(req.user.group[i].team[j].id);
    }
  }

  CompanyGroup.find({'cid':req.user.cid}, {'_id':1,'gid':1,'group_type':1,'logo':1,'photo':1,'name':1,'member':1,'score':1,'brief':1,'cname':1},function(err, company_groups) {
    if(err || !company_groups) {
      return res.send([]);
    } else {
      var find = false;
      for(var i = 0; i < company_groups.length; i ++) {

        //成员点击了某个小队后进来获取该小队数据
        if(company_groups[i]._id === req.params.teamId) {
          current_team = company_groups[i];
          find = true;
        }

        if(company_groups[i].gid !== '0'){
          //下面查找的是该成员加入和未加入的所有小队
          if(user_teams.in_array(company_groups[i]._id)) {
            selected_teams.push(company_groups[i]);

            //如果该成员没有点击任何小队进入了该页面就返回他所属的第一个小队
            if(!find) {
              current_team = company_groups[i];
              find = true;
            }

          } else {
            unselected_teams.push(company_groups[i]);
          }
        }
      }
      current_team.photo.forEach(function(photo_album) {
        photo_album_ids.push(photo_album.pid);
      });
      PhotoAlbum.where('_id').in(photo_album_ids)
        .exec(function(err, photo_albums) {
           if (err) { console.log(err); }
            else if(photo_albums) {
              var visible_photo_albums = [];
              photo_albums.forEach(function(photo_album) {
                if (photo_album.hidden === false) {
                  visible_photo_albums.push(photo_album);
                }
              });
              console.log('已选',selected_teams);
              console.log('未选',unselected_teams);
              console.log('当前',current_team);
              res.render('group/home',{
                'selected_teams' : selected_teams,
                'unselected_teams' : unselected_teams,
                'current_team' : current_team,         //当前小队的信息,如果用户没有点击任何小队就进入小队页面那么默认返回他所属的第一个小队,否则就返回他点击的小队
                'photo_albums': visible_photo_albums,
                'teamId' : req.params.teamId
              });
        }
      }); 
    }
  });
};

//返回公司小队的所有数据,待前台调用
exports.getCompanyGroups = function(req, res) {
  var company_id = req.session.cid;
  var param_id = req.params.id;
  if(param_id) {
    company_id = param_id;
  }

  CompanyGroup.find({cid : company_id, gid : {'$ne' : '0'}},{'_id':1,'logo':1,'gid':1,'group_type':1,'entity_type':1,'name':1}, function(err, teams) {
    if(err || !teams) {
      return res.send([]);
    } else {
      console.log(teams);
      return res.send({
        'teams':teams,
        'cid':company_id
      });
    }
  });
};



//根据小队ID返回小组动态消息
exports.getGroupMessage = function(req, res) {

  var cid = req.session.cid;
  var gid = req.session.gid;
  var tid = req.params.teamId;    //小队的id

  GroupMessage.find({'cid' : {'$all':[cid]}, 'group.gid' : {'$all':[gid]}}).populate({
        path : 'team',
        match : { _id: tid}
      }
    ).exec(function(err, group_message) {
    if (err || !group_message) {
      console.log(err);
      return res.status(404).send([]);
    } else {
      var group_messages = [];
      var length = group_message.length;

      var permission = false;
      for(var j = 0; j < req.user.group.length; j ++) {
        if(req.user.group[j]._id === gid) {
          for(var k = 0; k < req.user.group[j].team.length; k ++) {
            if(req.user.group[j].team[k].id == tid){
              permission = req.user.group[j].leader;
              break;
            }
          }
        }
      }

      for(var i = 0; i < length; i ++) {

        var positive = 0;
        var negative = 0;
        for(var k = 0; k < group_message[i].provoke.camp.length; k ++) {
          if(group_message[i].provoke.camp[k].tname === req.companyGroup.name){
            positive = group_message[i].provoke.camp[k].vote.positive;
            negative = group_message[i].provoke.camp[k].vote.negative;
            break;
          }
        }
        group_messages.push({
          'positive' : positive,
          'negative' : negative,
          'my_tname' : req.companyGroup.name,
          '_id': group_message[i]._id,
          'cid': group_message[i].cid,
          'group': group_message[i].group,
          'active': group_message[i].active,
          'date': group_message[i].date,
          'poster': group_message[i].poster,
          'content': group_message[i].content,
          'location' : group_message[i].location,
          'start_time' : group_message[i].start_time ? group_message[i].start_time : '',
          'end_time' : group_message[i].end_time ? group_message[i] : '',
          'provoke': group_message[i].provoke,                   //应约按钮显示要有四个条件:1.该约战没有关闭 2.当前员工所属组件id和被约组件id一致 3.约战没有确认 4.当前员工是该小队的队长
          'provoke_accept': group_message[i].provoke.active && permission && (!group_message[i].provoke.start_confirm) && (group_message[i].cid[1] === req.session.cid)
        });
      }
      return res.send(group_messages);
    }
  });
};


//返回某一小组的活动,待前台调用
exports.getGroupCampaign = function(req, res) {

  var cid = req.session.cid;
  var gid = req.session.gid;
  var uid = req.session.uid;
  var tid = req.params.teamId;

  //有包含tid的活动都列出来
  Campaign.find({'cid' : {'$all':[cid]}, 'gid' : {'$all':[gid]}}).populate({
        path : 'team',
        match : { _id: tid}
      }
    ).exec(function(err, campaign) {
    if (err) {
      console.log(err);
      return res.status(404).send([]);
    } else {
      var campaigns = [];
      var join = true;
      var length = campaign.length;
      var permission = false;
      var stop = false;

      //只有这个小队的组长才可以操作活动,这有这个小队的员工可以参加这个活动
      //判断这个组是不是员工所属的组,否则不能参加
      for(var j = 0; j < req.user.group.length; j ++) {
        if(req.user.group[j]._id === gid) {
          for(var k = 0; k < req.user.group[j].team.length; k ++) {
            if(req.user.group[j].team[k].id == tid){
              stop = true;
              join = false;
              permission = req.user.group[j].leader;
              break;
            }
          }
        }
      }

      for(var i = 0;i < length; i ++) {
        join = false;

        //参加过的也不能参加
        for(var j = 0;j < campaign[i].member.length; j ++) {
          if(uid === campaign[i].member[j].uid) {
            join = true;
            break;
          }
        }

        campaigns.push({
          'selected': true,
          'active':campaign[i].active && stop,              //如果该活动没有关闭并且该员工有这个活动的组,就显示参加按钮
          'active_value':campaign[i].active ? '关闭' : '打开',
          '_id': campaign[i]._id,
          'gid': campaign[i].gid,
          'group_type': campaign[i].group_type,
          'cid': campaign[i].cid,
          'cname': campaign[i].cname,
          'poster': campaign[i].poster,
          'content': campaign[i].content,
          'location': campaign[i].location,
          'member': campaign[i].member,
          'start_time': campaign[i].start_time ? campaign[i].start_time : '',
          'end_time': campaign[i].end_time ? campaign[i].end_time : '',
          'join':join,
          'provoke':campaign[i].provoke
        });
      }
      return res.send({
        'data':campaigns,
        'permission':permission
      });
    }
  });
};

//组长关闭活动
exports.campaignCancel = function (req, res) {
  var campaign_id = req.body.campaign_id;
  Campaign.findOne({id:campaign_id},function(err, campaign) {
        if(campaign) {
          if (err) {
              console.log('错误');
          }

          var active = campaign.active;
          campaign.active = !active;
          campaign.save(function (err){
            if(err) {
              return res.send(err);
            } else {
              return res.send('ok');
            }
          });
        } else {
            return res.send('not exist');
        }
    });
};


//约战
exports.provoke = function (req, res) {
  var uid = req.session.uid;
  var username = req.session.username;

  var gid = req.session.gid;         //约战小组id
  var team_opposite = req.body.team_opposite;

  var content = req.body.content;
  var competition_format = req.body.competition_format;
  var location = req.body.location;
  var competition_date = req.body.competition_date;
  var deadline = req.body.deadline;
  var remark = req.body.remark;
  var number = req.body.number;
  var competition = new Competition();

  competition.gid = gid;
  competition.group_type = req.companyGroup.group_type;

  var camp_a = {
    'id' : req.params.teamId,
    'cid' : req.session.cid,
    'start_confirm' : true,
    'tname' : req.companyGroup.name,
    'logo' : req.companyGroup.logo
  };


  competition.camp.push(camp_a);

  var photo_album = new PhotoAlbum();
  photo_album.save();

  competition.photo = { pid: photo_album._id, name: photo_album.name };
  fs.mkdir(meanConfig.root + '/public/img/photo_album/' + photo_album._id, function(err) {
    if (err) console.log(err);
  });

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


  var groupMessage = new GroupMessage();

  groupMessage.group.gid.push(gid);
  groupMessage.group.group_type.push(competition.group_type);
  groupMessage.provoke.active = true;
  groupMessage.provoke.competition_format = competition_format;

  var a = {
    'cid':req.session.cid,
    'tname':req.companyGroup.name
  };
  var b = {
    'cid':req.body.team_opposite.cid,
    'tname':req.body.team_opposite.name
  };

  groupMessage.provoke.camp.push(a);
  groupMessage.provoke.camp.push(b);

  groupMessage.poster.cid = req.session.cid;
  groupMessage.poster.uid = uid;
  groupMessage.poster.role = 'LEADER';
  groupMessage.poster.username = username;
  groupMessage.cid.push(req.session.cid);
  if(req.session.cid !== req.body.team_opposite.cid) {
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
      competition.save();
    }
    return res.send({'result':1,'msg':'挑战成功！'});
    //这里要注意一下,生成动态消息后还要向被约队长发一封私信
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




//TODO
//修改活动后的关闭逻辑?
exports.campaignEdit = function (req, res) {
  var campaign_id = req.body.campaign_id;
  var content = req.body.content;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;

  Campaign.findOne({'_id':campaign_id}, function (err, campaign) {
    if(err) {
      return res.send(err);
    } else {
       GroupMessage.findOne({'content':campaign.content}, function (err, group_message) {
        if(err) {
          return res.send(err);
        } else {
          group_message.content = content;
          campaign.content = content;
          campaign.start_time = start_time;
          campaign.end_time = end_time;
          group_message.save(function (err) {
            if(err) {
              return res.send(err);
            } else {
              campaign.save();
              return res.send('ok');
            }
          })
        }
      });
      //console.log(campaign_id);
      //return res.send('ok');
    }
  });
};

//组长发布一个活动(只能是一个企业)
exports.sponsor = function (req, res) {

  var username = req.session.username;
  var group_type = req.companyGroup.group_type;
  var cid = req.session.cid;  //公司id
  var uid = req.session.uid;  //用户id
  var gid = req.session.gid;     //组件id,组长一次对一个组发布活动
  var content = req.body.content;//活动内容
  var location = req.body.location;//活动地点
  var tid = req.params.teamId;

  //生成活动
  var campaign = new Campaign();
  campaign.team = tid;         //ref
  campaign.gid.push(gid);
  campaign.group_type.push(group_type);
  campaign.cid.push(cid);//内部活动只有一个公司
  campaign.poster.cname = req.companyGroup.cname;
  campaign.poster.cid = cid;
  campaign.poster.uid = uid;
  campaign.poster.role = 'LEADER';
  campaign.poster.username = username;
  campaign.content = content;
  campaign.location = location;
  campaign.active = true;

  campaign.start_time = req.body.start_time;
  campaign.end_time = req.body.end_time;
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

    //生成动态消息
    var groupMessage = new GroupMessage();

    groupMessage.team = tid;
    groupMessage.group.gid.push(gid);
    groupMessage.group.group_type.push(group_type);
    groupMessage.active = true;
    groupMessage.cid.push(cid);

    groupMessage.poster.cname = req.companyGroup.cname;
    groupMessage.poster.cid = cid;
    groupMessage.poster.uid = uid;
    groupMessage.poster.role = 'LEADER';
    groupMessage.poster.username = username;

    groupMessage.content = content;
    groupMessage.location = location;
    groupMessage.start_time = req.body.start_time;
    groupMessage.end_time = req.body.end_time;

    groupMessage.save(function (err) {
      if (err) {
        res.send(err);
        return;
      }
    });
  });
  res.send("ok");
};


exports.getGroupMember = function(req,res){

  var cid = req.session.cid;
  var gid = req.session.gid;
  var tid = req.params.teamId;

  CompanyGroup
    .findOne({
        'cid': cid,
        'gid': gid,
        '_id': tid
    },function(err, companyGroup) {
        if(err){
          console.log(err);
          return res.status(404).send(err);
        };
        var _member_list =[];
        var _leader_list = [];
        if(companyGroup){
          _member_list = companyGroup.member;
          _leader_list = companyGroup.leader;
        };
        return res.send({'result':1,data:{'member':_member_list,'leader':_leader_list}});
    });

};



//比赛
exports.getCompetition = function(req, res){
  var msg_show,score_a,score_b,rst_content,date;

  var is_leader = false;
  for(var i = 0; i < req.user.group.length; i ++) {
    if(req.user.group[i]._id === req.competition.gid){
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
    'date' : date,
    'moment': moment
  });
};



exports.updateFormation = function(req, res){
  Competition.findOne({
    '_id':req.params.competitionId
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

exports.competition = function(req, res, next, id){
  var first = false;

  Competition.findOne({
      '_id':id
    }).exec(function(err, competition){
      if (err) return next(err);
      req.competition = competition;

      if(!first) {
        first = true;
        req.session.leader = false;
        var leader = req.companyGroup.leader;
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

//某一方发送或者修改比赛成绩确认消息
exports.resultConfirm = function (req, res) {
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
      var _campFlag = req.session.cid === competition.camp[0].cid ? 0 : 1;
      var _otherCampFlag = req.session.cid === competition.camp[0].cid ? 1 : 0;
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
        cid: req.session.cid,
        _id: id
    })
    .exec(function(err, companyGroup) {
        if (err) return next(err);
        if (!companyGroup) return next(new Error(req.session.cid+' Failed to load companyGroup ' + id));
        req.companyGroup = companyGroup;
        next();
    });
};




exports.saveLogo = function(req, res) {
  var user = req.user;

  var logo_temp_path = req.files.logo.path;

  var shasum = crypto.createHash('sha1');
  shasum.update( Date.now().toString() + Math.random().toString() );
  var logo = shasum.digest('hex') + '.png';


  // 文件系统路径，供fs使用
  var target_dir = path.join(meanConfig.root, '/public/img/group/logo/');

  // uri路径，存入数据库的路径，供前端访问
  var uri_dir = '/img/group/logo/';

  try {
    gm(logo_temp_path).size(function(err, value) {
      if (err) {
        console.log(err);
        res.redirect('/group/editLogo');
      }

      var w = req.body.width * value.width;
      var h = req.body.height * value.height;
      var x = req.body.x * value.width;
      var y = req.body.y * value.height;

      CompanyGroup.findOne({ gid: req.session.gid, cid: req.user.cid }).exec(function(err, company_group) {
        var ori_logo = company_group.logo;

        try {
          gm(logo_temp_path)
          .crop(w, h, x, y)
          .resize(150, 150)
          .write(path.join(target_dir, logo), function(err) {
            if (err) {
              console.log(err);
              res.redirect('/group/editLogo');
            } else {
              company_group.logo = path.join(uri_dir, logo);
              company_group.save(function(err) {
                if (err) {
                  console.log(err);
                  res.redirect('/group/editLogo');
                }
              });
              fs.unlink(logo_temp_path, function(err) {
                if (err) {
                  console(err);
                  res.redirect('/group/editLogo');
                }
                var unlink_dir = path.join(meanConfig.root, 'public');
                if (ori_logo && ori_logo !== '/img/icons/default_group_logo.png') {
                  if (fs.existsSync(unlink_dir + ori_logo)) {
                    fs.unlinkSync(unlink_dir + ori_logo);
                  }
                }

              });
            }
            res.redirect('/group/editLogo');
          });
        } catch(e) {
          console.log(e);
        }

      });
    });
  } catch(e) {
    console.log(e);
  }


};

exports.editLogo = function(req, res) {
  CompanyGroup.findOne({ gid: req.session.gid, cid: req.user.cid }).exec(function(err, company_group) {
    res.render('group/editLogo', {
      logo: company_group.logo,
      id: company_group._id
    });
  });

};

exports.getLogo = function(req, res) {
  var id = req.params.id;
  var width = req.params.width;
  var height = req.params.height;
  if (validator.isNumeric(width + height)) {
    async.waterfall([
      function(callback) {
        CompanyGroup.findOne({ _id: id })
        .exec(function(err, company_group) {
          if (err) callback(err);
          else callback(null, company_group.logo);
        });
      },
      function(logo, callback) {
        res.set('Content-Type', 'image/png');
        gm(meanConfig.root + '/public' + logo)
        .resize(width, height, '!')
        .stream(function(err, stdout, stderr) {
          if (err) callback(err);
          else {
            stdout.pipe(res);
            callback(null);
          }
        });
      }
    ], function(err, result) {
      if (err) res.send({ result: 0, msg: '获取小组logo失败' });
    });

  } else {
    res.send({ result: 0, msg: '请求错误' });
  }
};

exports.managePhotoAlbum = function(req, res) {
  CompanyGroup.findOne({ cid : req.session.cid, gid: req.session.gid,_id: req.params.tid })
  .exec(function(err, company_group) {
    if (err) console.log(err);
    else if (company_group) {
      var photo_album_ids = [];
      company_group.photo.forEach(function(photo_album) {
        photo_album_ids.push(photo_album.pid);
      })
      PhotoAlbum.where('_id').in(photo_album_ids)
      .exec(function(err, photo_albums) {
        if (err) { console.log(err); }
        else if(photo_albums) {
          var visible_photo_albums = [];
          photo_albums.forEach(function(photo_album) {
            if (photo_album.hidden === false) {
              visible_photo_albums.push(photo_album);
            }
          });
          res.render('group/manage_photo_album',
            { owner_id : req.params.tid,
              photo_albums: visible_photo_albums
          });
        }
      });
    }
  });
}

exports.groupPhotoAlbumDetail = function(req, res) {
  PhotoAlbum.findOne({ _id: req.params.photoAlbumId })
  .exec(function(err, photo_album) {
    if (err) console.log(err);
    else {
      res.render('group/photo_album_detail', {
        tid: req.params.tid,
        photo_album: photo_album
      });
    }
  });
};

exports.competitionPhotoAlbumDetail = function(req, res) {
  PhotoAlbum.findOne({ _id: req.params.photoAlbumId })
  .exec(function(err, photo_album) {
    if (err) console.log(err);
    else {
      res.render('group/competition_photo_album_detail', {
        competition_id: req.params.competitionId,
        photo_album: photo_album
      });
    }
  });
};
