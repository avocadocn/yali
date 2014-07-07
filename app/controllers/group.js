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
    Arena = mongoose.model('Arena'),
    PhotoAlbum = mongoose.model('PhotoAlbum'),
    validator = require('validator'),
    async = require('async'),
    fs = require('fs'),
    gm = require('gm'),
    path = require('path'),
    moment = require('moment'),
    model_helper = require('../helpers/model_helper'),
    schedule = require('../services/schedule'),
    message = require('../controllers/message'),
    photo_album_controller = require('./photoAlbum');

exports.authorize = function(req, res, next) {
  if(req.user.provider==="company"){
    if(req.user._id.toString() ===req.companyGroup.cid.toString()){
      req.session.role = 'HR';
      req.session.Global.role = 'HR';
    }
    else{
      req.session.role = 'GUESTHR';
      req.session.Global.role = 'GUESTHR';
    }
  }
  else if(req.user.provider==="user" && req.user.cid.toString() ===req.companyGroup.cid.toString()){
    var _teamIndex = model_helper.arrayObjectIndexOf(req.user.team,req.companyGroup._id,'_id');
    if(_teamIndex>-1){
      console.log(_teamIndex,req.user.team[_teamIndex]);
      if(req.user.team[_teamIndex].leader === true){
        req.session.role = 'LEADER';
        req.session.Global.role = 'LEADER';
      }
      else{
        req.session.role = 'MEMBER';
        req.session.Global.role = 'MEMBER';
      }
    }
    else{
      req.session.role = 'PARTNER';
      req.session.Global.role = 'PARTNER';
    }
  }
  else{
    if(req.user.role == 'LEADER'){
      req.session.role = 'GUESTLEADER';
      req.session.Global.role = 'GUESTLEADER';
    }else{
      req.session.role = 'GUEST';
      req.session.Global.role = 'GUEST';
    }
  }
  req.session.nowtid = req.params.teamId;
  req.session.nowgid = req.companyGroup.gid;
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

//激活小队
exports.activateGroup = function(req, res) {
  var tid = req.body.tid;
  var active = req.body.active;
  CompanyGroup.findOne({
    '_id':tid
  },function(err,companyGroup){
    if (err || !companyGroup){
      console.log('cannot find team');
      return res.send({'result':0,'msg':'小队查询错误'});
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
                'companyGroup': req.companyGroup,  //父小队信息
                'entity': entity                   //实体小队信息
            });
        }
    });
};

//获取小组简要信息供弹出层查看
exports.getBriefInfo = function(req,res) {
  CompanyGroup.findOne({'_id': req.params.teamId },{'_id':1,'name':1,'logo':1},function(err,companyGroup){
    if (err || !companyGroup){
      console.log('cannot find team');
      return res.send({'result':0,'msg':'小队查询错误'});
    }else{
      var message_theme = '';
      var campaign_id = '';
      Campaign.find({'team':req.params.teamId},{'_id':1,'theme':1})
      .sort({'create_time':-1})
      .limit(1)
      .exec(function(err,campaign){
        if(err){
          console.log('cannot find campaign');
          return res.send({'result':0,'msg':'消息查询错误'});
        }
        if(campaign.length==0)
          message_theme = '';
        else{
          message_theme = campaign[0].theme;
          campaign_id = campaign[0]._id;
        }
        var htmlcontent ="<div class='popover_img'><a href='/group/home/"+companyGroup._id+"'><img class='size_80' src='"+companyGroup.logo+"'></img></a></div>";
          htmlcontent += "<div class='popover_content'><p><a href='/group/home/"+companyGroup._id+"'>"+companyGroup.name+"</a></p></div>";
          htmlcontent += "<div class='popover_brief'><p><span>最新活动:</span><a href='/campaign/detail/"+campaign_id+"'>"+message_theme+"</a></p></div>";
        return res.send({
          result: 1,
          htmlcontent: htmlcontent
        });
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
  .find({ 'active':true,'finish':true,'team': req.session.nowtid})
  .sort('-start_time')
  .populate('team')
  .exec()
  .then(function(campaigns) {
    if (campaigns && campaigns.length>0) {
      var timeLines = [];
      // todo new time style
      var newTimeLines = {};
      // todo new time style
      campaigns.forEach(function(campaign) {


        var _head,_logo;
        if(campaign.camp.length>0){
          _head = campaign.camp[0].name +'对' + campaign.camp[1].name +'的比赛';
          _logo = campaign.camp[0].id ==req.session.nowtid ? campaign.camp[0].logo:campaign.camp[1].logo ;
        }
        else{
          _head = campaign.team[0].name + '活动';
          _logo = campaign.team[0].logo;
        }
        var tempObj = {
          id: campaign._id,
          //head: _head,
          head:campaign.theme,
          logo:_logo,
          content: campaign.content,
          location: campaign.location,
          group_type: campaign.group_type,
          start_time: campaign.start_time,
          provoke:campaign.camp.length>0,
          year: getYear(campaign),
          photo_album: campaign.photo_album
        }
        // todo new time style
        // console.log(campaign);
        // console.log(tempObj);
        function getYear(dates) {
          var response = String(dates.end_time);
          var _ = response.split(" ");
          var year = _[3]
          return year;
        }
        // console.log(getYear(campaign));
        var groupYear = getYear(campaign);
        if (!newTimeLines[groupYear]) {
          newTimeLines[groupYear] = [];
          newTimeLines[groupYear]['left'] = [];
          newTimeLines[groupYear]['right'] = [];

          newTimeLines[groupYear]['left'][0] = tempObj;
          newTimeLines[groupYear][0] = tempObj;
        }else{
          var i = newTimeLines[groupYear].length;
          newTimeLines[groupYear][i] = tempObj;
          if (i%2==0) {
            var j = newTimeLines[groupYear]['left'].length;
            newTimeLines[groupYear]['left'][j] = tempObj;
          }else{
            var j = newTimeLines[groupYear]['right'].length;
            newTimeLines[groupYear]['right'][j] = tempObj;
          }
          
        }
        //console.log('item:'+ newTimeLines[groupYear].length);
        // todo new time style

        timeLines.push(tempObj);
      });
      res.render('partials/timeLine',{'timeLines': timeLines,'newTimeLines': newTimeLines,'moment':moment });
    }
    else{
      res.render('partials/timeLine');
    }
      // // todo new time style
      // console.log(timeLines);
      //console.log(newTimeLines);
      // // todo new time style
  })
  .then(null, function(err) {
    console.log(err);
    res.render('partials/timeLine');
  });
};


//返回小队页面
exports.home = function(req, res) {
  var cid = req.companyGroup.cid.toString();
  async.waterfall([
    function(callback) {
      PhotoAlbum
      .where('_id').in(req.companyGroup.photo_album_list)
      .exec()
      .then(function(photo_albums) {
        if (!photo_albums) {
          callback('not found');
        }
        var photo_album_thumbnails = [];

        for (var i = 0; i < photo_albums.length; i++) {
          if (photo_albums[i].owner.model.type === 'Campaign' && photo_albums[i].photos.length === 0) {
            continue;
          }
          if (photo_albums[i].hidden === true) {
            continue;
          }
          var thumbnail_uri = photo_album_controller.photoAlbumThumbnail(photo_albums[i]);
          photo_album_thumbnails.push({
            uri: thumbnail_uri,
            name: photo_albums[i].name,
            _id: photo_albums[i]._id
          });
          if (photo_album_thumbnails.length === 4) {
            break;
          }
        }

        callback(null, photo_album_thumbnails);
      })
      .then(null, function(err) {
        callback(err);
      });
    },
    function(photo_album_thumbnails, callback) {
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
          'cid' : cid,
          'nav_logo':req.user.info.logo,
          'nav_name':req.user.info.name,
          'photo_album_thumbnails': photo_album_thumbnails
        });
      }
      else{//个人侧栏
        var selected_teams = [];
        var unselected_teams = [];
        var user_teams = [];
        var photo_album_ids = [];
        for(var i = 0; i < req.user.team.length; i ++) {
          user_teams.push(req.user.team[i]._id.toString());
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
              'realname':req.user.realname,
              'nav_logo': req.user.photo,
              'nav_name':req.user.nickname,
              'photo_album_thumbnails': photo_album_thumbnails
            });
          };
        });
      };
    }
  ], function(err, result) {
    console.log(err);
    if (err === 'not found') res.send(404);
    else res.send(500);
  });

};
//返回公司小队的所有数据,员工选择组件时使用
exports.getCompanyGroups = function(req, res) {
  CompanyGroup.find({cid : req.session.nowcid},{'gid':1,'group_type':1,'entity_type':1,'name':1,'logo':1}, function(err, teams) {
    if(err || !teams) {
      return res.send([]);
    } else {
      return res.send({
        'teams':teams
      });
    }
  });
};
//返回公司小队的所有数据,待前台调用
exports.getCompanyTeamsInfo = function(req, res) {
  var option = {cid : req.session.nowcid};
  if(req.session.role !== 'HR'){
    option.active = true;
  }
  CompanyGroup.find(option, function(err, teams) {
    if(err || !teams) {
      return res.send([]);
    } else {
      var output ={
        'cid':req.session.nowcid,
        'role':req.session.role
      };
      if(req.session.role ==='EMPLOYEE'){
        var _teams = [];
        teams.forEach(function(value){
          var _team = {
            '_id':value._id,
            'gid':value.gid,
            'group_type':value.group_type,
            'logo':value.logo,
            'active':value.active,
            'count':value.count,
            'entity_type':value.entity_type,
            'leader':value.leader,
            'member':value.member,
            'name':value.name
          }
          if(model_helper.arrayObjectIndexOf(req.user.team,value._id,'_id')>-1){
            _team.belong = true;
          }
          else{
            _team.belong = false;
          }
          _teams.push(_team);
        });

        output.teams = _teams;
      }
      else {
        output.teams = teams;
      }
      return res.send(output);
    }
  });
};


exports.renderCampaigns = function(req,res){
  if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST'){
    return res.send(403,'forbidden');
  }
  res.render('partials/campaign_list',{'role':req.session.role,'provider':'team'});
}
//约战
exports.provoke = function (req, res) {
  if(req.session.role !=='HR' && req.session.role !=='LEADER' && req.session.role !=='GUESTLEADER' && req.session.role !=='GUESTLEADER'){
    console.log(req.session.role);
    return res.send(403,'forbidden');
  }

  var my_team_id = req.params.teamId;
  var team_opposite = req.body.team_opposite;
  var theme = req.body.theme;
  var location = req.body.location;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;
  var deadline = req.body.deadline ? req.body.deadline : end_time;
  var content = req.body.content;
  var member_min = req.body.member_min;
  var member_max = req.body.member_max;
  var competition = new Campaign();
  var cid = req.user.provider==="company" ? req.user._id : req.user.cid;
  var cname = req.user.provider==="company" ? req.user.info.name : req.user.cname;
  // 没有这两个属性
  //competition.gid = req.companyGroup.gid;
  //competition.group_type = req.companyGroup.group_type;
  var camp_a = {
    'id' : my_team_id,
    'cid' : req.companyGroup.cid,
    'start_confirm' : true,
    'tname' : req.companyGroup.name,
    'logo' : req.companyGroup.logo,
    'gid': req.companyGroup.gid
  };


  competition.camp.push(camp_a);

  var camp_b = {
    'id' : team_opposite._id,
    'cid' : team_opposite.cid,
    'tname' : team_opposite.name,
    'logo' : team_opposite.logo,
    'gid': req.companyGroup.gid
  };
  competition.camp.push(camp_b);
  competition.theme = theme;
  competition.content = content;
  competition.location = location;
  competition.start_time = start_time;
  competition.end_time = end_time;
  competition.deadline = deadline;
  competition.member_min = member_min;
  competition.member_max = member_max;
  competition.cname=[cname];
  competition.cid=[req.companyGroup.cid, team_opposite.cid];
  competition.team=[my_team_id,team_opposite._id];

  competition.poster.cname = cname;
  competition.poster.cid = cid;
  competition.poster.role = req.session.role;
  if(req.session.role==='LEADER'){
    competition.poster.uid = req.user._id;
    competition.poster.nickname = req.user.nickname;
  }

  var photo_album = new PhotoAlbum({
    owner: {
      model: {
        _id: competition._id,
        type: 'Campaign'
      },
      companies: [req.companyGroup.cid, team_opposite.cid],
      teams: [req.companyGroup._id, team_opposite._id]
    },
    name: moment(competition.start_time).format("YYYY-MM-DD ") + competition.theme,
    update_user: {
      _id: req.user._id,
      name: req.user.nickname,
      type: 'user'
    },
    create_user: {
      _id: req.user._id,
      name: req.user.nickname,
      type: 'user'
    }
  });
  fs.mkdir(path.join(meanConfig.root, '/public/img/photo_album/', photo_album._id.toString()), function(err) {
    if (err) {
      console.log(err);
      return res.send(500);
    } else {
      photo_album.save(function(err){
        if(!err){
          competition.photo_album = photo_album._id;

          competition.save(function(err){
            if(!err){
              var groupMessage = new GroupMessage();
              groupMessage.message_type = 4;
              groupMessage.team.push({
                teamid: my_team_id,
                name: req.companyGroup.name,
                logo: req.companyGroup.logo
              });         //发起挑战方小队信息
              groupMessage.team.push({
                teamid: team_opposite._id,
                name: team_opposite.name,
                logo: team_opposite.logo
              });  //应约方小队信息

              groupMessage.company.push({
                cid: req.companyGroup.cid,
                name: cname
              });
              groupMessage.company.push({
                cid: team_opposite.cid,
                name: team_opposite.cname
              });
              groupMessage.campaign = competition._id;
              groupMessage.save(function (err) {
                if (err) {
                  console.log('保存约战动态时出错' + err);
                }else{
                  return res.send({'result':0,'msg':'SUCCESS'});
                }
              });
            }else{
              return res.send({'result':0,'msg':'ERROR'});
            }
          });
        }
      });
    }
  })

};


//应约
exports.responseProvoke = function (req, res) {
  if(req.session.role !=='HR' && req.session.role !=='LEADER' && req.session.role !== 'OWNER'){
    return res.send(403,forbidden);
  }
  var competition_id = req.body.competition_id;
  Campaign.findOne({
      '_id' : competition_id
    },
  function (err, campaign) {
    campaign.camp[1].start_confirm = true;
    campaign.active = true;
    //还要存入应约方的公司名、队长用户名、真实姓名等
    campaign.save(function (err) {
      if (err) {
        res.send(err);
        return res.send({'result':0,'msg':'应战失败！'});
      }
      else{
        GroupMessage.findOne({campaign:campaign._id},function(err,groupMessage){
          groupMessage.message_type = 5;

          groupMessage.create_time = new Date();
          groupMessage.save(function (err) {
            if (err) {
              console.log('保存约战动态时出错' + err);
            }
            else{
              return res.send({'result':0,'msg':'SUCCESS'});
            }
          });
        });
      }
    });
  });
};

//队长发布一个活动(只能是一个企业)
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
  var tname = req.companyGroup.name;
  var member_min = req.body.member_min ? req.body.member_min : 0;
  var member_max = req.body.member_max ? req.body.member_max : 0;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;
  var deadline = req.body.deadline ? req.body.deadline : end_time;
  //生成活动
  var campaign = new Campaign();
  campaign.team.push(tid);
  campaign.cid =[cid];//其实只有一个公司
  campaign.cname =[cname];
  campaign.poster.cname = cname;
  campaign.poster.cid = cid;
  campaign.poster.role = req.session.role;
  campaign.poster.tname = tname;
  if(req.session.role==='LEADER'){
    campaign.poster.uid = req.user._id;
    campaign.poster.nickname = req.user.nickname;
  }
  campaign.member_min = member_min;
  campaign.member_max = member_max;

  campaign.content = content;
  campaign.location = location;
  campaign.theme = theme;
  campaign.active = true;

  campaign.start_time = start_time;
  campaign.end_time = end_time;
  campaign.deadline = deadline;
  var photo_album = new PhotoAlbum({
    owner: {
      model: {
        _id: campaign._id,
        type: 'Campaign'
      },
      companies: [cid],
      teams: [req.companyGroup._id]
    },
    name: moment(campaign.start_time).format("YYYY-MM-DD ") + campaign.theme,
    update_user: {
      _id: req.user._id,
      name: req.user.nickname,
      type: 'user'
    },
    create_user: {
      _id: req.user._id,
      name: req.user.nickname,
      type: 'user'
    }
  });

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
        else{
          req.companyGroup.photo_album_list.push(photo_album._id);
          req.companyGroup.save(function(err) {
            if (err) {
              res.send(500);
              return res.send({'result':0,'msg':'活动发起失败'});
            } else {
              //生成动态消息
              var groupMessage = new GroupMessage();
              groupMessage.message_type = 1;
              groupMessage.company = {
                cid : cid,
                name : cname
              };
              groupMessage.team= {
                teamid : tid,
                name : tname,
                logo : req.companyGroup.logo
              };
              groupMessage.campaign = campaign._id;
              groupMessage.save(function (err) {
                if (err) {
                  console.log(err);
                } else {
                  return res.send({'result':0,'msg':'活动发起成功'});
                }
              });
            }
          });
        }
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
    'score_a': "",
    'score_b': "",
    'rst_content': "",
    'moment':moment,
    'confirm_btn_show':false,
    'photo_thumbnails': photo_album_controller.photoThumbnailList(req.competition.photo_album).slice(0, 4)
  };
  var nowTeamIndex,otherTeamIndex;
  if(req.session.role==='HR'){
    nowTeamIndex = req.competition.camp[0].cid.toString() === req.user._id.toString() ? 0:1;
    otherTeamIndex = req.competition.camp[0].cid.toString() === req.user._id.toString() ? 1:0;
  }
  else{
    nowTeamIndex = req.competition.camp[0].cid.toString() === req.user.cid.toString() ? 0:1;
    otherTeamIndex = req.competition.camp[0].cid.toString() === req.user.cid.toString() ? 1:0;
  }
  if((req.session.role==='HR' || req.session.role ==='LEADER') && req.competition.camp[otherTeamIndex].result.confirm && !req.competition.camp[nowTeamIndex].result.confirm) {
    options.msg_show = true;
    options.score_a = req.competition.camp[nowTeamIndex].score;
    options.score_b = req.competition.camp[otherTeamIndex].score;
    options.rst_content = req.competition.camp[otherTeamIndex].result.content;
    options.date = req.competition.camp[otherTeamIndex].result.start_date;
  }
  options.confirm_btn_show = !(req.competition.camp[otherTeamIndex].result.confirm && req.competition.camp[nowTeamIndex].result.confirm);
  res.render('competition/football', options);
};


exports.updateFormation = function(req, res){
  if(req.session.role !=='HR' && req.session.role !=='LEADER'){
    return res.send(403,forbidden);
  }
  Campaign.findOne({
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
  Campaign.findOne({
      '_id':id
    })
    .populate('photo_album')
    .exec(function(err, competition){
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

  Campaign.findOne({'_id' : competition_id}, function (err, competition) {
    if(err) {
      console.log(err);
      res.send(err);
    } else {
      //本组的index
      var _campFlag,_otherCampFlag;
      if(req.session.role ==='HR'){
        _campFlag = req.user._id.toString() === competition.camp[0].cid.toString() ? 0 : 1;
        _otherCampFlag = req.user._id.toString() === competition.camp[0].cid.toString() ? 1 : 0;
      }
      else{
        _campFlag = req.user.cid.toString() === competition.camp[0].cid.toString() ? 0 : 1;
        _otherCampFlag = req.user.cid.toString() === competition.camp[0].cid.toString() ? 1 : 0;
      }
      competition.camp[_campFlag].result.confirm = true;
      if(!rst_accept) {
        competition.camp[_campFlag].score = score_a;
        competition.camp[_otherCampFlag].score = score_b;
        competition.camp[_otherCampFlag].result.confirm = false;
        competition.camp[_campFlag].result.content = rst_content;
        competition.camp[_campFlag].result.start_date = new Date();
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
    var nav_logo, nav_name;
    if (req.session.role === 'HR' || req.session.role === 'GUESTHR') {
      nav_logo = req.user.info.logo;
      nav_name = req.user.info.name;
    } else {
      nav_logo = req.user.photo;
      nav_name = req.user.nickname;
    }

    res.render('group/editLogo', {
      logo: company_group.logo,
      nav_logo: nav_logo,
      nav_name: nav_name,
      id: company_group._id,
      role: req.session.role
    });
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
  .sort('-start_time')
  .exec()
  .then(function(campaigns) {
    model_helper.sendCampaignsForApp(user, campaigns, res);
  })
  .then(null, function(err) {
    console.log(err);
    res.send({ result: 0, msg: '获取活动列表失败' });
  });



};


