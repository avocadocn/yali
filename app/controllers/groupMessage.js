'use strict';
var mongoose = require('mongoose'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    User = mongoose.model('User'),
    Group = mongoose.model('Group'),
    Competition = mongoose.model('Competition'),
    Campaign = mongoose.model('Campaign'),
    GroupMessage = mongoose.model('GroupMessage');




//根据小队ID返回小组动态消息
exports.getMessage = function(req, res) {
  if(req.params.type==='team' && (req.session.role ==='GUESTHR' || req.session.role ==='GUEST') || req.params.type==='user' && req.session.role !=='OWNER'){
    return res.send(403,forbidden);
  }
  var option = {};
  if (req.params.type==='team') {
    option = {
      'team.teamid' : req.session.nowtid
    }
  }
  else{
    var team_ids = [];
    req.user.group.forEach(function(group){
      group.team.forEach(function(team){
        team_ids.push(team.id);
      });
    })
    option = {
      'team.teamid' : {'$in':team_ids}
    }
  };
  GroupMessage.find(option).sort({'creat_time':-1}).populate('campaign').populate('competition')
  .exec(function(err, group_message) {
    if (err || !group_message) {
      console.log(err);
      return res.status(404).send([]);
    } else {
      return res.send({'group_messages':group_message,'role':req.session.role});
      // var group_messages = [];
      // var length = group_message.length;
      // for(var i = 0; i < length; i ++) {
      //   var _group_message = {};
      //   switch( group_message.message_type){
      //     case 1:
      //     _group_message ={
      //       'message_type':group_message.message_type,
      //       '_id': group_message[i]._id,
      //       'team' : group_message.team,
      //       'company': group_message[i].company,
      //       'group': group_message[i].group,
      //       'active': group_message[i].active,
      //       'date': group_message[i].date,
      //       'poster': group_message[i].poster,
      //       'content': group_message[i].content,
      //       'location' : group_message[i].location,
      //       'start_time' : group_message[i].start_time ? group_message[i].start_time : '',
      //       'end_time' : group_message[i].end_time ? group_message[i] : '',
      //       'provoke': group_message[i].provoke,                   //应约按钮显示要有四个条件:1.该约战没有关闭 2.当前员工所属组件id和被约组件id一致 3.约战没有确认 4.当前员工是该小队的队长
      //       'provoke_accept': group_message[i].provoke.active && (req.session.role==='HR' || req.session.role ==='LEADER') && (!group_message[i].provoke.start_confirm) && (group_message[i].team[1].toString() === tid.toString()),
      //       'comment_sum':group_message[i].comment_sum
      //     };
      //     break;
      //     case 2:
      //     break;
      //     case 3:
      //     break;
      //     case 4:
      //     break;
      //     case 5:
      //     break;
      //     case 6: 
      //     break;
      //     default:
      //     break;
      //   }
      //   group_messages.push({
      //     'positive' : positive,
      //     'negative' : negative,
      //     'my_tname' : req.companyGroup.name,
      //     '_id': group_message[i]._id,
      //     'cid': group_message[i].cid,
      //     'group': group_message[i].group,
      //     'active': group_message[i].active,
      //     'date': group_message[i].date,
      //     'poster': group_message[i].poster,
      //     'content': group_message[i].content,
      //     'location' : group_message[i].location,
      //     'start_time' : group_message[i].start_time ? group_message[i].start_time : '',
      //     'end_time' : group_message[i].end_time ? group_message[i] : '',
      //     'provoke': group_message[i].provoke,                   //应约按钮显示要有四个条件:1.该约战没有关闭 2.当前员工所属组件id和被约组件id一致 3.约战没有确认 4.当前员工是该小队的队长
      //     'provoke_accept': group_message[i].provoke.active && (req.session.role==='HR' || req.session.role ==='LEADER') && (!group_message[i].provoke.start_confirm) && (group_message[i].team[1].toString() === tid.toString()),
      //     'comment_sum':group_message[i].comment_sum
      //   });
      // }
      //return res.send({'group_messages':group_messages,'role':req.session.role});
     }
  });
};


exports.getUserMessage = function(req, res) {
  if(req.session.role!=='OWNER'){
    return res.send(403,'forbidden');
  }
  var group_messages = [];
  var i = 0;
  async.whilst(
    function() { return i < req.user.group.length; },

    function(callback) {
      var team_ids = [];
      for(var k = 0; k < req.user.group[i].team.length; k ++){
        team_ids.push(req.user.group[i].team[k].id);
      }
      GroupMessage.find({'team' :{'$in':team_ids}}).sort({'_id':-1})
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
              for(var k = 0; k < group_message[j].provoke.camp.length; k ++) {
                if(group_message[j].provoke.camp[k].tname === req.user.group[i].tname){
                  positive = group_message[j].provoke.camp[k].vote.positive;
                  negative = group_message[j].provoke.camp[k].vote.negative;
                  break;
                }
              }
              group_messages.push({
                'positive' : positive,
                'negative' : negative,
                'my_tname': req.user.group[i].tname,
                '_id': group_message[j]._id,
                'cid': group_message[j].cid,
                'group': group_message[j].group,
                'active': group_message[j].active,
                'date': group_message[j].date,
                'poster': group_message[j].poster,
                'content': group_message[j].content,
                'location' : group_message[j].location,
                'start_time' : group_message[j].start_time ? group_message[j].start_time.toLocaleDateString() : '',
                'end_time' : group_message[j].end_time ? group_message[j].end_time.toLocaleDateString() : '',
                'provoke': group_message[j].provoke,
                'provoke_accept': false,
                'comment_sum':group_message[j].comment_sum
              });
            }
          }
        }
        i++;
        callback();
      });
    },

    function(err) {
      if (err) {
        console.log(err);
        res.send([]);
      } else {
        res.send({'group_messages':group_messages,'role':req.session.role});
      }
    }
  );
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