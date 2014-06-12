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
    moment = require('moment'),
    model_helper = require('../helpers/model_helper'),
    schedule = require('../services/schedule');
function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property].toString() === searchTerm.toString()) return i;
    }
    return -1;
}
exports.authorize = function(req, res, next) {
  if(req.user.provider==="company"){
    if(req.user._id.toString() ===req.companyGroup.cid.toString()){
      req.session.role = 'HR';
    }
    else{
      req.session.role = 'GUESTHR';
    }
  }
  else if(req.user.provider==="user" && req.user.cid.toString() ===req.companyGroup.cid.toString()){
    var _groupIndex = arrayObjectIndexOf(req.user.group,req.companyGroup.gid,'_id');
    if(_groupIndex>-1){
      var _teamIndex = arrayObjectIndexOf(req.user.group[_groupIndex].team,req.companyGroup._id,'id');
      if(_teamIndex>-1){
        if(req.user.group[_groupIndex].team[_teamIndex].leader ===true){
          req.session.role = 'LEADER';
        }
        else{
          req.session.role = 'MEMBER';
        }
      }
      else{
        req.session.role = 'PARTNER';
      }
    }
    else{
      req.session.role = 'PARTNER';
    }
  }
  else{
    req.session.role = 'GUEST';
  }
  req.session.nowtid = req.params.teamId;
  next();
};
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



//显示企业成员列表
exports.renderMember = function(req,res){
  if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST'){
    return res.send(403,forbidden);
  }
  res.render('partials/member_list',{'role':req.session.role,'provider':'company'});
};


exports.renderInfo = function (req, res) {
  res.render('group/group_info',{'role':req.session.role});
};

//激活小组
exports.activateGroup = function(req, res) {
  var tid = req.body.tid;
  var active = req.body.active;
  CompanyGroup.findOne({
    '_id':tid
  },function(err,companyGroup){
    if (err || !companyGroup){
      console.log('cannot find team');
      return res.send({'result':0,'msg':'小组查询错误'});
    }else{
      companyGroup.active = active;
      companyGroup.save(function(s_err){
        if(s_err){
          console.log(s_err);
          res.send({'result':0,'msg':'数据保存错误'});
        }
        return res.send({'result':1,'msg':'数据保存成功'});
      });
    }
  });
};


//小队信息维护 TODO
exports.info =function(req,res) {
  var entity_type = req.companyGroup.entity_type;
  var Entity = mongoose.model(entity_type);//将对应的增强组件模型引进来
  Entity.findOne({
      'tid': req.companyGroup._id
    },function(err, entity) {
        if (err) {
            console.log(err);
            return res.send(err);
        } else {
            return res.send({
                'companyGroup': req.companyGroup,  //父小组信息
                'entity': entity                   //实体小组信息
            });
        }
    });
};

//根据tid返回team
exports.getOneTeam = function(req, res) {
  var tid = req.body.tid;
  CompanyGroup.findOne({
    '_id':tid
  },function(err, team){
    if (err || !team) {
      console.log('cannot find team');
      return res.send();
    } else{
        return res.send(team);
    }
  });
};

//TODO
exports.saveInfo =function(req,res) {
    if(req.session.role !=='HR' && req.session.role !=='LEADER'){
    return res.send(403,forbidden);
  }
  CompanyGroup.findOne({'_id' : req.session.nowtid}, function(err, companyGroup) {
      if (err) {
          console.log('数据错误');
          res.send({'result':0,'msg':'数据查询错误'});
          return;
      }
      var newNameFlag = false;
      if(companyGroup) {
          if(companyGroup.name !== req.body.name){
            companyGroup.name = req.body.name;
            newNameFlag =true;
          }

          companyGroup.brief = req.body.brief;
          companyGroup.save(function (s_err){
              if(s_err){
                  console.log(s_err);
                  return res.send({'result':0,'msg':'数据保存错误'});
              }
              if(newNameFlag){
                schedule.updateTname(req.session.nowtid);
              }
              var entity_type = companyGroup.entity_type;
              var Entity = mongoose.model(entity_type);//将对应的增强组件模型引进来
              Entity.findOne({
                  'tid': req.session.nowtid
                },function(err, entity) {
                    if (err) {
                        console.log(err);
                        return res.send(err);
                    } else if(entity){
                      entity.home_court = req.body.homecourt;
                      entity.save(function(err){
                        if(err){
                          console.log(err);
                          return res.send({'result':0,'msg':'不存在组件！'});;
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
};
//小队信息维护
exports.timeLine = function(req, res){
  Campaign
  .find({ 'end_time':{'$lt':new Date()},'team': req.session.nowtid})
  .sort('-start_time')
  .populate('team')
  .exec()
  .then(function(campaigns) {
    console.log(campaigns);
    if (campaigns && campaigns.length>0) {
      var timeLines = [];
      campaigns.forEach(function(campaign) {
        var _head;
        if(campaign.provoke.active){
          _head = campaign.provoke.team[0].name +'对' + campaign.provoke.team[1].name +'的比赛';
        }
        else{
          _head = campaign.team[0].name + '活动';
        }
        var tempObj = {
          id: campaign._id,
          head: _head,
          logo:campaign.team[0].logo,
          content: campaign.content,
          location: campaign.location,
          group_type: campaign.group_type,
          date: campaign.start_time,
          provoke:campaign.provoke
        }
        timeLines.push(tempObj);
      });
      res.render('partials/timeLine',{'timeLines': timeLines,'moment':moment });
    }
    else{
      res.render('partials/timeLine');
    }
  })
  .then(null, function(err) {
    console.log(err);
    res.render('partials/timeLine');
  });
};


//返回小队页面
exports.home = function(req, res) {
  var cid = req.companyGroup.cid.toString();
  if(req.session.role==='HR' || req.session.role ==='GUESTHR'){
    res.render('group/home', {
      'role': req.session.role,
      'teamId' : req.params.teamId,
      'tname': req.companyGroup.name,
      'number': req.companyGroup.member ? req.companyGroup.member.length : 0,
      'score': req.companyGroup.score ? req.companyGroup.score : 0,
      'logo': req.companyGroup.logo,
      'group_id': req.companyGroup._id,
      'cname': req.companyGroup.cname,
      'sign': req.companyGroup.brief,
      'gid' : req.companyGroup.gid,
      'cid' : cid
    });
  }
  else{//个人侧栏
    var selected_teams = [];
    var unselected_teams = [];
    var user_teams = [];
    var photo_album_ids = [];
    for(var i = 0; i < req.user.group.length; i ++) {
      for(var j = 0; j < req.user.group[i].team.length; j ++) {
        user_teams.push(req.user.group[i].team[j].id.toString());
      }
    }
    CompanyGroup.find({'cid':req.user.cid}, {'_id':1,'gid':1,'group_type':1,'logo':1,'name':1,'cname':1,'active':1},function(err, company_groups) {
      if(err || !company_groups) {
        return res.send([]);
      } else {
        for(var i = 0; i < company_groups.length; i ++) {
          if(company_groups[i].gid !== '0' && company_groups[i].active === true){
            //下面查找的是该成员加入和未加入的所有active小队
            if(user_teams.indexOf(company_groups[i]._id.toString()) > -1) {
              selected_teams.push(company_groups[i]);
            } else {
              unselected_teams.push(company_groups[i]);
            }
          }
        }

        res.render('group/home',{
          'selected_teams' : selected_teams,
          'unselected_teams' : unselected_teams,
          'teamId' : req.params.teamId,
          'tname': req.companyGroup.name,
          'number': req.companyGroup.member ? req.companyGroup.member.length : 0,
          'score': req.companyGroup.score ? req.companyGroup.score : 0,
          'role': req.session.role,
          'logo': req.companyGroup.logo,
          'group_id': req.companyGroup._id,
          'cname': req.companyGroup.cname,
          'sign': req.companyGroup.brief,
          'gid' : req.companyGroup.gid,
          'cid' : cid,
          'photo': req.user.photo,
          'realname':req.user.realname

        });
      };
    });
  };
};

//返回公司小队的所有数据,待前台调用
exports.getCompanyGroups = function(req, res) {
  CompanyGroup.find({cid : req.session.nowcid, gid : {'$ne' : '0'}},{'_id':1,'logo':1,'gid':1,'group_type':1,'entity_type':1,'name':1,'leader':1,'member':1,'active':1}, function(err, teams) {
    if(err || !teams) {
      return res.send([]);
    } else {
      return res.send({
        'teams':teams,
        'group' : req.user.group,
        'cid':req.session.nowcid,
        'role':req.session.role
      });
    }
  });
};



//根据小队ID返回小组动态消息
exports.getGroupMessage = function(req, res) {
  if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST'){
    return res.send(403,forbidden);
  }
  var tid = req.params.teamId;    //小队的id
  var logo;
  CompanyGroup.findOne({'_id':tid}).exec(function(err,companyGroup){
    logo=companyGroup.logo;
    console.log(logo);
  });
  GroupMessage.find({'team' : tid}).sort({'_id':-1})
  .exec(function(err, group_message) {
    if (err || !group_message) {
      console.log(err);
      return res.status(404).send([]);
    } else {
      var group_messages = [];
      var length = group_message.length;
      for(var i = 0; i < length; i ++) {

        var positive = 0;
        var negative = 0;
        var host = true;
        //如果是比赛动态
        if(group_message[i].provoke.active) {
          for(var k = 0; k < group_message[i].provoke.camp.length; k ++) {
            if(group_message[i].provoke.camp[k].tid.toString() === req.companyGroup._id.toString()){
              positive = group_message[i].provoke.camp[k].vote.positive;
              negative = group_message[i].provoke.camp[k].vote.negative;
              host = (k === 0);
              break;
            }
          }
        }
        group_messages.push({
          'positive' : positive,
          'negative' : negative,
          'my_team_id' : req.companyGroup._id,
          'my_team_name' : req.companyGroup.name,
          'host': host,                  //是不是发赛方
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
          'logo':logo,
          'provoke': group_message[i].provoke,                   //应约按钮显示要有四个条件:1.该约战没有关闭 2.当前员工所属组件id和被约组件id一致 3.约战没有确认 4.当前员工是该小队的队长
          'provoke_accept': group_message[i].provoke.active && (req.session.role==='HR' || req.session.role ==='LEADER') && (!group_message[i].provoke.start_confirm) && (group_message[i].team[1].toString() === tid.toString())
        }); 
      }
      return res.send({'group_messages':group_messages,'role':req.session.role});
    }
  });
};

exports.renderCampaigns = function(req,res){
  if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST'){
    return res.send(403,forbidden);
  }
  res.render('partials/campaign_list',{'role':req.session.role,'provider':'group'});
}

//
exports.renderGroupMessageList =function(req,res){
  res.render('group/group_message_list',{
      'role':req.session.role
  });
};

//返回某一小组的活动,待前台调用
exports.getGroupCampaign = function(req, res) {
  if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST'){
    return res.send(403,forbidden);
  }
  var tid = req.params.teamId;
  //有包含gid的活动都列出来
  Campaign.find({'team' : tid}).sort({'_id':-1}).exec(function(err, campaign) {
    if (err) {
      console.log(err);
      return res.status(404).send([]);
    } else {
      var campaigns = [];
      var join = false;
      var length = campaign.length;
      if(req.session.role ==='HR'){
        campaigns = campaign;
      }
      else{
        for(var i = 0;i < length; i ++) {
          join = false;
          //参加过的也不能参加
          for(var j = 0;j < campaign[i].member.length; j ++) {
            if(req.user._id.toString() === campaign[i].member[j].uid) {
              join = true;
              break;
            }
          }
          campaigns.push({
            'over' : !(Date.now() - campaign[j].end_time.valueOf() <= 0),
            'active':campaign[i].active, //截止时间到了活动就无效了
            'id': campaign[i]._id.toString(),
            'gid': campaign[i].gid,
            'group_type': campaign[i].group_type,
            'cid': campaign[i].cid,
            'cname': campaign[i].cname,
            'poster': campaign[i].poster,
            'content': campaign[i].content,
            'location': campaign[i].location,
            'member_length': campaign[i].member.length,
            'start_time': campaign[i].start_time ? campaign[i].start_time : '',
            'end_time': campaign[i].end_time ? campaign[i].end_time : '',
            'join':join,
            'provoke':campaign[i].provoke,
            'index':i
          });
        }
      }
      return res.send({
        'data':campaigns,
        'role':req.session.role
      });
    }
  });
};

//组长关闭活动
exports.campaignCancel = function (req, res) {
  if(req.session.role !=='HR' && req.session.role !=='LEADER'){
    return res.send(403,forbidden);
  }
  var campaign_id = req.body.campaign_id;
  Campaign.findOne({_id:campaign_id},function(err, campaign) {
      if(!err && campaign) {
        var active = campaign.active;
        campaign.active = !active;
        campaign.save(function(err){
          if(!err){
             return res.send({'result':1,'msg':'关闭成功'});
          }
          else{
            return res.send({'result':0,'msg':'关闭活动失败'});
          }
        });
      } else {
          return res.send({'result':0,'msg':'不存在该活动'});
      }
  });
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

  var photo_album = new PhotoAlbum();
  photo_album.save(function(err){
    if(!err){
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
    }
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

        campaign.theme = competition.content;
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

//组长发布一个活动(只能是一个企业)
exports.sponsor = function (req, res) {
  if(req.session.role !=='HR' && req.session.role !=='LEADER'){
    return res.send(403,forbidden);
  }
  var theme = req.body.theme;
  var content = req.body.content;//活动内容
  var location = req.body.location;//活动地点
  var group_type = req.companyGroup.group_type;
  var tid = req.params.teamId;
  var cid = req.session.role ==='HR' ? req.user._id : req.user.cid;
  var cname = req.session.role ==='HR' ? req.user.info.name : req.user.cname;
  var tname;
  CompanyGroup.findOne({'_id' : tid},function (err, companyGroup){
    if(err){
      return ({'result':0,'msg':'发布错误，无此小队。'});
    }else{
      tname = companyGroup.name;
      console.log(tname);
    }
  });
  //生成活动
  var campaign = new Campaign();
  campaign.team.push(tid);
  campaign.gid.push(req.companyGroup.gid);
  campaign.group_type.push(group_type);
  campaign.cid.push(cid);//其实只有一个公司
  campaign.cname.push(cname);
  campaign.poster.cname = cname;
  campaign.poster.cid = cid;
  campaign.poster.role = req.session.role;
  campaign.poster.tname = tname;
  if(req.session.role==='LEADER'){
    campaign.poster.uid = req.user._id;
    campaign.poster.nickname = req.user.nickname;
  }

  campaign.content = content;
  campaign.location = location;
  campaign.theme = theme;
  campaign.active = true;

  campaign.start_time = req.body.start_time;
  campaign.end_time = req.body.end_time;

  var photo_album = new PhotoAlbum();

  fs.mkdir(meanConfig.root + '/public/img/photo_album/' + photo_album._id, function(err) {
    if (err) {
      console.log(err);
      return res.send({'result':0,'msg':'活动创建失败'});
    }

    photo_album.save(function(err) {
      if (err) {
        console.log(err);
        return res.send({'result':0,'msg':'活动创建失败'});
      }
      campaign.photo_album = photo_album._id;
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

        groupMessage.team.push(tid);
        groupMessage.group.gid.push(req.companyGroup.gid);
        groupMessage.group.group_type.push(group_type);
        groupMessage.active = true;
        groupMessage.cid.push(cid);
        groupMessage.poster.cname = cname;
        groupMessage.poster.cid = cid;
        groupMessage.poster.role = req.session.role;
        groupMessage.poster.tname = tname;
        if(req.session.role==='LEADER'){
          groupMessage.poster.uid = req.user._id;
          groupMessage.poster.nickname = req.user.nickname;
        }
        groupMessage.content = content;
        groupMessage.location = location;
        groupMessage.start_time = req.body.start_time;
        groupMessage.end_time = req.body.end_time;

        groupMessage.save(function (err) {
          if (err) {
            res.send(err);
            return {'result':0,'msg':'活动发起失败'};
          }
          else{
            return res.send({'result':1,'msg':'活动发起成功'});
          }
        });
      });
    });
  });
};


exports.getGroupMember = function(req,res){
  var  _member_list = req.companyGroup.member;
  var _leader_list = req.companyGroup.leader;
  return res.send({'result':1,data:{'member':_member_list,'leader':_leader_list}});
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


exports.renderCampaignDetail = function(req, res) {
  req.session.nowcampaignid = req.params.campaignId;
  res.render('users/campaign_detail', {
    role: req.session.role,
    head_nickname : req.user.nickname,
    head_photo : req.user.photo
  });
}

exports.getCampaignDetail = function(req, res) {
  if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST'){
    return res.send(403,forbidden);
  }
  if(req.session.nowcampaignid == null || req.session.nowcampaignid == undefined){
    return res.send(404);
  }
  var join = false;
  Campaign
  .findOne({ _id: req.session.nowcampaignid })
  .exec()
  .then(function(campaign) {
    //增加返回值是否加入
    if(req.session.role === 'MEMBER'|| req.session.role === 'OWNER'){
      for(var j = 0;j < campaign.member.length; j ++) {
        if(req.user._id.toString() === campaign.member[j].uid) {
          join = true;
          break;
        }
      }
    }
    console.log(campaign);
    return res.send({
      over : !(Date.now() - campaign.end_time.valueOf() <= 0),
      campaign: campaign,
      join: join,
      nickname : req.user.nickname,
      photo : req.user.photo
    });
  })
  .then(null, function(err) {
    console.log(err);
    return res.status(500).send('error');
  });
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
  var cid = req.session.nowcid ? req.session.nowcid :(req.user.provider ==='company' ? req.user.id : req.user.cid);
  Competition.findOne({
      '_id':id
    }).exec(function(err, competition){
      if (err) return next(err);
      req.competition = competition;
      if(cid.toString() ===competition.camp[0].cid.toString()){
        req.competition_team = 'A';
      }
      else if(cid.toString() ===competition.camp[1].cid.toString()){
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
  //TODO: 目前使用cid+gid获取companyGroup，需用id查询
  CompanyGroup
    .findOne({
      _id: id
    })
    .exec(function(err, companyGroup) {
        if (err) return next(err);
        if (!companyGroup) return next(new Error(' Failed to load companyGroup ' + id));
        req.companyGroup = companyGroup;
        next();
    });
};




exports.editLogo = function(req, res) {
  if(req.session.role !=='HR' && req.session.role !=='LEADER'){
    return res.send(403,forbidden);
  }
  CompanyGroup.findOne({ _id: req.session.nowtid  }).exec(function(err, company_group) {
    res.render('group/editLogo', {
      logo: company_group.logo,
      id: company_group._id,
      head_nickname : req.user.nickname,
      head_photo : req.user.photo
    });
  });

};



exports.managePhotoAlbum = function(req, res) {
  var photo_album_ids = [];
  req.companyGroup.photo_album.forEach(function(photo_album) {
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
        { owner_id : req.params.teamId,
          photo_albums: visible_photo_albums
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

exports.campaignPhotoAlbumDetail = function(req, res) {
  PhotoAlbum
  .findOne({ _id: req.params.photoAlbumId })
  .exec()
  .then(function(photo_album) {
    if (!photo_album) {
      throw 'Not Found';
    } else {
      res.render('group/campaign_photo_album_detail', {
        campaign_id: req.params.campaignId,
        photo_album: photo_album
      });
    }
  })
  .then(null, function(err) {
    console.log(err);
    res.status(500).send('Error');
  });
};



exports.getCampaignsForApp = function(req, res) {
  if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST'){
    return res.send(403,forbidden);
  }
  var user = req.user;
  var tid = req.params.teamId;

  Campaign
  .where('team').all(tid)
  .populate('team')
  .exec()
  .then(function(campaigns) {
    model_helper.sendCampaignsForApp(user, campaigns, res);
  })
  .then(null, function(err) {
    console.log(err);
    res.send({ result: 0, msg: '获取活动列表失败' });
  });



};


