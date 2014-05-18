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
    async = require('async');

exports.getGroupId = function(req, res) {

};
//返回公司发布的所有活动,待前台调用
exports.getCompanyCampaign = function(req, res) {

  var cid = req.session.cid;//根据公司id取出该公司的所有活动
  var uid = req.session.uid;
  var role = req.session.role;

  //公司发布的活动都归在虚拟组 gid = 0 里
  Campaign.find({'cid' : {'$all':[cid]}, 'gid' : {'$all':['0']}}, function(err, campaign) {
      if (err) {
          console.log(err);
          return res.status(404).send([]);
      } else {
          var campaigns = [];
          var join = false;
          for(var i = 0;i < campaign.length; i ++) {
              join = false;
              for(var j = 0;j < campaign[i].member.length; j ++) {
                  if(uid === campaign[i].member[j].uid) {
                      join = true;
                      break;
                  }
              }
              campaigns.push({
                  'active':campaign[i].active,
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
                  'create_time': campaign[i].create_time ? campaign[i].create_time.toLocaleDateString() : '',
                  'start_time': campaign[i].start_time ? campaign[i].start_time.toLocaleDateString() : '',
                  'end_time': campaign[i].end_time ? campaign[i].end_time.toLocaleDateString() : '',
                  'join':join
              });
          }
          return res.send({'data':campaigns,'role':role});
      }
  });
};
//HR发布一个活动(可能是多个企业)
exports.sponsorCompanyCampaign = function (req, res) {

    var username = req.session.username;
    var cid = req.session.cid;    //公司id
    var uid = req.session.uid;    //用户id
    var gid = '0';                  //HR发布的活动,全部归在虚拟组里,虚拟组的id默认是0
    var group_type = '虚拟组';
    var company_in_campaign = req.body.company_in_campaign;//公司id数组,HR可以发布多个公司一起的的联谊或者约战活动,注意:第一个公司默认就是次hr所在的公司!

    if(company_in_campaign === undefined || company_in_campaign === null) {
        company_in_campaign = [cid];
    }
    var content = req.body.content;//活动内容
    var location = req.body.location;//活动地点

    var cname = '';

    Company.findOne({
            _id : cid
        },
        function (err, company) {
            cname = company.info.name;
    });

    var campaign = new Campaign();

    campaign.gid.push(gid);
    campaign.group_type.push(group_type);

    campaign.cid = company_in_campaign; //参加活动的所有公司的id

    campaign.poster.cname = cname;
    campaign.poster.cid = cid;
    campaign.poster.uid = uid;
    campaign.poster.role = 'HR';
    campaign.active = true;

    campaign.poster.username = username;

    campaign.content = content;
    campaign.location = location;

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

        groupMessage.group.gid.push(gid);
        groupMessage.group.group_type.push(group_type);
        groupMessage.active = true;
        groupMessage.cid.push(cid);

        groupMessage.poster.cname = cname;
        groupMessage.poster.cid = cid;
        groupMessage.poster.uid = uid;
        groupMessage.poster.role = 'HR';
        groupMessage.poster.username = username;

        groupMessage.content = content;
        groupMessage.location = location;
        groupMessage.start_time = req.body.start_time;
        groupMessage.end_time = req.body.end_time;

        groupMessage.save(function(err) {
            if (err) {
                res.send(err);
                return;
            }
        });
    });
    res.send('ok');
};
//HR关闭企业活动/组长关闭活动
exports.campaignCancel = function (req, res) {
    var campaign_id = req.body.campaign_id;
    Campaign.findOne({_id:campaign_id},function(err, campaign) {
        if(campaign) {
            if (err) {
                console.log('错误');
            }

            var active = campaign.active;
            campaign.active = !active;
            campaign.save();

            return res.send('ok');
            //console.log('创建成功');
        } else {
            return res.send('not exist');
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
        if(req.user.group[j].gid === gid) {
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
//组长发布一个活动(只能是一个企业)
exports.sponsorGroupCampaign = function (req, res) {

  var username = req.session.username;
  var group_type = req.companyGroup.group_type;
  var cid = req.session.cid;  //公司id
  var uid = req.session.uid;  //用户id
  var gid = req.session.gid;     //组件id,组长一次对一个组发布活动
  var content = req.body.content;//活动内容
  var location = req.body.location;//活动地点
  var cname = '';
  var tid = req.params.teamId;

  //生成活动
  var campaign = new Campaign();
  campaign.team = tid;         //ref
  campaign.gid.push(gid);
  campaign.group_type.push(group_type);
  campaign.cid.push(cid);//内部活动只有一个公司
  campaign.poster.cname = cname;
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

    groupMessage.poster.cname = cname;
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
      team_ids.push(req.user.group[i].team[k].id);
    }
  }
  Campaign.find({'cid' : {'$all':[req.user.cid.toString()]}, 'gid':{'$ne':'0'} }).exec(function(err, campaign) {
    if(campaign.length > 0) {
      if (err) {
        return res.send([]);
      } else {
        var length = campaign.length;
        for(var j = 0; j < length; j ++) {

          console.log(campaign[j].team);
          if(team_ids.in_array(campaign[j].team.toString()) == check){
            join = false;
            for(var k = 0;k < campaign[j].member.length; k ++) {
              if(req.user.id === campaign[j].member[k].uid) {
                join = true;
                break;
              }
            }
            campaigns.push({
              'selected':_in,
              'active':campaign[j].active,
              '_id': campaign[j]._id,
              'gid': campaign[j].gid,
              'group_type': campaign[j].group_type,
              'cid': campaign[j].cid,
              'cname': campaign[j].cname,
              'poster': campaign[j].poster,
              'content': campaign[j].content,
              'location': campaign[j].location,
              'member': campaign[j].member,
              'create_time': campaign[j].create_time ? campaign[j].create_time.toLocaleDateString() : '',
              'start_time': campaign[j].start_time ? campaign[j].start_time.toLocaleDateString() : '',
              'end_time': campaign[j].end_time ? campaign[j].end_time.toLocaleDateString() : '',
              'join':join,
              'provoke':campaign[j].provoke
            });
          }
        }
      }
      return res.send({'data':campaigns});
    } else {
      return res.send({'data':[]});
    }
  });
}
//列出该user加入的所有小组的活动
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