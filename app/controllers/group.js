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
    auth = require('../services/auth'),
    model_helper = require('../helpers/model_helper'),
    schedule = require('../services/schedule'),
    message = require('../controllers/message'),
    push = require('../controllers/push'),
    photo_album_controller = require('./photoAlbum'),
    campaign_controller = require('./campaign');

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
exports.renderMember = function(req,res,next){
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


exports.info =function(req, res) {
  var team = req.companyGroup;
  // todo 作权限判断，以便在页面上呈现或隐藏一些操作
  // 是否可以编辑
  // 是否可以修改全家福？（待定）
  var tasks = [
    'joinTeam',
    'quitTeam',
    'closeTeam',
    'editTeam',
    'sponsorCampaign',
    'sponsorProvoke',
    'publishTeamMessage'
  ];
  var allow = auth(req.user, {
    companies: [team.cid],
    teams: [team._id]
  }, tasks);

  if (team.department) {
    allow.joinTeam = false;
    allow.quitTeam = false;
    allow.sponsorProvoke = false;
  }

  // 从members中去除leader
  var membersWithoutLeader = [];
  team.member.forEach(function (member) {
    var isLeader = false;
    for (var i = 0; i < team.leader.length; i++) {
      var leader = team.leader[i];
      if (leader._id.toString() === member._id.toString()) {
        isLeader = true;
        break;
      }
    }
    if (!isLeader) {
      membersWithoutLeader.push(member);
    }
  });

  // 设置主场，目的是为了避免在页面做过多的逻辑判断
  // 注意，此处必须使用===比较，department属性有可能是null或undefined，此时是无效的数据
  // 只有为false或是一个ObjectId时才是有效数据
  var homeCourts = [];
  var isShowHomeCourts = true;
  if (team.department === false) {
    team.home_court.forEach(function (homeCourt) {
      homeCourts.push(homeCourt);
    });
    switch (homeCourts.length) {
    case 0:
      homeCourts = [{
        defaultImg: '/img/no_home_court.png'
      }, {
        defaultImg: '/img/no_home_court.png'
      }]; // 之所以这么麻烦，是因为之前两个默认的主场是不一样的
      break;
    case 1:
      homeCourts.push({
        defaultImg: '/img/no_home_court.png'
      });
      break;
    }
  } else {
    isShowHomeCourts = false;
  }

  // 考虑安全性和数据量的问题，不把整个companyGroup原封不动地写入响应，而是按需取需要的字段
  var briefTeam = {
    name: team.name,
    logo: team.logo,
    groupType: team.group_type,
    createTime: team.create_time,
    brief: team.brief,
    leaders: team.leader,
    members: membersWithoutLeader,
    homeCourts: homeCourts,
    familyPhotos: team.family.filter(function (photo) {
      return !photo.hidden && photo.select;
    })
  };

  // 根据页面显示需要，获取用户相对于小队页面的角色
  // todo 加入权限系统中，使用权限系统的获取角色的方法
  var role = 'guest'; // 'HR', 'companyMember', 'teamMember', 'leader', 'otherHR', 'otherLeader', 'otherMember', 'guest'
  if (!req.user) {
    role = 'guest';
  } else if (req.user.provider === 'company') {
    if (req.user._id.toString() === team.cid.toString()) {
      role = 'HR';
    } else {
      role = 'otherHR';
    }
  } else if (req.user.provider === 'user') {
    if (req.user.cid.toString() === team.cid.toString()) {
      if (req.user.isTeamLeader(team._id)) {
        role = 'leader';
      } else if (req.user.isTeamMember(team._id)) {
        role = 'teamMember';
      } else {
        role = 'companyMember';
      }
    } else {
      if (req.user.isLeader()) {
        role = 'otherLeader';
      } else {
        role = 'otherMember';
      }
    }
  }

  res.send({
    result: 1,
    team: briefTeam,
    allow: allow,
    isShowHomeCourts: isShowHomeCourts,
    role: role
  });
};

exports.teampagetemplate =function(req,res){
  // var cid = req.user.provider=='company'? req.user._id :req.user.cid;
  res.render('partials/team_integrate_page',{
    // 'role':req.role,
    // 'cid':cid
  });
};

exports.teampage = function(req, res) {

  var team = req.companyGroup;
  // 仅提供id，其它所有数据通过group.info获取
  res.render('group/team', { teamId: team._id, groupId: team.gid });

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


exports.getLedTeams = function(req,res) {
  if(!req.params.teamId||req.user.cid.toString()===req.companyGroup.cid.toString()){//同公司
    var options = {'cid':req.user.cid,'leader._id':req.user._id,'gid':{'$ne':'0'}};
  }
  else{//同类型
    var options = {'cid':req.user.cid,'gid':req.companyGroup.gid,'leader._id':req.user._id};
  }
  CompanyGroup.find(options,{'logo':1,'member':1,'name':1},function(err, companyGroups){
    if(err){
      console.log(err);
      return res.send({'result':0,'msg':'获取带领'});
    }
    else
     return res.send({'result':1,'teams':companyGroups});
  });
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
          if(req.body.name && companyGroup.name !== req.body.name){
            companyGroup.name = req.body.name;
            newNameFlag =true;
          }
          if (req.body.brief) {
            companyGroup.brief = req.body.brief;
          }
          if (req.body.home_court) {
            companyGroup.home_court = req.body.homecourt;
          }
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
  .find({ 'active':true,'finish':true,'tid': teamId})
  .sort('-start_time')
  .populate('photo_album')
  .exec()
  .then(function(campaigns) {
      // todo new time style
      var newTimeLines = [];
      // todo new time style
      campaigns.forEach(function(campaign) {
        var ct = campaign.campaign_type;
        //反正logo都是这个小队的……
        var _logo = req.companyGroup.logo;
      
        var tempObj = {
          id: campaign._id,
          //head: _head,
          head:campaign.theme,
          logo:_logo,
          content: campaign.content,
          location: campaign.location,
          group_type: campaign.group_type,
          start_time: campaign.start_time,
          provoke:ct===4||ct===5||ct===7||ct===9,
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
  // if(req.role !=='HR' && req.role !=='LEADER' && req.role !=='GUESTLEADER' && req.role !=='MEMBERLEADER' && req.role !=='PARTNERLEADER'){
  //   res.status(403);
  //   next('forbidden');
  //   return;
  // }
  var my_team_id = req.params.teamId;
  var cid = req.companyGroup.cid
  var allow = auth(req.user, {
    companies: [cid],
    teams: [my_team_id]
  }, [
    'sponsorCampaign'
  ]);
  if(!allow.sponsorCampaign){
    res.status(403);
    next('forbidden');
    return;
  };
  CompanyGroup.findOne({'_id':req.body.team_opposite_id},{'cid':1,'gid':1,'name':1,'logo':1,'leader':1,'photo_album_list':1})
  .populate('cid')
  .exec()
  .then(function(team_opposite){
    var cname = req.companyGroup.cname;
    var type = 0;
    if(team_opposite.cid === req.companyGroup.cid){//同公司
      if(team_opposite.gid === req.companyGroup.gid)//同类型
        type= 4;
      else//同公司不同类型
        type =3
    }
    else
      type =5;//挑战公司外小组
    var _user={
      '_id':req.user._id,
      'name':req.user.provider==='company' ? req.user.info.official_name:req.user.nickname,
      'type':req.user.provider==='company' ? 'hr':'user'
    };
    var photoInfo= {
      owner: {
        model: {
          // _id: campaign._id,
          type: 'Campaign'
        },
        companies: req.companyGroup.cid === team_opposite.cid ? [req.companyGroup.cid] : [req.companyGroup.cid, team_opposite.cid],
        teams: [req.companyGroup._id, team_opposite._id]
      },
      name: moment(req.body.start_time).format("YYYY-MM-DD ") + req.body.theme,
      update_user:_user,
      create_user:_user
    };

    var providerInfo = {
      'tid':[my_team_id,team_opposite._id],
      'cid':req.companyGroup.cid === team_opposite.cid ? [req.companyGroup.cid] : [req.companyGroup.cid, team_opposite.cid],
      'confirm_status':false,
      'poster':{
        cname:cname,
        cid:cid,
        role:req.user.provider==='company'? 'HR':'LEADER',
        tname:req.companyGroup.name,
        uid:req.user.provider==='company'? null:req.user._id,
        nickname: req.user.provider==='company'? null:req.user.nickname
      },
      'campaign_type':type,
      'campaign_unit':[]
    };
    async.waterfall([
      function(callback){
        //查找
        Company.find({'_id':{'$in':providerInfo.cid}},{'info':1},function(err,companies){
          if(err)
            callback('查找失败'+err);
          else{
            callback(null,companies);
          }
        });
      },
      function(companies,callback){
        //己方unit
        providerInfo.campaign_unit.push({
          'company':{
            '_id':companies[0]._id,
            'name':companies[0].info.official_name,
            'logo':companies[0].info.logo
          },
          'team':{
            '_id':req.companyGroup._id,
            'name':req.companyGroup.name,
            'logo':req.companyGroup.logo
          },
          'start_confirm':true
        });
        //对方unit
        providerInfo.campaign_unit.push({
          'company':{//如果查找时providerInfo.cid里的两个cid一样会跪...
            '_id':companies.length ===1?companies[0]._id : companies[1]._id,
            'name':companies.length ===1?companies[0].info.official_name : companies[1].info.official_name,
            'logo':companies.length ===1?companies[0].info.logo : companies[1].info.logo
          },
          'team':{
            '_id': team_opposite._id,
            'name':team_opposite.name,
            'logo':team_opposite.logo
          }
        });
        callback(null,null);
      },
      function(args,callback){
        campaign_controller.newCampaign(req.body,providerInfo,photoInfo,function(status,data){
          if(status){
            callback(data);
          }
          else{
            callback(null,data);
          }
        });
      }
    ],function(err,data){
      if(err){
        return res.send({'result':0,'msg':'挑战发起失败'+err});
      }
      else{
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
        groupMessage.campaign = data.campaign_id;
        groupMessage.save(function (err) {
          if (err) {
            console.log('保存约战动态时出错' + err);
          }else{
            // CompanyGroup.update({'_id':my_team_id},{'$inc':{'score.provoke':5},'$push':{'photo_album_list':data.photo_album_id}},function (err,companyGroup){
            //   if(err){
            //     console.log('RESPONSE_PROVOKE_POINT_FAILED!',err);
            //   }
            // });
            //deleted by M ---积分应该接受了再给~
            team_opposite.photo_album_list.push(data.photo_album_id);
            team_opposite.save(function(err){
              if(err){
                console.log('把相册保存进小队出错' + err);
              }
            })
            if(team_opposite.leader.length > 0){
              var param = {
                'specific_type':{
                  'value':4,
                  'child_type':0
                },
                'type':'private',
                'caption':req.body.theme,
                'own':{
                  '_id':req.user._id,
                  'nickname':req.user.provider==='company'? req.user.info.official_name : req.user.nickname,
                  'photo':req.user.provider==='company'?req.user.info.logo : req.user.photo,
                  'role':req.user.provider==='company'?'HR':'LEADER'
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
                'campaign_id':data.campaign_id,
                'auto':true
              };
              message.sendToOne(req,res,param);      //挑战的站内信只要发给队长一个人即可
            }
            return res.send({'result':1,'campaign_id':data.campaign_id});
          }
        });
      }
    });
  })
  .then(null, function(err) {
    console.log(err);
    return res.send({'result':0,'msg':'ERROR'});
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
exports.sponsor = function (req, res, next) {
  var multi = false;
  var tids = [];
  if(req.params.teamId != null && req.params.teamId != undefined && req.params.teamId != ""){
    var cid = req.companyGroup.cid;
    var cname = req.companyGroup.cname;
    var allow = auth(req.user, {
      companies: [cid],
      teams:[req.params.teamId]
    }, [
      'sponsorCampaign'
    ]);
    if(!allow.sponsorCampaign){
      res.status(403);
      next('forbidden');
      return;
    }
    var tname = req.companyGroup.name;
    multi = false;
    var tid = req.params.teamId;
    tids = [req.params.teamId];
  }else{
    var cid = req.params.cid;
    var allow = auth(req.user, {
      companies: [cid],
    }, [
      'sponsorCampaign'
    ]);
    if(!allow.sponsorCampaign){
      res.status(403);
      next('forbidden');
      return;
    }
    var cname = req.user.info.official_name;
    multi = true;
    for(var i = 0; i < req.body.select_teams.length; i ++){
      tids.push(req.body.select_teams[i]._id);
    }
  }
  var photoInfo= {
    owner: {
      model: {
        // _id: campaign._id,
        type: 'Campaign'
      },
      companies: [cid],
      teams: tids
    },
    name: moment(req.body.start_time).format("YYYY-MM-DD ") + req.body.theme
  };
  var _user;
  if(req.user.provider==='user'){
    _user ={
      _id: req.user._id,
      name: req.user.nickname,
      type: 'user'
    };
  }else{
    _user={
      _id: req.user._id,
      name: req.user.info.official_name,
      type: 'hr'
    }
  }
  photoInfo.update_user= _user;
  photoInfo.create_user= _user;

  var providerInfo = {
    poster:{
      cname:cname,
      cid:cid,
      role:req.user.provider==='user'?'LEADER':'HR',
      tname:!multi ? tname:'',
      uid:req.user.provider==='user'? req.user._id : null,
      nickname: req.user.provider==='user'? req.user.nickname : null
    },
    campaign_type:!multi ? 2 : 3,
    tid: !multi ? [tid]:tids,
    cid: [cid],
    campaign_unit:[]
  };

  async.waterfall([
    function(cb){
      //保存公司信息
      Company.findOne({'_id':cid},{info:1},function(err,company){
        if(err){
          cb(err);
        }
        var _company = {
          '_id':company._id,
          'name':company.info.official_name,
          'logo':company.info.logo
        };
        cb(null,_company);
      });
    },
    function(_company,cb){
      //保存小队信息
      if(!multi){
        providerInfo.campaign_unit=[{
          'company':_company,
          'team':{
            '_id':req.companyGroup._id,
            'name':req.companyGroup.name,
            'logo':req.companyGroup.logo
          }
        }];
        cb(null,null);
      }
      else{
        CompanyGroup.find({'_id':{'$in':tids}},{name:1,logo:1},function(err,teams){
          if(err){
            cb(err);
          }
          for(i=0;i<teams.length;i++){
            providerInfo.campaign_unit.push({
              'company':_company,//发小队活动,无论是否为多小队活动,公司暂时都是一样的
              'team':{
                '_id':teams[i]._id,
                'name':teams[i].name,
                'logo':teams[i].logo
              },
              'start_confirm':true
            });
          }
          cb(null,null);
        });
      }
    },
    function(args,cb){
      //把所有的参数都传到发活动接口
      campaign_controller.newCampaign(req.body,providerInfo,photoInfo,function(status,data){
        if(status){
          cb(data);
        }
        else {
          cb(null,data);
        }
      });
    },
  ],function(err,result){
    if(err){
      console.log(err);
      return res.send({'result':0,'msg':err});
    }
    else {
      //触发推送服务
      push.campaign(result.campaign_id);
      if (!multi) {
        req.companyGroup.photo_album_list.push(result.photo_album_id);
        req.companyGroup.save(function (err) {
          if (err) {
            return res.send({'result': 0, 'msg': 'FAILURED'});
          } else {
            //生成动态消息
            var groupMessage = new GroupMessage();
            groupMessage.message_type = 1;
            groupMessage.company = {
              cid: cid,
              name: cname
            };
            groupMessage.team = {
              teamid: tid,
              name: tname,
              logo: req.companyGroup.logo
            };
            groupMessage.campaign = result.campaign_id;
            groupMessage.save(function (err) {
              if (err) {
                console.log(err);
                return res.send({'result':0,'msg': 'FAILURED'});
              } else {
                return res.send({'result': 1,'campaign_id': result.campaign_id});
              }
            });
          }
        });
      } else {
        var i = 0;
        async.whilst(
          function () {
            return i < tids.length
          },
          function (__callback) {
            CompanyGroup.update({'_id': tids[i]}, {'$push': {'photo_album_list': result.photo_album_id}}, function (err, team) {
              if (err || !team) {
                console.log('小队相册加入失败', err, team);
              } else {
                i++;
                __callback();
              }
            })
          },
          function (err) {
            if (err) {
              console.log('MULTI_CAMPAIGN_CAMPAIGN', err);
              return res.send({'result': 0, 'msg': 'FAILURED'});
            } else {
              //生成动态消息
              var groupMessage = new GroupMessage();
              groupMessage.message_type = 1;
              groupMessage.company = {
                cid: cid,
                name: cname
              };
              for (var i = 0; i < req.body.select_teams.length; i++) {
                groupMessage.team.push({
                  'teamid': req.body.select_teams[i]._id,
                  'name': req.body.select_teams[i].name,
                  'logo': req.body.select_teams[i].logo
                });
              }
              groupMessage.campaign = result.campaign_id;
              groupMessage.save(function (err) {
                if (err) {
                  console.log('MULTI_CAMPAIGN_GROUPMESSAGE_ERROR', err);
                } else {
                  return res.send({'result': 1, 'campaign_id': result.campaign_id});
                }
              });
            }
          }
        );
      }
    }
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
      // department可以是false，表示不是部门的小队
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

  var familyPhotos = req.companyGroup.family.filter(function (photo) {
    return !photo.hidden;
  });

  res.send({ result: 1, familyPhotos: familyPhotos });
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
    res.send({ result: 1 });
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
    res.send({ result: 1 });
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


