'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ScoreBoard = new Schema({
  owner: {
    companies: [Schema.Types.ObjectId],
    teams: [Schema.Types.ObjectId]
  },
  playing_teams: [{
    cid: Schema.Types.ObjectId,
    tid: Schema.Types.ObjectId, // 如果是公司活动，则没有此属性
    name: String, // 实际参赛的队名，可能是公司名，也可能是小队名
    logo: String, // 实际参赛队伍的Logo，可能是公司的，也可能是小队的
    score: {
      type: Number,
      default: 0
    },
    confirm: {
      type: Boolean,
      default: false
    },

    // 是否参与计分
    selected: {
      type: Boolean,
      default: false
    }
  }],
  all_confirm: {
    type: Boolean,
    default: false
  } // 是否都确认比分了
});


ScoreBoard.statics = {

  /**
   * 创建组件
   * @param {Object} host 目前只允许是活动
   * @param {Function} callback
   */
  establish: function (host, callback) {
    var modelName = host.constructor.modelName;
    var playingTeams = [];
    switch (modelName) {
      case 'Campaign':
        var owner = {
          companies: host.cid,
          teams: host.team
        };

        if (host.teams.length === 1) {
          if (!host.teams[0].team) {
            // 公司活动
            var team = {
              cid: host.teams[0].company._id,
              name: host.teams[0].company.name,
              logo: host.teams[0].company.logo,
              selected: true
            };
            // 计分板至少需要两个队
            playingTeams = [team, team];
          } else {
            // 小队或部门内部活动
            var team = {
              cid: host.teams[0].company._id,
              tid: host.teams[0].team._id,
              name: host.teams[0].team.name,
              logo: host.teams[0].team.logo,
              selected: true
            };
            playingTeams = [team, team];
          }
        } else if (host.teams.length >= 2) {
          // 两个以上的小队参与的计分
          for (var i = 0; i < host.teams.length; i++) {
            var team = {
              cid: host.teams[i].company._id,
              tid: host.teams[i].team._id,
              name: host.teams[i].team.name,
              logo: host.teams[i].team.logo
            };
            playingTeams.push(team);
          }

          // 正好两个队的时候，把这两个队都加入计分板中
          if (playingTeams.length === 2) {
            playingTeams[0].selected = true;
            playingTeams[1].selected = true;
          }
        }

        break;
      default:
        return callback('比分板只允许在活动中使用');
    }
    var scoreBoard = new this({
      owner: owner,
      playing_teams: playingTeams
    });

    scoreBoard.save(function (err) {
      if (err) { return callback(err); }
      else { callback (null, scoreBoard); }
    });
  }
};


ScoreBoard.methods = {

  /**
   * 获取组件数据
   * @param {Function} callback
   */
  getData: function (callback) {
    callback({
      playingTeams: this.playing_teams,
      allConfirm: this.all_confirm
    });
  }
};

mongoose.model('ScoreBoard', ScoreBoard);

