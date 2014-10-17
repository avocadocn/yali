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
          teams: host.tid
        };

        if (host.campaign_unit.length === 1) {
          // 只有一个参加活动的单位
          var unit = host.campaign_unit[0];

          var team = {
            cid: unit.company._id,
            selected: true
          };

          if (host.campaign_type === 1) {
            // 公司活动
            team.name = unit.company.name;
            team.logo = unit.company.logo;
          } else {
            // 非公司活动
            team.tid = unit.team._id;
            team.name = unit.team.name;
            team.logo = unit.team.logo;
          }
          playingTeams = [team, team];
        } else {
          host.campaign_unit.forEach(function (unit) {
            playingTeams.push({
              cid: unit.company._id,
              tid: unit.team._id,
              name: unit.team.name,
              logo: unit.team.logo
            });
          });

          // 正好两个队的时候，把这两个队都加入计分板中
          if (playingTeams.length === 2) {
            playingTeams.forEach(function (team) {
              team.selected = true;
            });
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
  },

  /**
   * 选择加入比分的小队
   * @param teamId 小队的id
   * @returns {boolean} 设置成功返回true，失败返回false
   */
  selectTeam: function (teamId) {
    var selectedCount = 0;

    // 如果已经有两个队加入计分了，则不再允许添加小队
    for (var i = 0; i < this.playing_teams.length; i++) {
      if (this.playing_teams[i].selected === true) {
        selectedCount++;
      }
      if (selectedCount === 2) {
        return false;
      }
    }

    for (var i = 0; i < this.playing_teams.length; i++) {
      var team = this.playing_teams[i];

      if (team._id.toString() === teamId.toString()) {
        team.selected = true;
        return true;
      }
    }

    return false;
  },

  /**
   * 设置比分，设置后会清除确认，全部确认后无法设置
   * @param {Array} scores 计分板比分，必须是长度为2的数组，数组元素为数字，例如[1, 2]
   * @returns {boolean} 设置成功返回true，失败返回false
   */
  setScore: function (scores) {
    if (this.all_confirm === true) { return false; }
    if (scores.length !== 2) { return false; }
    for (var i = 0; i < 2; i++) {
      this.playing_teams[i].score = scores[i];
      this.playing_teams[i].confirm = false;
    }
    return true;
  },

  /**
   * 确认比分
   * @param {Array} indexArray 要确认的小队的索引数组，只可以是[],[0],[1],[0,1]
   */
  confirm: function (indexArray) {
    for (var i = 0; i < indexArray.length; i++) {
      var index = indexArray[i];
      this.playing_teams[index].confirm = true;
    }
    var confirmCount = 0;
    for (var i = 0; i < this.playing_teams.length; i++) {
      if (this.playing_teams[i].confirm === true) {
        confirmCount++;
      }
    }
    if (confirmCount === 2) {
      this.all_confirm = true;
    }
  }


};

mongoose.model('ScoreBoard', ScoreBoard);

