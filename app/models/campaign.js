'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * 用于子文档嵌套
 */
var _member = {
  // camp: {                //阵营
  //   type: String,
  //   enum: ['A', 'B']
  // },
  // cid: String,
  _id: Schema.Types.ObjectId,
  nickname: String,
  photo: String
  // team: {
  //   _id: Schema.Types.ObjectId,
  //   name: String,
  //   logo: String
  // }
};

//旧数据，不用了
//阵形图子文档
// var _formation = new Schema({
//   uid: String,
//   x: Number,
//   y: Number
// });
// //阵营
// var _camp = new Schema({
//   id: Schema.Types.ObjectId,               //小队id
//   logo: String,                            //队徽路径
//   tname: String,
//   member: [_member],
//   member_quit: [_member],
//   cid: String,
//   gid: String,
//   start_confirm: {                         //双方组长都确认后才能开战
//     type: Boolean,
//     default: false
//   },
//   formation: [_formation],
//   result: {                                //比赛结果确认
//     confirm: {
//       type: Boolean,
//       default: false
//     },
//     content: String,
//     start_date: Date
//   },
//   score: Number,
//   vote: {
//     positive: {                             //赞成员工投票数
//       type: Number,
//       default: 0
//     },
//     positive_member: [_member],             //赞成员工id,cid
//     negative: {                             //反对员工投票数
//       type: Number,
//       default: 0
//     },
//     negative_member: [_member]              //反对员工id,cid
//   }
// });

//新阵营
var _campaignUnit={
  company:{
    _id:Schema.Types.ObjectId,
    name:String,
    logo:String
  },
  team:{
    _id:Schema.Types.ObjectId,
    name:String,
    logo:String
  },
  member:[_member],
  member_quit: [_member],
  vote:{
    positive: {                             //赞成员工投票数
      type: Number,
      default: 0
    },
    positive_member: [_member],             //赞成员工id
    negative: {                             //反对员工投票数
      type: Number,
      default: 0
    },
    negative_member: [_member]              //反对员工id
  },
  start_confirm: {                         //双方组长都确认后才能开战
    type: Boolean,
    default: false
  }
};
/**
 * 活动
 */
var Campaign = new Schema({
  tid: [Schema.Types.ObjectId],     //参加该活动的所有组
  cid: [Schema.Types.ObjectId],     //参加该活动的所有公司
  campaign_unit:[_campaignUnit],     //新阵营
  active: {
    type: Boolean,
    default: false
  },
  finish: {
    type: Boolean,
    default: false
  },
  
  // cname: Array,                     //旧数据
  poster: {
    cid: String,                       //活动发起者所属的公司
    cname: String,
    tname: String,
    uid: String,
    nickname: String,
    role: {
      type: String,
      enum: ['HR', 'LEADER']
    }
  },
  theme: {//主题
    type: String,
    required: true
  },
  content: {//简介
    type: String
  },
  member_min: {//最少人数
    type: Number,
    default: 0
  },
  member_max: {//人数上限
    type: Number,
    default: 0
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [],
    name: String
  },
  start_time: Date,
  end_time: Date,
  deadline: Date,
  photo_album: {
    type: Schema.Types.ObjectId,
    ref: 'PhotoAlbum'
  },
  // member: [_member],              //旧数据
  // member_quit: [_member],         //旧数据
  create_time: {
    type: Date,
    default: Date.now
  },
  // camp: [_camp],                   //阵营 旧数据
  comment_sum: {
    type: Number,
    default: 0
  },
  //总分类: 1,2,3,6,8是活动  4,5,7,9是挑战
  //type:活动类型
  //1:公司活动
  //2:小队活动
  //3:公司内跨组活动（性质和小队活动一样,只是参加活动的小队不止一个而已,这些小队都是一个公司的）
  //4:公司内挑战（同类型小组）
  //5:公司外挑战（同类型小组）
  //6:部门内活动 (一个部门的活动)
  //7:动一下 (一个小队向另一个小队发起挑战,这两个小队不分类型也不分公司)
  //8:部门间活动 (公司的两个部门一起搞活动)
  //9:部门间相互挑战
  campaign_type: Number,

  //活动类型,篮球等
  campaign_mold: [String],
  tags: [String],

  //活动组件
  components: [
    {
      name: String,
      _id: Schema.Types.ObjectId
    }
  ],

  // 是否使用组件, 这是为了兼容旧的数据, 旧的活动没有此属性, 进入活动页面时将会为该活动创建评论组件并将此属性的值设为true
  modularization: Boolean

});

Campaign.virtual('members').get(function () {
  var members = [];
  this.campaign_unit.forEach(function (unit) {
    members = members.concat(unit.member);
  });
  return members;
});


Campaign.methods = {

  /**
   * 判断用户参加了哪个阵营的活动
   * @param {Object|String} uid 用户id，ObjectId和String均可
   * @returns {Object|Boolean} 返回用户所在的阵营对象，如果没有，返回false
   */
  whichUnit: function (uid) {
    uid = uid.toString();
    for (var i = 0; i < this.campaign_unit.length; i++) {
      var unit = this.campaign_unit[i];

      for (var j = 0; j < unit.member.length; j++) {
        if (uid === unit.member[j]._id.toString()) {
          return unit;
        }
      }

      for (var j = 0; j < unit.member_quit.length; j++) {
        if (uid === unit.member_quit[j]._id.toString()) {
          return unit;
        }
      }

    }
    return false;
  },

  /**
   * 参加活动，已参加、活动报名截止、活动已结束都会导致失败
   * example:
   *  campaign.join({
   *    cid: company._id,
   *    tid: team._id
   *  }, req.user);
   * @param {Object} targetUnit 参加的阵营的基本信息，包括cid,tid(tid没有可省略)
   * @param {Object} user req.user
   * @returns {Object} 参加结果对象，包括result, msg两个属性
   *  return: {
   *    result: Boolean, // 成功为true, 失败为false
   *    msg: String // 失败后的消息
   *  }
   */
  join: function (targetUnit, user) {

    if (this.deadline < Date.now()) {
      return {
        result: 0,
        msg: '活动报名已经截止'
      };
    }

    for (var i = 0; i < this.campaing_unit.length; i++) {
      var unit = this.campaign_unit[i];

      var _join = function (unit) {
        for (var i = 0; i < unit.member.length; i++) {
          if (user._id.toString() === unit.member[i]._id.toString()) {
            // 用户已经参加该活动
            return {
              result: false,
              msg: '您已经参加该活动'
            };
          }
        }
        // 用户没有参加
        unit.member.push({
          _id: user._id,
          nickname: user.nickname,
          photo: user.photo
        });
        return {
          result: true
        };
      };

      // 非公司活动
      if (targetUnit.tid && targetUnit.tid.toString() === unit.team._id.toString()) {

        return _join(unit);
      }

      // 公司活动
      if (targetUnit.cid.toString() === unit.company._id.toString()) {
        return _join(unit);
      }

    }
    return {
      result: false,
      msg: '没有找到目标阵营'
    };
  }

};


mongoose.model('Campaign', Campaign);