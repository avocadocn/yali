'use strict';

var mongoose = require('mongoose');
var auth = require('../services/auth.js');

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


exports.ScoreBoard = {

  setScore: function (req, res, next) {
    // todo 过滤请求参数

    mongoose.model('ScoreBoard').findById(req.params.componentId).exec()
      .then(function (scoreBoard) {
        if (!scoreBoard) {
          res.send({ result: 0, msg: '找不到该组件' });
        } else {

          var allows = [];
          scoreBoard.playing_teams.forEach(function (playing_team) {
            var allow = auth(req.user, {
              companies: [playing_team.cid],
              teams: [playing_team.tid]
            }, ['setScoreBoardScore']);
            allows.push(allow.setScoreBoardScore);
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

          var confirmIndex = [];
          for (var i = 0; i < scoreBoard.playing_teams.length; i++) {
            var allow = auth(req.user, {
              companies: [scoreBoard.playing_teams[i].cid],
              teams: [scoreBoard.playing_teams[i].tid]
            }, ['confirmScoreBoardScore']);
            if (allow.confirmScoreBoardScore) {
              confirmIndex.push(i);
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

        }
      })
      .then(null, function (err) {
        next(err);
      });
  }

};



