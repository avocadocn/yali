'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ScoreBoard = new Schema({
  owner: {
    companies: [Schema.Types.ObjectId],
    teams: [Schema.Types.ObjectId]
  },
  // 长度能且仅能为2
  playing_teams: [{
    cid: Schema.Types.ObjectId,
    tid: Schema.Types.ObjectId, // 如果是公司活动，则没有此属性（现在不会出现这种情况，所有能用计分板的都是小队间的挑战）
    // 现在没有以公司为单位的挑战，所以以下两个属性都会是小队的属性
    name: String, // 实际参赛的队名，可能是公司名，也可能是小队名
    logo: String, // 实际参赛队伍的Logo，可能是公司的，也可能是小队的
    score: Number,
    result: Number, // 1：胜；0：平；-1：负
    confirm: {
      type: Boolean, // 是否确认，这个数据有利于做页面显示和确认比分时确定小队的逻辑判断。
      default: false
    }
  }],
  status: {
    type: Number, // 0: 初始状态（双方数据为空）；1，待确认（一方修改了比分，等待对方确认）；2，确认（同意了对方的修改）
    default: 0
  },
  logs: [{
    playing_team: {
      cid: Schema.Types.ObjectId,
      tid: Schema.Types.ObjectId
    },
    // scores和results二者至少存在一个
    scores: [Number], // 长度能且仅能为2
    results: [Number], // 长度能且仅能为2
    confirm: Boolean, // 是否是确认比分
    date: {
      type: Date,
      default: Date.now
    }
  }]
});


ScoreBoard.statics = {

  /**
   * 创建组件
   * @param {Object} host 目前只允许是活动
   * @param {Function} callback callback(err, scoreBoard)
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

        if (host.campaign_unit.length !== 2) {
          return callback('比分板只允许在两个队的比赛中使用');
        } else {
          // 现在能用比分板的活动一定会有team
          host.campaign_unit.forEach(function (unit) {
            playingTeams.push({
              cid: unit.company._id,
              tid: unit.team._id,
              name: unit.team.name,
              logo: unit.team.logo
            });
          });
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

/**
 * 设置比分和胜负数据
 * @param {Object} scoreBoard
 * @param {Object} data
 *  data: {
 *    team: {
 *      cid: String|Object,
 *      tid: String|Object
 *    }, // 指明是以哪个队的队长身份修改，有可能会出现同时是两队队长的情况
 *    scores: [Number], // 可选
 *    results: [Number], // 可选
 *    // scores,results属性至少要有一个
 *  }
 */
var setScore = function (scoreBoard, data) {
  var log = {
    playing_team: {
      cid: data.team.cid,
      tid: data.team.tid
    }
  };
  if (data.scores) {
    log.scores = data.scores;
  }
  if (data.results) {
    log.results = data.results;
  }
  scoreBoard.logs.push(log);

  for (var i = 0; i < scoreBoard.playing_teams.length; i++) {
    var playing_team = scoreBoard.playing_teams[i];
    if (data.scores) {
      playing_team.score = data.scores[i];
    }
    if (data.results) {
      playing_team.result = data.results[i];
    }

    if (playing_team.tid.toString() === data.team.tid.toString()) {
      playing_team.confirm = true;
    } else {
      playing_team.confirm = false;
    }
  }
  scoreBoard.status = 1;
};

ScoreBoard.methods = {

  /**
   * 获取组件数据
   * @param {Function} callback
   */
  getData: function (callback) {
    callback({
      playingTeams: this.playing_teams,
      status: this.status
    });
  },

  /**
   * 初始化比分和胜负关系，会将状态改为1（待确认状态）。如果此时状态为1会阻止设置。
   * @param {Object} data 比分数据
   *  data: {
   *    team: {
   *      cid: String|Object,
   *      tid: String|Object
   *    }, // 指明是以哪个队的队长身份修改，有可能会出现同时是两队队长的情况
   *    scores: [Number], // 可选
   *    results: [Number], // 可选
   *    // scores,results属性至少要有一个
   *  }
   * @returns {String|undefined} 如果有错误，则返回错误信息
   */
  initScore: function (data) {
    if (this.status === 1) {
      return '对方已设置了比分，请刷新页面进行确认。';
    } else if (this.status === 2) {
      return '抱歉，比分已确认，不可以再设置。';
    } else {
      setScore(this, data);
    }
  },

  /**
   * 不同意对方设置的比分，重新设置
   * @param {Object} data 比分数据
   *  data: {
   *    team: {
   *      cid: String|Object,
   *      tid: String|Object
   *    }, // 指明是以哪个队的队长身份修改，有可能会出现同时是两队队长的情况
   *    scores: [Number], // 可选
   *    results: [Number], // 可选
   *    // scores,results属性至少要有一个
   *  }
   * @returns {String|undefined} 如果有错误，则返回错误信息
   */
  resetScore: function (data) {
    if (this.status === 2) {
      return '抱歉，比分已确认，不可以再设置。';
    } else {
      setScore(this, data);
    }
  },

  /**
   * 确认比分
   * @returns {String|undefined} 如果有错误，则返回错误信息
   */
  confirm: function () {
    if (this.status === 2) {
      return '比分已确认。';
    }

    var log = {
      scores: [],
      results: [],
      confirm: true
    };
    for (var i = 0; i < this.playing_teams.length; i++) {
      var team = this.playing_teams[i];
      if (!team.confirm) {
        log.playing_team = {
          cid: team.cid,
          tid: team.tid
        };
      }
      playing_team.confirm = true;
    }
    for (var i = 0; i < this.playing_teams.length; i++) {
      log.scores.push(this.playing_teams[i].score);
      log.results.push(this.playing_teams[i].result);
    }
    this.logs.push(log);
    this.status = 2;
  }


};

mongoose.model('ScoreBoard', ScoreBoard);

