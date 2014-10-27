'use strict';

var mongoose = require('mongoose');
var auth = require('../services/auth.js');
var message = require('../controllers/message.js');

var Campaign = mongoose.model('Campaign');
var CompanyGroup = mongoose.model('CompanyGroup');

exports.getComponentData = function (req, res, next) {

  // todo: 验证请求参数的合法性

  // 获取组件数据
  mongoose.model(req.params.componentName).findById(req.params.componentId).exec()
    .then(function (component) {
      if (!component) {
        return res.send(404);
      }
      component.getData(req.user, function (data) {
        res.send({ result: 1, componentData: data });
      });
    })
    .then(null, function (err) {
      next(err);
    });

};

exports.renderTemplate = function (req, res) {
  // todo: 验证请求参数的合法性

  res.render('components/' + req.params.directiveName.toLowerCase());
};



/**
 * 发送比分请求、接受比分的站内信
 * @param  {Object} req        request
 * @param  {Object} scoreBoard mongoose.model('ScoreBoard')
 * @param  {Object} leaderTeam 队长所在的队
 * @param  {Number} status     2：提出请求，3：确认比分
 * @param  {Object} opponentTid 对手小队id
 */
var sendScoreBoardMessage = function (req, scoreBoard, leaderTeam, status, opponentTid) {
  // 假定如果是用户账号即为队长（之前的权限判断过滤掉没有权限的用户），不发站内信给公司账号
  if (req.user.provider === 'user') {
    var team = {
      _id: leaderTeam.tid,
      name: leaderTeam.name,
      logo: leaderTeam.logo,
      status: status
    };
    if (scoreBoard.host_type === 'campaign') {
      Campaign.findById(scoreBoard.host_id).exec()
      .then(function (campaign) {
        if (!campaign) {
          console.log('not found campaign with id:', scoreBoard.host_id);
        } else {

          CompanyGroup.findById(opponentTid).exec()
          .then(function (companyGroup) {
            if (!companyGroup) {
              console.log('not found company_group with id:', opponentTid);
            } else {
              // 向每个队长发送站内信，resultConfirm第二个参数需要res对象，但这不安全，故设为null。
              // 前面已经有res.send，禁止其它函数对res对象进行操作
              // 实际上，该函数也没有使用res对象
              // 该函数内部是一系列异步操作，成功与否此处无法获知
              companyGroup.leader.forEach(function (leader) {
                message.resultConfirm(req, null, leader._id, team, campaign._id, campaign.theme);
              });
            }
          })
          .then(null, function (err) {
            console.log(err);
          });
        }
      })
      .then(null, function (err) {
        if (err) {
          console.log(err);
        }
      });
    }
  }

};

exports.ScoreBoard = {

  setScore: function (req, res, next) {
    // todo 过滤请求参数

    mongoose.model('ScoreBoard').findById(req.params.componentId).exec()
      .then(function (scoreBoard) {
        if (!scoreBoard) {
          res.send({ result: 0, msg: '找不到该组件' });
        } else {

          var leaderTeam;
          var opponentTid;
          var allows = [];
          scoreBoard.playing_teams.forEach(function (playing_team) {
            var allow = auth(req.user, {
              companies: [playing_team.cid],
              teams: [playing_team.tid]
            }, ['setScoreBoardScore']);
            allows.push(allow.setScoreBoardScore);
            if (req.user.provider === 'user') {
              var isLeader = req.user.isTeamLeader(playing_team.tid);
              if (isLeader) {
                leaderTeam = playing_team;
              } else {
                opponentTid = playing_team.tid;
              }
            }
          });
          var denyAll = true;
          for (var i = 0; i < allows.length; i++) {
            if (allows[i]) {
              denyAll = false;
              break;
            }
          }
          if (denyAll) {
            return res.send(403);
          }

          if (req.body.isInit) {
            var err = scoreBoard.initScore(allows, req.body.data);
          } else {
            var err = scoreBoard.resetScore(allows, req.body.data);
          }
          if (err) {
            return res.send({ result: 0, msg: err });
          }

          scoreBoard.save(function (err) {
            if (err) {
              console.log(err);
              res.send({ result: 0, msg: err });
            } else {
              res.send({ result: 1 });
            }
          });

          // 发站内信，如果用户同时是两个小队的队长，则不发送站内信
          if (opponentTid) {
            sendScoreBoardMessage(req, scoreBoard, leaderTeam, 2, opponentTid);
          }

        }
      })
      .then(null, function (err) {
        console.log(err);
        res.send({ result: 0, msg: err });
      });
  },

  confirmScore: function (req, res, next) {

    mongoose.model('ScoreBoard').findById(req.params.componentId).exec()
      .then(function (scoreBoard) {
        if (!scoreBoard) {
          res.send({ result: 0, msg: '找不到该组件' });
        } else {

          var leaderTeam;
          var opponentTid;

          var confirmIndex = [];
          for (var i = 0; i < scoreBoard.playing_teams.length; i++) {
            var playing_team = scoreBoard.playing_teams[i];

            var allow = auth(req.user, {
              companies: [playing_team.cid],
              teams: [playing_team.tid]
            }, ['confirmScoreBoardScore']);
            if (allow.confirmScoreBoardScore) {
              confirmIndex.push(i);
            }
            if (req.user.provider === 'user') {
              var isLeader = req.user.isTeamLeader(playing_team.tid);
              if (isLeader) {
                leaderTeam = playing_team;
              } else {
                opponentTid = playing_team.tid;
              }
            }
          }
          scoreBoard.confirm(req.body.data);
          scoreBoard.save(function (err) {
            if (err) {
              next(err);
            } else {
              res.send({ result: 1 });
            }
          });

          // 发站内信
          if (opponentTid) {
            sendScoreBoardMessage(req, scoreBoard, leaderTeam, 3, opponentTid);
          }

        }
      })
      .then(null, function (err) {
        next(err);
      });
  }

};



