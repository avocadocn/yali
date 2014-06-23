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
    Campaign = mongoose.model('Campaign'),
    async = require('async'),
    PhotoAlbum = mongoose.model('PhotoAlbum'),
    config = require('../../config/config'),
    model_helper = require('../helpers/model_helper');



exports.getGroupId = function(req, res) {

};
//返回公司发布的所有活动,待前台调用
exports.getCompanyCampaign = function(req, res) {
    if(req.session.role==='GUEST'){
        return res.send(403, 'forbidden!');
    }
    else if(req.session.role ==='EMPLOYEE'){
        //公司发布的活动都归在虚拟组 gid = 0 里
        Campaign.find({'cid' : req.session.nowcid.toString(), 'gid' : '0'}).sort({'start_time':-1}).exec(function(err, campaign) {
            if (err) {
                console.log(err);
                return res.status(404).send([]);
            } else {
                var campaigns = [];
                for(var i = 0;i < campaign.length; i ++) {
                    var judge = false;
                    if(campaign[i].deadline && campaign[i].member_max){
                        judge = (Date.now() - campaign[i].deadline.valueOf() > 0 || (campaign[i].member.length >= campaign[i].member_max) && campaign[i].member_max > 0 );
                    }
                    campaigns.push({
                        'over' : judge,
                        'active':campaign[i].active, //截止时间到了活动就无效了,
                        '_id': campaign[i]._id,
                        'gid': campaign[i].gid,
                        'group_type': campaign[i].group_type,
                        'cid': campaign[i].cid,
                        'cname': campaign[i].cname,
                        'poster': campaign[i].poster,
                        'content': campaign[i].content,
                        'location': campaign[i].location,
                        'member': campaign[i].member,
                        'create_time': campaign[i].create_time,
                        'start_time': campaign[i].start_time,
                        'end_time': campaign[i].end_time,
                        'deadline':campaign[i].deadline
                    });
                    for(var j = 0;j < campaign[i].member.length; j ++) {
                        if(req.user.id === campaign[i].member[j].uid) {
                            campaigns[i].join = true;
                            break;
                        }
                    }
                }
                return res.send({'data':campaigns,'role':req.session.role});
            }
        });
    }
    else if(req.session.role ==='HR'){
        Campaign.find({'cid' : req.session.nowcid, 'gid' : '0'}, function(err, campaigns) {
            if (err) {
                console.log(err);
                return res.status(404).send([]);
            }
            else {
                return res.send({'data':campaigns,'role':req.session.role});
            }
        });
    }
};
//HR发布一个活动(可能是多个企业)
exports.sponsorCompanyCampaign = function (req, res) {
    if(req.session.role !=='HR'){
      return res.send(403,forbidden);
    }
    var username = req.user.info.name;
    var cid = req.user._id.toString();    //公司id
    var gid = '0';                  //HR发布的活动,全部归在虚拟组里,虚拟组的id默认是0
    var group_type = '虚拟组';
    var company_in_campaign = req.body.company_in_campaign;//公司id数组,HR可以发布多个公司一起的的联谊或者约战活动,注意:第一个公司默认就是次hr所在的公司!

    if(company_in_campaign === undefined || company_in_campaign === null) {
        company_in_campaign = [cid];
    }
    var content = req.body.content;//活动内容
    var location = req.body.location;//活动地点

    var campaign = new Campaign();
    campaign.team.push(cid);
    campaign.gid.push(gid);
    campaign.group_type.push(group_type);
    campaign.cname = username;
    campaign.cid = company_in_campaign; //参加活动的所有公司的id
    campaign.poster.cname = username;
    campaign.poster.cid = cid;
    campaign.poster.role = 'HR';
    campaign.active = true;
    campaign.content = content;
    campaign.location = location;

    campaign.start_time = req.body.start_time;
    campaign.end_time = req.body.end_time;

    var photo_album = new PhotoAlbum();
    if (fs.mkdirSync(config.root + '/public/img/photo_album/' + photo_album._id)) {
        photo_album.save(function(err) {
            campaign.photo_album = { pid: photo_album._id, name: photo_album.name };
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
                groupMessage.team.push(cid);
                groupMessage.group.gid.push(gid);
                groupMessage.group.group_type.push(group_type);
                groupMessage.active = true;
                groupMessage.cid.push(cid);

                groupMessage.poster.cname = username;
                groupMessage.poster.cid = cid;
                groupMessage.poster.role = 'HR';

                groupMessage.content = content;
                groupMessage.location = location;
                groupMessage.start_time = req.body.start_time;
                groupMessage.end_time = req.body.end_time;

                groupMessage.save(function(err) {
                    if (err) {
                        return res.send({'result':0,'msg':'活动创建失败'});;
                    }
                    else{
                        res.send({'result':1,'msg':'活动创建成功'});
                    }
                });
            });
        });

    }

};


//HR/队长关闭活动
exports.campaignCancel = function (req, res) {
  if(req.session.role !=='HR' && req.session.role !=='LEADER'){
    return res.send(403,forbidden);
  }
  var campaign_id = req.body.campaign_id;
  console.log(campaign_id);
  Campaign.findOne({_id:campaign_id},function(err, campaign) {
      console.log(campaign);
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


exports.getAllCampaign = function(req, res) {
  if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST'){
    return res.send(403);
  }
  var cid = req.session.role === 'HR' ? req.user._id : req.user.cid;
  var query_regular = {'cid' : {'$all':[cid.toString()]} };
  Campaign.find(query_regular).sort({'start_time':-1}).exec(function(err, campaign) {
    if(campaign.length > 0) {
      var campaigns = [];
      if (err) {
        return res.send([]);
      } else {
        var length = campaign.length;
        var join;
        for(var j = 0; j < length; j ++) {


          join = false;
          for(var k = 0;k < campaign[j].member.length; k ++) {
            if(req.user._id.toString() === campaign[j].member[k].uid.toString()) {
              join = true;
              break;
            }
          }
          var judge = false;
          if(campaign[j].deadline && campaign[j].member_max){
              judge = (Date.now() - campaign[j].deadline.valueOf() > 0 || (campaign[j].member.length >= campaign[j].member_max) && campaign[j].member_max > 0 );
          }
          campaigns.push({
            'over' : judge,
            'active':campaign[j].active, //截止时间到了活动就无效了,
            '_id': campaign[j]._id,
            'gid': campaign[j].gid,
            'group_type': campaign[j].group_type,
            'cid': campaign[j].cid,
            'cname': campaign[j].cname,
            'poster': campaign[j].poster,
            'content': campaign[j].content,
            'location': campaign[j].location,
            'member': campaign[j].member,
            'create_time': campaign[j].create_time,
            'start_time': campaign[j].start_time,
            'end_time': campaign[j].end_time,
            'deadline':campaign[j].deadline,
            'join':join,
            'provoke':campaign[j].provoke
          });

        }
      }
      return res.send({'data':campaigns,role:req.session.role});
    } else {
      return res.send({'data':[]});
    }
  });
}

//返回某一小队的活动,待前台调用
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
          var judge = false;
          if(campaign[i].deadline && campaign[i].member_max){
              judge = (Date.now() - campaign[i].deadline.valueOf() > 0 || (campaign[i].member.length >= campaign[i].member_max) && campaign[i].member_max > 0 );
          }
          campaigns.push({
            'over' : judge,
            'active':campaign[i].active, //截止时间到了活动就无效了,
            '_id': campaign[i]._id.toString(),
            'gid': campaign[i].gid,
            'group_type': campaign[i].group_type,
            'cid': campaign[i].cid,
            'cname': campaign[i].cname,
            'poster': campaign[i].poster,
            'content': campaign[i].content,
            'location': campaign[i].location,
            'member_length': campaign[i].member.length,
            'start_time': campaign[i].start_time,
            'end_time': campaign[i].end_time,
            'join':join,
            'provoke':campaign[i].provoke
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
//队长发布一个活动(只能是一个企业)
exports.sponsorGroupCampaign = function (req, res) {

  if(req.session.role !=='HR' && req.session.role !=='LEADER'){
    return res.send(403,forbidden);
  }
  var content = req.body.content;//活动内容
  var location = req.body.location;//活动地点
  var group_type = req.companyGroup.group_type;
  var tid = req.params.teamId;
  var cid = req.session.role ==='HR' ? req.user._id : req.user.cid;
  var cname = req.session.role ==='HR' ? req.user.info.name : req.user.cname;
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
  if(req.session.role==='LEADER'){
    campaign.poster.uid = req.user._id;
    campaign.poster.username = req.user.username;
  }

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

    groupMessage.team.push(tid);
    groupMessage.group.gid.push(req.companyGroup.gid);
    groupMessage.group.group_type.push(group_type);
    groupMessage.active = true;
    groupMessage.cid.push(cid);
    groupMessage.poster.cname = cname;
    groupMessage.poster.cid = cid;
    groupMessage.poster.role = req.session.role;
    if(req.session.role==='LEADER'){
      groupMessage.poster.uid = req.user._id;
      groupMessage.poster.username = req.user.nickname;
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
};



function getUserCampaigns(req,res,_in) {
  var check = _in;
  var i = 0;
  var join = false;
  var campaigns = [];

  Array.prototype.S=String.fromCharCode(2);
  Array.prototype.in_array=function(e)
  {
    var r=new RegExp(this.S+e+this.S);
    return (r.test(this.S+this.join(this.S)+this.S));
  }

  var team_ids = [];

  for( var i = 0; i < req.user.group.length; i ++) {
    for ( var k = 0 ; k < req.user.group[i].team.length; k ++) {
      team_ids.push(req.user.group[i].team[k].id.toString());
    }
  }
  Campaign.find({'cid' : {'$all':[req.user.cid.toString()]}, 'gid':{'$ne':'0'} }).sort({'_id':-1}).exec(function(err, campaign) {
    if(campaign.length > 0) {
      if (err) {
        return res.send([]);
      } else {
        var length = campaign.length;
        for(var j = 0; j < length; j ++) {


          var regular = false;
          for(var k = 0;k < campaign[j].team.length; k ++) {
            regular = regular || ((team_ids.in_array(campaign[j].team[k].toString()) == check) && (campaign[j].team[k].toString() !== ''));
          }

          if(regular){
            join = false;
            for(var k = 0;k < campaign[j].member.length; k ++) {
              if(req.user._id.toString() === campaign[j].member[k].uid.toString()) {
                join = true;
                break;
              }
            }
            var judge = false;
            if(campaign[j].deadline && campaign[j].member_max){
                judge = !(Date.now() - campaign[j].end_time.valueOf() <= 0 || Date.now() - campaign[j].deadline.valueOf() <= 0 || campaign[j].member.length >= campaign[j].member_max);
            }
            campaigns.push({
              'over' : judge,
              'selected':_in,
              'active':campaign[j].active, //截止时间到了活动就无效了,
              '_id': campaign[j]._id,
              'gid': campaign[j].gid,
              'group_type': campaign[j].group_type,
              'cid': campaign[j].cid,
              'cname': campaign[j].cname,
              'poster': campaign[j].poster,
              'content': campaign[j].content,
              'location': campaign[j].location,
              'member': campaign[j].member,
              'create_time': campaign[j].create_time,
              'start_time': campaign[j].start_time,
              'end_time': campaign[j].end_time,
              'join':join,
              'provoke':campaign[j].provoke
            });
          }
        }
      }
      console.log(campaigns);
      return res.send({'data':campaigns});
    } else {
      return res.send({'data':[]});
    }
  });
}
//列出该user加入的所有小队的活动
//这是在员工日程里的,不用判断权限,因为关闭活动等操作
//必须让队长进入小队页面去完成,不能在个人页面进行
exports.getUserCampaign = function(req, res) {

  var _in = req.body.team_selected;
  var campaigns = [];
  var join = false;
  var flag = 0;
  var i = 0;
  getUserCampaigns(req,res,_in);
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


exports.getCampaign = function(req, res) {
  Campaign
  .findOne({ _id: req.params.id })
  .populate('team')
  .exec()
  .then(function(campaign) {
    var output_campaign = model_helper.formatCampaign(req.user, campaign);
    res.send({ result: 1, campaign: output_campaign });
  })
  .then(null, function(err) {
    console.log(err);
    res.send(400);
  })
}


