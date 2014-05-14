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
//返回公司动态消息的所有数据,待前台调用
exports.getCompanyMessage = function(req, res) {

  var cid = req.session.cid;

  //公司的动态消息都归在虚拟组里
  GroupMessage.find({'cid' : {'$all':[cid]} , 'group.gid' : {'$all':['0']}}, function(err, group_messages) {
    if (err) {
      console.log(err);
      return res.status(404).send([]);
    } else {
        return res.send(group_messages);
    }
  });

};


//返回小组动态消息
exports.getGroupMessage = function(req, res) {

  var cid = req.session.cid;
  var gid = req.session.gid;

  //有包含gid的消息都列出来
  GroupMessage.find({'cid' : {'$all':[cid]}, 'group.gid' : {'$all':[gid]}}, function(err, group_message) {
    if (err || !group_message) {
      console.log(err);
      return res.status(404).send([]);
    } else {
      var group_messages = [];
      var length = group_message.length;
      for(var i = 0; i < length; i ++) {

        var leader = false;
        for(var j = 0; j < req.user.group.length; j ++) {
          if(req.user.group[j].gid === gid) {
            leader = req.user.group[j].leader;
          }
        }

        var positive = 0;
        var negative = 0;
        for(var k = 0; k < group_message[i].provoke.camp.length; k ++) {
          if(group_message[i].provoke.camp[k].tname === req.session.companyGroup.name){
            positive = group_message[i].provoke.camp[k].vote.positive;
            negative = group_message[i].provoke.camp[k].vote.negative;
            break;
          }
        }
        group_messages.push({
          'positive' : positive,
          'negative' : negative,
          'my_tname' : req.session.companyGroup.name,
          'id': group_message[i].id,
          'cid': group_message[i].cid,
          'group': group_message[i].group,
          'active': group_message[i].active,
          'date': group_message[i].date,
          'poster': group_message[i].poster,
          'content': group_message[i].content,
          'location' : group_message[i].location,
          'start_time' : group_message[i].start_time ? group_message[i].start_time.toLocaleDateString() : '',
          'end_time' : group_message[i].end_time ? group_message[i].end_time.toLocaleDateString() : '',
          'provoke': group_message[i].provoke,                   //应约按钮显示要有四个条件:1.该约战没有关闭 2.当前员工所属组件id和被约组件id一致 3.约战没有确认 4.当前员工是该小队的队长
          'provoke_accept': group_message[i].provoke.active && (group_message[i].group.gid[0] === gid) && leader && (!group_message[i].provoke.start_confirm) && (group_message[i].cid[1] === req.session.cid)
        });
      }
      return res.send(group_messages);
    }
  });
};


//列出该user加入的所有小组的动态
exports.getUserMessage = function(req, res) {
  var group_messages = [];
  var flag = 0;
  var i = 0;
  async.whilst(
    function() { return i < req.user.group.length; },

    function(callback) {
      GroupMessage.find({'cid' : {'$all':[req.user.cid]} , 'group.gid': {'$all': [req.user.group[i].gid]} }, function(err, group_message) {
        if (group_message.length > 0) {
          if (err) {
            console.log(err);
            return;
          } else {

            var length = group_message.length;
            for(var j = 0; j < length; j ++) {

              var positive = 0;
              var negative = 0;
              for(var k = 0; k < group_message[j].provoke.camp.length; k ++) {
                if(group_message[j].provoke.camp[k].tname === req.user.group[flag-1].tname){
                  positive = group_message[j].provoke.camp[k].vote.positive;
                  negative = group_message[j].provoke.camp[k].vote.negative;
                  break;
                }
              }
              group_messages.push({
                'positive' : positive,
                'negative' : negative,
                'my_tname': req.user.group[i].tname,
                'id': group_message[j].id,
                'cid': group_message[j].cid,
                'group': group_message[j].group,
                'active': group_message[j].active,
                'date': group_message[j].date,
                'poster': group_message[j].poster,
                'content': group_message[j].content,
                'location' : group_message[j].location,
                'start_time' : group_message[j].start_time ? group_message[j].start_time.toLocaleDateString() : '',
                'end_time' : group_message[j].end_time ? group_message[j].end_time.toLocaleDateString() : '',
                'provoke': group_message[j].provoke,                  //应约按钮显示要有四个条件:1.该约战没有关闭 2.当前员工公司id和被约公司id一致 3.约战没有确认 4.当前员工是该小队的队长
                'provoke_accept': group_message[j].provoke.active && (group_message[j].group.gid[0] === req.user.group[flag-1].gid) && (!group_message[j].provoke.start_confirm) && req.user.group[flag-1].leader && (group_message[j].cid[1] === req.session.cid)
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
        res.send(group_messages);
      }
    }
  );
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