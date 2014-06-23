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



//根据小队ID返回小队动态消息
exports.getGroupMessage = function(req, res) {
  if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST'){
    return res.send(403,forbidden);
  }
  var tid = req.params.teamId;    //小队的id

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
          'provoke_accept': group_message[i].provoke.active && (req.session.role==='HR' || req.session.role ==='LEADER') && (!group_message[i].provoke.start_confirm) && (group_message[i].team[1].toString() === tid.toString()),
          'comment_sum':group_message[i].comment_sum
        });
      }
      return res.send({'group_messages':group_messages,'role':req.session.role});
    }
  });
};


//列出该user加入的所有小队的动态
exports.getUserMessage = function(req, res) {
  if(req.session.role!=='OWNER'){
    return res.send(403,'forbidden');
  }
  var group_messages = [];
  var i = 0;
  var companyLogo;

  var team_ids = [];
  var team_names = [];
  var tid,tname;

  for(var i = 0; i < req.user.team.length; i ++) {
    team_ids.push(req.user.team[i]._id);
    team_names.push(req.user.team[i].name);
  }


  GroupMessage.find({'team' :{'$in':team_ids}})
  .populate('team').sort({'create_time':-1})
  .exec(function(err, group_message) {
    if (group_message.length > 0) {
      if (err) {
        console.log(err);
        return res.send([]);
      } else {

        var length = group_message.length;
        for(var j = 0; j < length; j ++) {

          var positive = 0;
          var negative = 0;
          var my_team_id,my_team_name;
          var find = false;
          var host = true;

          //如果是比赛动态
          if(group_message[j].provoke.active) {
            //其实 team.length == 2
            for(var k = 0; k < group_message[j].team.length && !find; k ++) {
              for(var l = 0; l < team_ids.length; l ++) {
                if(group_message[j].team[k]._id.toString() === team_ids[l]._id.toString()) {
                  my_team_id = team_ids[l]._id;
                  my_team_name = team_names[l];
                  positive = group_message[j].provoke.camp[k].vote.positive;
                  negative = group_message[j].provoke.camp[k].vote.negative;
                  find = true;
                  host = (k === 0);  //默认规定team[0]是发起比赛的那一方
                  break;
                }
              }
            }

          } else {
            //如果是普通活动动态
            for(var l = 0; l < team_ids.length; l ++) {
              if(group_message[j].team[0]._id.toString() === team_ids[l].toString()) {
                my_team_id = team_ids[l];
                my_team_name = team_names[l];
                break;
              }
            }
          }
          //console.log('logo'+ j +':' + group_message[j].team[0].logo,host);
          //console.log('group_message_id'+ j +':' + group_message[j]._id);
          group_messages.push({
            'positive' : positive,
            'negative' : negative,
            'my_team_name' : my_team_name,
            'my_team_id': my_team_id,
            'host': host,                  //是不是发赛方
            '_id': group_message[j]._id,
            'cid': group_message[j].cid,
            'group': group_message[j].group,
            'active': group_message[j].active,
            'date': group_message[j].date,
            'poster': group_message[j].poster,
            'content': group_message[j].content,
            'location' : group_message[j].location,
            'start_time' : group_message[j].start_time,
            'end_time' : group_message[j].end_time,
            'provoke': group_message[j].provoke,
            'logo':host ? group_message[j].team[0].logo : group_message[j].team[1].logo,
            'provoke_accept': false,
            'comment_sum':group_message[j].comment_sum
          });
        }
        Company.findOne({'_id':req.user.cid}).exec(function(err,company){
          if(err || !company){
            return res.send([]);
          } else {
            var companyLogo = company.info.logo;
            res.send({'group_messages':group_messages,'role':req.session.role,'companyLogo':companyLogo});
          }
        });
      }
    } else {
      return res.send([]);
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