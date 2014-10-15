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
    mime = require('mime'),
    model_helper = require('../helpers/model_helper'),
    schedule = require('../services/schedule'),
    message = require('../controllers/message'),
    push = require('../controllers/push'),
    photo_album_controller = require('./photoAlbum');

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
  if(req.role ==='GUESTHR' || req.role ==='GUEST'){
    res.status(403);
    next('forbidden');
    return;
  }
  res.render('partials/member_list',{'role':req.role,'provider':'company'});
};


exports.renderInfo = function (req, res) {
  res.render('group/group_info',{'role':req.role});
};

//激活小队
exports.activateGroup = function(req, res) {
  if(req.role==='HR'){
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
  }
  else{
    res.status(403);
    next('forbidden');
    return;
  }
};


//小队信息维护 TODO
exports.info =function(req,res) {
  var entity_type = req.companyGroup.entity_type;

  if (entity_type === 'virtual') {
    return res.send({
      'companyGroup': req.companyGroup,
      'role': req.role
    });
  }

  try {
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
                  'entity': entity,                   //实体小队信息
                  'role': req.role
              });
          }
      });
  } catch (e) {
    console.log(e);
    return res.send(500);
  }

};
exports.teampagetemplate =function(req,res){
  // var cid = req.user.provider=='company'? req.user._id :req.user.cid;
  res.render('partials/team_integrate_page',{
    // 'role':req.role,
    // 'cid':cid
  });
};
//小队聚合首页 TODO
exports.teampage = function(req, res) {
  if (req.companyGroup.department) {
    return res.redirect('/department/home/' + req.companyGroup.department);
  }
  moment.lang('zh-cn');
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
    function(photo_album_thumbnails, callback){
      var teamMoreInfo = {};
      //todo add photo here
      teamMoreInfo.photo_album_thumbnails = photo_album_thumbnails;


      Campaign.find({'team':req.params.teamId, 'active':true})
        .where('end_time').gt(new Date())
        .sort('-create_time')
        .limit(1)
        .exec()
        .then(function(campaign){
            //todo
            // console.log(campaign[0]);
            if(campaign.length==0){
                teamMoreInfo.campaign = '';
            }else{
              teamMoreInfo.campaign = campaign[0];
            }
            callback(null, teamMoreInfo);
        });

    },
    function(teamMoreInfo, callback) {

      res.render('group/teampage',{
        'title': req.companyGroup.name,
        'teamId' : req.params.teamId,
        'tname': req.companyGroup.name,
        'number': req.companyGroup.member ? req.companyGroup.member.length : 0,
        'score': req.companyGroup.score ? req.companyGroup.score.member + req.companyGroup.score.campaign + req.companyGroup.score.participator + req.companyGroup.score.album + req.companyGroup.score.provoke + req.companyGroup.score.comment : 0,
        'role': req.role,
        'logo': req.companyGroup.logo,
        'group_id': req.companyGroup._id,
        'cname': req.companyGroup.cname,
        'sign': req.companyGroup.brief,
        'gid' : req.companyGroup.gid,
        'cid' : cid,
        'photo': req.user.photo,
        'realname':req.user.realname,
        'photo_album_thumbnails': teamMoreInfo.photo_album_thumbnails,
        'home_court': req.companyGroup.home_court,
        'campaign':teamMoreInfo.campaign,
        'moment': moment
      });
    }
  ], function(err, result) {
    console.log(err);
    if (err === 'not found') res.send(404);
    else res.send(500);
  });

};



//根据tid返回team
exports.getOneTeam = function(req, res) {
  var tid = req.body.tid;
  CompanyGroup.findOne({
    '_id':tid
  },function(err, team){
    if (err || !team) {
      console.log('err');
      return res.send();
    } else{
        return res.send(team);
    }
  });
};

exports.getSimiliarTeams = function(req,res) {
  if(req.user.cid.toString()===req.companyGroup.cid.toString()){//同公司
    CompanyGroup.find({'cid':req.user.cid,'leader._id':req.user._id,'gid':{'$ne':'0'}},{'logo':1,'member':1,'name':1},function(err, companyGroups){
      if(err){
        console.log(err);
        return res.send([]);
      }
      else{
        return res.send(companyGroups);
      }
    });
  }
  else{//同类型
    CompanyGroup.find({'cid':req.user.cid,'gid':req.companyGroup.gid,'leader._id':req.user._id},{'logo':1,'member':1,'name':1},function(err, companyGroups){
      if(err){
        console.log(err);
        return res.send([]);
      }
      else
       return res.send(companyGroups);
    });
  }
};

//TODO
exports.saveInfo =function(req,res) {
  if(req.role !=='HR' && req.role !=='LEADER'){
    res.status(403);
    next('forbidden');
    return;
  }
  var teamId = req.params.teamId;
  CompanyGroup.findOne({'_id' : teamId}, function(err, companyGroup) {
      if (err) {
          console.log('err');
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
          companyGroup.home_court = req.body.homecourt;
          companyGroup.save(function (s_err){
              if(s_err){
                  console.log(s_err);
                  return res.send({'result':0,'msg':'数据保存错误'});
              }
              if(newNameFlag){
                schedule.updateTname(teamId);
              }
              res.send({'result':1,'msg':'更新成功'});
          });
      } else {
          res.send({'result':0,'msg':'不存在组件！'});
      }
  });
};
//小队信息维护
exports.timeLine = function(req, res){
  var teamId = req.params.teamId;
  Campaign
  .find({ 'active':true,'finish':true,'team': teamId})
  .sort('-start_time')
  .populate('team').populate('cid').populate('photo_album')
  .exec()
  .then(function(campaigns) {
      // todo new time style
      var newTimeLines = [];
      // todo new time style
      campaigns.forEach(function(campaign) {


        var _head,_logo;
        if(campaign.camp.length>0){
          _head = campaign.camp[0].name +'对' + campaign.camp[1].name +'的比赛';
          _logo = campaign.camp[0].id ==teamId ? campaign.camp[0].logo:campaign.camp[1].logo ;
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
          photo_list: photo_album_controller.photoThumbnailList(campaign.photo_album, 6)
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
        if (newTimeLines.length==0||newTimeLines[newTimeLines.length-1][0].year!=groupYear) {
          newTimeLines.push([]);
          newTimeLines[newTimeLines.length-1].push(tempObj);
        }else{
          var i = newTimeLines.length-1;
          newTimeLines[i].push(tempObj);
        }
      });
      return res.render('partials/timeLine',{'newTimeLines': newTimeLines,'length':campaigns.length,'moment': moment});
      // // todo new time style
      // console.log(newTimeLines);
      //console.log(newTimeLines);
      // // todo new time style
  })
  .then(null, function(err) {
    console.log(err);
    return res.send({result:0,msg:'查询错误'});
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
      if(req.role==='HR' || req.role ==='GUESTHR'){
        res.render('group/home', {
          'title': req.companyGroup.name,
          'role': req.role,
          'teamId' : req.params.teamId,
          'tname': req.companyGroup.name,
          'number': req.companyGroup.member ? req.companyGroup.member.length : 0,
          'score': req.companyGroup.score ? (req.companyGroup.score.member +  req.companyGroup.score.campaign +req.companyGroup.score.provoke +req.companyGroup.score.participator +req.companyGroup.score.comment +req.companyGroup.score.album) : 0,
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
        var myteam = req.user.team;
        var _myteam = [];
        var myteamLength= myteam.length;
        for(var i = 0; i < myteamLength; i ++) {
          if(myteam[i].gid !== '0'){
            //下面查找的是该成员加入和未加入的所有active小队
            if(myteam[i].leader) {
              //判断此人是否是此队队长，并作标记
              _myteam.unshift({
                _id:myteam[i]._id,
                name:myteam[i].name,
                logo:myteam[i].logo,
                leader:myteam[i].leader
              });
            }
            else{
              _myteam.push({
                _id:myteam[i]._id,
                name:myteam[i].name,
                logo:myteam[i].logo,
                leader:myteam[i].leader
              });
            }
          }
        }

        res.render('group/home',{
          'title': req.companyGroup.name,
          'myteam': _myteam,
          'teamId' : req.params.teamId,
          'tname': req.companyGroup.name,
          'number': req.companyGroup.member ? req.companyGroup.member.length : 0,
          'score': req.companyGroup.score ? (req.companyGroup.score.member +  req.companyGroup.score.campaign +req.companyGroup.score.provoke +req.companyGroup.score.participator +req.companyGroup.score.comment +req.companyGroup.score.album) : 0,
          'role': req.role,
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
    }
  ], function(err, result) {
    console.log(err);
    if (err === 'not found') res.send(404);
    else res.send(500);
  });

};
//返回公司小队的所有数据,员工选择组件时使用
exports.getCompanyGroups = function(req, res) {
  CompanyGroup.find({cid : req.params.companyId},{'gid':1,'group_type':1,'entity_type':1,'name':1,'logo':1}, function(err, teams) {
    if(err || !teams) {
      return res.send([]);
    } else {
      return res.send({
        'teams':teams
      });
    }
  });
};

exports.renderCampaigns = function(req,res){
  if(req.role ==='GUESTHR' || req.role ==='GUEST'){
    res.status(403);
    next('forbidden');
    return;
  }
  res.render('partials/campaign_list',{'role':req.role,'provider':'team'});
}
//约战
exports.provoke = function (req, res) {
  if(req.role !=='HR' && req.role !=='LEADER' && req.role !=='GUESTLEADER' && req.role !=='MEMBERLEADER' && req.role !=='PARTNERLEADER'){
    res.status(403);
    next('forbidden');
    return;
  }

  var my_team_id = req.params.teamId;
  CompanyGroup.findOne({'_id':req.body.team_opposite_id},{'cid':1,'gid':1,'name':1,'logo':1,'leader':1},function(err,team){
    if(err || !team){
      console.log(err);
      return res.send(500,'error');
    }
    else{
      var start_time = req.body.start_time;
      var end_time = req.body.end_time;
      var deadline = req.body.deadline ? req.body.deadline : end_time;
      var _now = new Date();
      if (start_time < _now || end_time < _now || deadline < _now ) {
        return res.send({'result':0,'msg':'活动的时间比现在更早'});
      }
      var team_opposite = team;
      var theme = req.body.theme;
      var location = req.body.location;
      var content = req.body.content;
      var member_min = req.body.member_min;
      var member_max = req.body.member_max;
      var competition = new Campaign();
      var cid = req.user.provider==="company" ? req.user._id : req.user.cid;
      var cname = req.user.provider==="company" ? req.user.info.name : req.user.cname;
      var type = 0;
      if(team_opposite.cid === req.companyGroup.cid){//同公司
        if(team_opposite.gid === req.companyGroup.gid)//同类型
          type= 4;
        else//同公司不同类型
          type =3
      }
      else{
        type =5;//挑战公司外小组
      }
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
        'gid': team_opposite.gid
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
      competition.campaign_type=type;
      competition.tags = req.body.tags;
      competition.poster.cname = cname;
      competition.poster.cid = cid;
      if(req.role==='PARTNERLEADER' || req.role === 'GUESTLEADER' || req.role ==='MEMBERLEADER')
        competition.poster.role = 'LEADER'
      else
        competition.poster.role = req.role;
      if(competition.poster.role==='LEADER'){
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
      photo_album.save(function(err){
        if(!err){
          competition.photo_album = photo_album._id;

          competition.save(function(err){
            if(!err){
              var groupMessage = new GroupMessage();
              if(type===4||type ===5)
                groupMessage.message_type = 4;
              else if(type === 3)
                groupMessage.message_type = 9;
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

                      CompanyGroup.update({'_id':my_team_id},{'$inc':{'score.provoke':5}},function (err,team){
                        if(err){
                          console.log('RESPONSE_PROVOKE_POINT_FAILED!',err);
                        }
                      });
                      // var provoke = team.score.provoke;
                      // var campaign = team.score.campaign;
                      // var member = team.score.member;
                      // var participator = team.score.participator;
                      // var comment = team.score.comment;
                      // var album = team.score.album;

                      // provoke = (provoke == undefined || provoke == null) ? 0 : (provoke + 5);
                      // campaign = (campaign == undefined || campaign == null) ? 0 : campaign;
                      // member = (member == undefined || member == null) ? 0 : member;
                      // participator = (participator == undefined || participator == null) ? 0 : participator;
                      // comment = (comment == undefined || comment == null) ? 0 : comment;
                      // album = (album == undefined || album == null) ? 0 : album;

                      // team.score = {
                      //   'provoke':provoke,
                      //   'campaign':campaign,
                      //   'member':member,
                      //   'participator':participator,
                      //   'comment':comment,
                      //   'album':album
                      // }

                      //console.log(team.score);

                      team.save(function(err){
                        console.log('PROVOKE_POINT_FAILED!',err);
                      });
                      if(team_opposite.leader.length > 0){
                        var param = {
                          'specific_type':{
                            'value':4,
                            'child_type':0
                          },
                          'type':'private',
                          'caption':competition.theme,
                          'own':{
                            '_id':req.user._id,
                            'nickname':req.user.nickname,
                            'photo':req.user.photo,
                            'role':'LEADER'
                          },
                          'receiver':{
                            '_id':team_opposite.leader[0]._id
                          },
                          'content':null,
                          'own_team':{
                            '_id':my_team_id,
                            'name':req.companyGroup.name,
                            'logo':req.companyGroup.logo,
                            'status':0
                          },
                          'receive_team':{
                            '_id':team_opposite._id,
                            'name':team_opposite.name,
                            'logo':team_opposite.logo,
                            'status':0
                          },
                          'campaign_id':competition._id,
                          'auto':true
                        };
                        message.sendToOne(req,res,param);      //挑战的站内信只要发给队长一个人即可
                      }
                  return res.send({'result':0,'msg':'SUCCESS'});
                }
              });
            }else{
              console.log(err);
              return res.send({'result':0,'msg':'ERROR'});
            }
          });
        }
      });

    }
  });
};


//应约
exports.responseProvoke = function (req, res) {
  if(req.role !=='HR' && req.role !=='LEADER'){
    res.status(403);
    next('forbidden');
    return;
  }
  var competition_id = req.body.competition_id;
  Campaign.findOne({
      '_id' : competition_id
    }).populate('team').exec(
  function (err, campaign) {
    if(campaign.camp[1].id!=req.params.teamId){
      res.status(403);
      next('forbidden');
      return;
    }
    if(req.body.responseStatus){
      campaign.camp[1].start_confirm = true;
      campaign.active = true;
    }
    else{
      campaign.camp[0].start_confirm = false;
    }

    //还要存入应约方的公司名、队长用户名、真实姓名等
    campaign.save(function (err) {
      if (err) {
        res.send(err);
        return res.send({'result':0,'msg':'应战失败！'});
      }
      else{
        var rst = campaign.team;
        push.campaign(competition_id);
        if(req.body.responseStatus){
          GroupMessage.findOne({campaign:campaign._id}).exec(function(err,groupMessage){
            groupMessage.message_type = 5;
            groupMessage.create_time = new Date();
            groupMessage.save(function (err) {
              if (err) {
                console.log('保存约战动态时出错' + err);
              }
            });
          });
        }
        var param = {
          'specific_type':{
            'value':4,
            'child_type':req.body.responseStatus ? 1 : 2
          },
          'type':'private',
          'caption':campaign.theme,
          'own':{
            '_id':req.user._id,
            'nickname':req.user.nickname,
            'photo':req.user.photo,
            'role':'LEADER'
          },
          'receiver':{
            '_id':rst[0].leader[0]._id
          },
          'content':null,
          'own_team':{
            '_id':rst[1]._id,
            'name':rst[1].name,
            'logo':rst[1].logo,
            'status': req.body.responseStatus ? 1 : 4
          },
          'receive_team':{
            '_id':rst[0]._id,
            'name':rst[0].name,
            'logo':rst[0].logo,
            'status': req.body.responseStatus ? 1 : 4
          },
          'campaign_id':campaign._id,
          'auto':true
        };
        message.sendToOne(req,res,param);
        CompanyGroup.update({'_id':{'$in':[rst[0]._id,rst[1]._id]}},{'$inc':{'score.provoke':15}},function (err,team){
          if(err){
            console.log('RESPONSE_PROVOKE_POINT_FAILED!',err);
          }
        });
        return res.send({'result':1,'msg':'SUCCESS'});
      }
    });
  });
};
//取消挑战
exports.cancelProvoke = function (req, res) {
  if(req.role !=='HR' && req.role !=='LEADER'){
    res.status(403);
    next('forbidden');
    return;
  }
  var competition_id = req.body.competition_id;
  Campaign.findOne({
      '_id' : competition_id
    }).populate('team').exec(
  function (err, campaign) {
    if(campaign.camp[0].id!=req.params.teamId){
      res.status(403);
      next('forbidden');
      return;
    }
    campaign.camp[0].start_confirm = false;

    //还要存入应约方的公司名、队长用户名、真实姓名等
    campaign.save(function (err) {
      if (err) {
        res.send(err);
        return res.send({'result':0,'msg':'应战失败！'});
      }
      else{
        var rst = campaign.team;
        var param = {
          'specific_type':{
            'value':4,
            'child_type':3
          },
          'type':'private',
          'caption':campaign.theme,
          'own':{
            '_id':req.user._id,
            'nickname':req.user.nickname,
            'photo':req.user.photo,
            'role':'LEADER'
          },
          'receiver':{
            '_id':rst[1].leader[0]._id
          },
          'content':null,
          'own_team':{
            '_id':rst[0]._id,
            'name':rst[0].name,
            'logo':rst[0].logo,
            'status':5
          },
          'receive_team':{
            '_id':rst[1]._id,
            'name':rst[1].name,
            'logo':rst[1].logo,
            'status':5
          },
          'campaign_id':campaign._id,
          'auto':true
        };
        message.sendToOne(req,res,param);
        CompanyGroup.update({'_id':rst[0]._id},{'$inc':{'score.provoke':-15}},function (err,team){
          if(err){
            console.log('CANCEL_PROVOKE_POINT_FAILED!',err);
          }
        });
        return res.send({'result':1,'msg':'SUCCESS'});
      }
    });
  });
};

//获取小队热门标签
exports.getTags = function (req, res) {
  Campaign.aggregate()
  .project({"tags":1,"team":1,"camp.id":1})
  .match({'$or': [
    {'team' : mongoose.Types.ObjectId(req.params.teamId)},
    {'camp.id' : mongoose.Types.ObjectId(req.params.teamId)}
    ]})//可在查询条件中加入时间
  .unwind("tags")
  .group({_id : "$tags", number: { $sum : 1} })
  .sort({number:-1})
  .limit(10)
  .exec(function(err,result){
      if (err) {
        console.log(err);
      }
      else{
        // console.log(result);
        return res.send(result);
      }
  });
};

//发布和小队相关的活动
exports.sponsor = function (req, res) {
  if(req.role !=='HR' && req.role !=='LEADER'){
    res.status(403);
    next('forbidden');
    return;
  }
  var theme = req.body.theme;
  var content = req.body.content;//活动内容
  var location = req.body.location;//活动地点
  var multi = false;

  var cid = req.role ==='HR' ? req.user._id : req.user.cid;
  var cname = req.role ==='HR' ? req.user.info.name : req.user.cname;
  var tname;
  var member_min = req.body.member_min ? req.body.member_min : 0;
  var member_max = req.body.member_max ? req.body.member_max : 0;
  var start_time = req.body.start_time;
  var end_time = req.body.end_time;
  var deadline = req.body.deadline ? req.body.deadline : end_time;
  var _now = new Date();
  if (start_time < _now || end_time < _now || deadline < _now ) {
    return res.send({'result':0,'msg':'活动的时间比现在更早'});
  }
  //生成活动
  var campaign = new Campaign();
  var tids = [];
  if(req.params.teamId != null && req.params.teamId != undefined && req.params.teamId != ""){
    multi = false;
    tname = req.companyGroup.name;
    var tid = req.params.teamId;
    tids = [req.params.teamId];
    campaign.team.push(tid);
  }else{
    multi = true;
    for(var i = 0; i < req.body.select_teams.length; i ++){
      tids.push(req.body.select_teams[i]._id);
      campaign.team.push(req.body.select_teams[i]._id);
    }
  }

  campaign.cid =[cid];//其实只有一个公司
  campaign.cname =[cname];
  campaign.poster.cname = cname;
  campaign.poster.cid = cid;
  campaign.poster.role = req.role;
  campaign.poster.tname = tname;
  if(req.role==='LEADER'){
    campaign.poster.uid = req.user._id;
    campaign.poster.nickname = req.user.nickname;
  }
  campaign.member_min = member_min;
  campaign.member_max = member_max;

  campaign.content = content;
  campaign.location = location;
  campaign.theme = theme;
  campaign.active = true;
  campaign.campaign_type = !multi ? 2 : 3;
  if(req.body.tags.length>0)
    campaign.tags = req.body.tags;

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
      teams: tids
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
        //触发推送服务
        push.campaign(campaign._id);
        if(!multi){
          req.companyGroup.photo_album_list.push(photo_album._id);
          req.companyGroup.save(function(err) {
            if (err) {
              //res.send(500);
              return res.send({'result':0,'msg':'FAILURED'});
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
                  return res.send({'result':1,'msg':'SUCCESS'});
                }
              });
            }
          });
        }else{
          var i = 0;;
          async.whilst(
            function() { return i < tids.length},
            function(__callback){
              CompanyGroup.update({'_id':tids[i]},{'$push':{'photo_album_list':photo_album._id}},function(err,team){
                if(err || !team){
                  console.log('小队相册加入失败',err,team);
                }else{
                  i++;
                  __callback();
                }
              })
            },
            function(err){
              if(err){
                console.log('MULTI_CAMPAIGN_CAMPAIGN',err);
                return res.send({'result':0,'msg':'FAILURED'});
              }else{
                //生成动态消息
                var groupMessage = new GroupMessage();
                groupMessage.message_type = 1;
                groupMessage.company = {
                  cid : cid,
                  name : cname
                };
                for(var i = 0; i < req.body.select_teams.length; i ++){
                  groupMessage.team.push({
                    'teamid':req.body.select_teams[i]._id,
                    'name':req.body.select_teams[i].name,
                    'logo':req.body.select_teams[i].logo
                  });
                }
                groupMessage.campaign = campaign._id;
                groupMessage.save(function (err) {
                  if (err) {
                    console.log('MULTI_CAMPAIGN_GROUPMESSAGE_ERROR',err);
                  } else {
                    return res.send({'result':1,'msg':'SUCCESS'});
                  }
                });
              }
            }
          );
        }
      }
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
  if(req.role ==='GUESTHR' || req.role ==='GUEST'){
    res.status(403);
    next('forbidden');
    return;
  }
  var options ={
    'title': '比赛页面',
    'competition' : req.competition,
    'team': req.competition_team,
    'role': req.role,
    'msg_show': false,
    'score_a': "",
    'score_b': "",
    'rst_content': "",
    'moment':moment,
    'confirm_btn_show':false,
    'photo_thumbnails': photo_album_controller.photoThumbnailList(req.competition.photo_album, 4)
  };
  var nowTeamIndex,otherTeamIndex;
  if(req.role==='HR'){
    nowTeamIndex = req.competition.camp[0].cid.toString() === req.user._id.toString() ? 0:1;
    otherTeamIndex = req.competition.camp[0].cid.toString() === req.user._id.toString() ? 1:0;
  }
  else{
    nowTeamIndex = req.competition.camp[0].cid.toString() === req.user.cid.toString() ? 0:1;
    otherTeamIndex = req.competition.camp[0].cid.toString() === req.user.cid.toString() ? 1:0;
  }
  if((req.role==='HR' || req.role ==='LEADER') && req.competition.camp[otherTeamIndex].result.confirm && !req.competition.camp[nowTeamIndex].result.confirm) {
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
  if(req.role !=='HR' && req.role !=='LEADER'){
    res.status(403);
    next('forbidden');
    return;
  }
  Campaign.findOne({
    '_id':req.params.competitionId
  }).exec(function(err, competition){
    var camp_index = model_helper.arrayObjectIndexOf(req.campaign.camp,req.companyGroup._id,'id');
    if(camp_index>-1){
      var _formation = [];
      var _tempFormation = req.body.formation;
      for (var member in _tempFormation){
        if(model_helper.arrayObjectIndexOf(req.campaign.camp[camp_index].member,member,'uid')>-1){
          _formation.push({'uid':member,
            'x':_tempFormation[member].x,
            'y':_tempFormation[member].y
          });
        }

      }
      competition.camp[camp_index].formation = _formation;
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
  if(req.role !=='HR' && req.role !=='LEADER'){
    res.status(403);
    next('forbidden');
    return;
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
      if(req.role ==='HR'){
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
  CompanyGroup.findById(id).exec()
  .then(function (company_group) {
    if (!company_group) {
      return next(new Error(' Failed to load companyGroup ' + id));
    } else {
      // may equal false
      if (company_group.department == undefined && company_group.department == null) {
        mongoose.model('Department').findOne({
          team: company_group._id
        }).exec()
        .then(function (department) {
          if (!department) {
            company_group.department = false;
          } else {
            company_group.department = department._id;
          }
          company_group.save(function (err) {
            if (err) {
              return next(err);
            } else {
              req.companyGroup = company_group;
              next();
            }
          });
        })
        .then(null, function (err) {
          next(err);
        });
      } else {
        req.companyGroup = company_group;
        next();
      }
    }
  })
  .then(null, function (err) {
    next(err);
  });
};



exports.uploadFamily = function(req, res) {
  if (req.role !== 'LEADER' && req.role !== 'HR') {
    res.status(403);
    next('forbidden');
    return;
  }

  var width = Number(req.body.width);
  var height = Number(req.body.height);
  var req_x = Number(req.body.x);
  var req_y = Number(req.body.y);
  if (isNaN(width + height + req_x + req_y)) {
    return res.send(400);
  }
  CompanyGroup
  .findById(req.params.teamId)
  .exec()
  .then(function(company_group) {
    if (!company_group) {
      throw 'not found';
    }
    var ext = mime.extension(req.files.family.type);
    var family_photo = req.files.family;
    var family_dir = '/img/group/family/';
    var photo_name = Date.now().toString() + '.' + ext;
    try{
      gm(family_photo.path).size(function(err, value) {
        if (err) {
          console.log(err);
          return res.send(500);
        }
        // req.body参数均为百分比
        var w = width * value.width;
        var h = height * value.height;
        var x = req_x * value.width;
        var y = req_y * value.height;

        gm(family_photo.path)
        .crop(w, h, x, y)
        .resize(800, 450)
        .write(path.join(meanConfig.root, 'public', family_dir, photo_name), function(err) {
          if (err) {
            console.log(err);
            return res.send(500);
          }

          var user = {
            _id: req.user._id
          };
          if (req.user.provider === 'company') {
            user.name = req.user.info.name;
            user.photo = req.user.info.logo;
          } else if (req.user.provider === 'user') {
            user.name = req.user.nickname;
            user.photo = req.user.photo;
          }

          company_group.family.push({
            uri: path.join(family_dir, photo_name),
            upload_user: user
          });

          // var length = 0;
          // var first_index = 0, get_first = false;
          // for (var i = 0; i < company_group.family.length; i++) {
          //   if (company_group.family[i].hidden === false) {
          //     if (get_first === false) {
          //       first_index = i;
          //       get_first = true;
          //     }
          //     length++;
          //   }
          // }
          // if (length > 3) {
          //   company_group.family[first_index].hidden = true;
          // }

          company_group.save(function(err) {
            if (err) {
              console.log(err);
              res.send(500);
            } else {
              res.send(200);
            }
          });
        });
      });

    } catch (e) {
      console.log(e);
      res.send(500);
    }

  })
  .then(null, function(err) {
    console.log(err);
    res.send(500);
  });
};


exports.getFamily = function(req, res) {

  var company_group = req.companyGroup;

  // 如果要限制长度，则取消注释
  // var length = 0;
  var res_data = [];
  for (var i = 0; i < company_group.family.length; i++) {
    if (company_group.family[i].hidden === false) {
      res_data.push(company_group.family[i]);
      // length++;
      // if (length >= 3) {
      //   break;
      // }
    }
  }
  res.send(res_data);
};

exports.toggleSelectFamilyPhoto = function(req, res) {
  if (req.role !== 'LEADER' && req.role !== 'HR') {
    res.status(403);
    next('forbidden');
    return;
  }
  var company_group = req.companyGroup;

  for (var i = 0; i < company_group.family.length; i++) {
    if (company_group.family[i]._id.toString() === req.params.photoId) {
      if (!company_group.family[i].select) {
        company_group.family[i].select = true;
      } else {
        company_group.family[i].select = false;
      }
      break;
    }
  }
  company_group.save(function(err) {
    if (err) {
      console.log(err);
      return res.send(500);
    }
    res.send(200);
  });
};

exports.deleteFamilyPhoto = function(req, res) {
  if (req.role !== 'LEADER' && req.role !== 'HR') {
    res.status(403);
    next('forbidden');
    return;
  }

  var company_group = req.companyGroup;

  for (var i = 0; i < company_group.family.length; i++) {
    if (company_group.family[i]._id.toString() === req.params.photoId) {
      company_group.family[i].hidden = true;
      break;
    }
  }
  company_group.save(function(err) {
    if (err) {
      console.log(err);
      return res.send(500);
    }
    res.send(200);
  });

};

exports.editLogo = function(req, res) {
  if(req.role !=='HR' && req.role !=='LEADER'){
    res.status(403);
    next('forbidden');
    return;
  }
  CompanyGroup.findOne({ _id: req.params.teamId  }).exec(function(err, company_group) {
    var nav_logo, nav_name;
    if (req.role === 'HR' || req.role === 'GUESTHR') {
      nav_logo = req.user.info.logo;
      nav_name = req.user.info.name;
    } else {
      nav_logo = req.user.photo;
      nav_name = req.user.nickname;
    }

    res.render('group/edit_logo', {
      logo: company_group.logo,
      nav_logo: nav_logo,
      nav_name: nav_name,
      id: company_group._id,
      role: req.role
    });
  });

};






exports.getCampaignsForApp = function(req, res) {
  if(req.role ==='GUESTHR' || req.role ==='GUEST'){
    res.status(403);
    next('forbidden');
    return;
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


