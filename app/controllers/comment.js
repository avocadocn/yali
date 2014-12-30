'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  encrypt = require('../middlewares/encrypt'),
  crypto = require('crypto'),
  meanConfig = require('../../config/config'),
  GroupMessage = mongoose.model('GroupMessage'),
  Campaign = mongoose.model('Campaign'),
  User = mongoose.model('User'),
  Company = mongoose.model('Company'),
  CompanyGroup = mongoose.model('CompanyGroup'),
  Comment = mongoose.model('Comment'),
  moment = require('moment'),
  model_helper = require('../helpers/model_helper'),
  auth = require('../services/auth'),
  photo_album_ctrl = require('./photoAlbum.js'),
  async = require('async'),
  socketClient = require('../services/socketClient');


var shieldTip = "该评论已经被系统屏蔽";
/**
 * 为comments的每个comment设置权限
 * @param {Object} data 用户和评论的相关数据
 * data: {
 *     host_type: String, // 留言或评论目标对象类型, campaign or photo
 *     host_id: String, // 目标对象id
 *     user: Object, // req.user
 *     comments: Array // 数组元素类型为mongoose.model('Comment')
 * }
 * @param {Function} callback 设置结束的回调, callback(err)
 */
var setDeleteAuth = function setDeleteAuth(data, callback) {
  var user = data.user;
  var _auth = function (callback) {
    for (var i = 0; i < data.comments.length; i++) {
      var comment = data.comments[i];
      var can_delete = false;

      if (user.provider === 'company') {
        if (comment.poster.cid.toString() === user._id.toString()) {
          can_delete = true;
        }
      } else if (user.provider === 'user') {
        if (comment.poster._id.toString() === user._id.toString()) {
          can_delete = true;
        }
        // 其它情况，如user是队长
        if (callback) {
          can_delete = !!callback(comment);
        }
      }
      comment.set('delete_permission', can_delete, {strict: false});
      comment.delete_permission = can_delete;
      if (comment.status === 'shield') {
        comment.set('content', shieldTip, {strict: false});
      }
    }
  };

  switch (data.host_type) {
    case 'campaign_detail':
    // waterfall
    case 'campaign':
      // 评论目标是活动
      Campaign.findById(data.host_id).exec()
        .then(function (campaign) {
          var is_leader = false;
          if (campaign.team && user.provider === 'user') {
            for (var i = 0; i < campaign.team.length; i++) {
              if (user.isTeamLeader(campaign.team[i].toString())) {
                is_leader = true;
                break;
              }
            }
          }
          if (is_leader) {
            _auth(function (comment) {
              // 是leader可以删除活动中自己公司成员发的评论
              if (comment.poster.cid.toString() === user.cid.toString()) {
                return true;
              } else {
                return false;
              }
            });
            callback && callback();
          } else {
            _auth();
            callback && callback();
          }
        })
        .then(null, function (err) {
          _auth();
          callback(err);
        });
      break;
    case 'photo':
      // todo: 评论目标是照片
      _auth();
      callback();
      break;
    case 'comment':
      Comment.findById(data.host_id).exec()
        .then(function (comment) {
          if (!comment) {
            return callback('not found');
          }
          setDeleteAuth({
            host_type: comment.host_type,
            host_id: comment.host_id,
            user: user,
            comments: data.comments
          }, callback);
        })
        .then(null, function (err) {
          callback(err);
        });
      break;
    default:
      _auth();
      callback();
      break;
  }

};

exports.getCommentById = function (req, res, next) {
  Comment.findById(req.params.commentId).exec()
    .then(function (comment) {
      if (!comment) {
        return res.send(404);
      } else {
        req.comment = comment;
        next();
      }
    })
    .then(null, function (err) {
      next(err);
    });
};

/**
 * [userReadComment description]
 * @param  {object} user 用户
 * @param  {string} campaignId 看的是哪个活动的评论
 */
var userReadComment = function (user, campaignId) {
  var find = false;
  for(var i=0; i<user.commentCampaigns.length; i++){
    if(campaignId.toString()===user.commentCampaigns[i]._id.toString()) {
      user.commentCampaigns[i].unread = 0;
      find = true;
      break;
    }
  }
  if(!find){
    for(var i=0; i<user.unjoinedCommentCampaigns.length; i++){
      if(campaignId.toString()===user.unjoinedCommentCampaigns[i]._id.toString()) {
        user.unjoinedCommentCampaigns[i].unread = 0;
        find = true;
        break;
      }
    }
  }
  user.save(function(err){
    if(err){
      console.log('user save error:',err);
    }
  });
};

//获取留言
exports.getComment = function (req, res) {
  Comment.getComments({
    hostType: req.params.commentType,
    hostId: req.params.hostId
  }, req.body.create_date, req.body.num, function (err, comments, nextStartDate) {
    setDeleteAuth({
      host_type: req.params.commentType,
      host_id: req.params.hostId,
      user: req.user,
      comments: comments
    }, function (err) {
      if (err) console.log(err);
      if(req.user.provider=='user') {
        userReadComment(req.user, req.params.hostId);
      }
      // 即使错误依然会做基本的权限设置（公司可删自己员工的，自己可以删自己的），所以依旧返回数据
      res.send({'comments': comments, nextStartDate: nextStartDate, 'user': {'_id': req.user._id}});
      
    });
  });
}

exports.canPublishComment = function (req, res, next) {
  var host_id = req.body.host_id;
  var host_type = req.body.host_type.toLowerCase();
  switch (host_type) {
  case 'campaign':
    Campaign.findById(host_id).exec()
    .then(function (campaign) {
      if (!campaign) {
        return res.send(403);
      }
      var allow = auth(req.user, {
        companies: campaign.cid,
        teams: campaign.tid
      }, ['publishComment']);
      if (allow.publishComment === false) {
        return res.send(403);
      } else {
        next();
      }
    })
    .then(null, function (err) {
      next(err);
    });
    break;
  default:
    return res.send(403);
  }
};

//for push comment
//自己评论就把这个活动拎上来，unread数不增加
var updateUserCommentList = function(campaign, user, reqUserId, callback){
  var arrayMaxLength = 20;
  if(campaign.whichUnit(user._id)) {//已参加
    var campaignIndex = model_helper.arrayObjectIndexOf(user.commentCampaigns, campaign._id, '_id');
    if(campaignIndex === -1){//如果user中没有
      //放到最前,数组长度到max值时去掉最后面的campaign
      user.commentCampaigns.unshift({
        '_id': campaign._id,
        'unread': user._id.toString() == reqUserId.toString() ? 0 : 1
      });
      if(user.commentCampaigns.length>arrayMaxLength){
        user.commentCampaigns.length = arrayMaxLength;
      }
    }else{//如果存在于user中
      //更新到最前,如果不是自己发的,unread数增加
      if(user._id.toString() != reqUserId.toString())
        user.commentCampaigns[campaignIndex].unread++;
      var campaignNeedUpdate = user.commentCampaigns.splice(campaignIndex,1);
      user.commentCampaigns.unshift(campaignNeedUpdate[0]);
    }
  }else{
    var campaignIndex = model_helper.arrayObjectIndexOf(user.unjoinedCommentCampaigns, campaign._id, '_id');
    if(campaignIndex === -1){//如果user中没有
      //放到最前,数组长度到max值时去掉最后面的campaign
      user.unjoinedCommentCampaigns.unshift({
        '_id': campaign._id,
        'unread': user._id.toString() == reqUserId.toString() ? 0 : 1
      });
      if(user.unjoinedCommentCampaigns.length>arrayMaxLength){
        user.unjoinedCommentCampaigns.length = arrayMaxLength;
      }
    }else{//如果存在于user中
      //更新到最前,如果不是自己发的,unread数增加
      if(user._id.toString() != reqUserId.toString())
        user.unjoinedCommentCampaigns[campaignIndex].unread++;
      var campaignNeedUpdate = user.unjoinedCommentCampaigns.splice(campaignIndex,1);
      user.unjoinedCommentCampaigns.unshift(campaignNeedUpdate[0]);
    }
  }
  user.save(function(err){
    if(err){
      console.log('user save error:',err);
    }else{
      callback();
    }
  });
};

var socketPush = function(campaign, comment, joinedUids, unjoinedUids){
  var commentCampaign = {
    '_id':campaign._id,
    'theme': campaign.theme,
    'latestComment': campaign.latestComment
  };
  var ct = campaign.campaign_type;
  if(ct===1){
    commentCampaign.logo = campaign.campaign_unit[0].company.logo;
  }
  else if(ct===2||ct===6){//是单小队/部门活动
    commentCampaign.logo = campaign.campaign_unit[0].team.logo;
  }else{//是挑战
    commentCampaign.logo = '/img/icons/vs.png';//图片todo
  }
  var socketComment = {
    '_id': comment._id,
    'poster': comment.poster,
    'createDate': comment.create_date,
    'content': comment.content
  };
  if(comment.photos){
    socketComment.photos = comment.photos;
  }
  socketClient.pushComment(joinedUids, unjoinedUids, commentCampaign, socketComment);
}
//发表留言
exports.setComment = function (req, res) {
  var host_id = req.body.host_id;  //留言主体的id,这个主体可以是 一条活动、一张照片、一场比赛等等
  var content = req.body.content;
  var host_type = req.body.host_type.toLowerCase();
  var comment = new Comment();
  var poster = {
    '_id': req.user._id,
    'cid': req.user.cid,
    'cname': req.user.cname,
    'nickname': req.user.nickname,
    'realname': req.user.realname,
    'photo': req.user.photo
  };
  comment.host_type = host_type;
  comment.content = content;
  comment.host_id = host_id;
  comment.poster = poster;
  comment.create_date = Date.now();

  if (req.session.uploadData) {
    // 如果有上传照片的数据，依然要判断是否过期
    var aMinuteAgo = Date.now() - moment.duration(1, 'minutes').valueOf();
    aMinuteAgo = new Date(aMinuteAgo);

    if (aMinuteAgo <= req.session.uploadData.date) {
      // 在一分钟之内，上传的照片有效
      comment.photos = req.session.uploadData.photos;
    }
    req.session.uploadData = null;
  }

  comment.save(function (err) {
    if (err) {
      console.log('COMMENT_PUSH_ERROR', err);
      return res.send("{{'COMMENT_PUSH_ERROR'|translate}}");
    } else {
      res.send(202,{'msg':'SUCCESS','comment':comment});
      //更新campaign & users
      if (host_type === "campaign" || host_type === "campaign_detail" || host_type === "competition") {
        Campaign.findById(host_id,function(err, campaign){
          campaign.comment_sum++;
          var poster = {
            '_id': req.user._id,
            'nickname': req.user.nickname,
            'photo': req.user.photo
          };
          campaign.latestComment = {
            '_id': comment._id,
            'poster': poster,
            'content': content,
            'createDate': comment.create_date
          };
          //如果不在已评论过的人列表
          if(model_helper.arrayObjectIndexOf(campaign.commentMembers, req.user._id, '_id') === -1){
            campaign.commentMembers.push(poster);
          }

          //socket与users更新
          //参加的人
          var joinedUids = [];
          for(var i = 0; i<campaign.members.length; i++) {
            joinedUids.push(campaign.members[i]._id.toString());
          }
          //未参加
          var unjoinedUids = [];
          for(var i = 0; i<campaign.commentMembers.length;i++) {
            if(joinedUids.indexOf(campaign.commentMembers[i]._id.toString()) === -1){
              unjoinedUids.push(campaign.commentMembers[i]._id.toString());
            }
          }
          //---socket
          socketPush(campaign, comment, joinedUids, unjoinedUids);

          campaign.save(function(err){
            if(err){
              console.log('campaign save error:',err);
            }
          });

          //users操作
          var revalentUids = joinedUids.concat(unjoinedUids);
          User.find({'_id':{'$in':revalentUids}},{'commentCampaigns':1,'unjoinedCommentCampaigns':1},function(err,users){
            if(err){
              console.log(err);
            }else{
              async.map(users,function(user,callback){
                updateUserCommentList(campaign, user, req.user._id, function(){
                  callback();
                });
              },function(err, results) {
                return;
              });
            }
          });
        });
      }
    }
  });
};

/**
 * 回复评论
 * req.body.reply:
 *     to: String,
 *     content: String //回复内容
 */
//功能关闭 -M 2014/12/10
exports.reply = function (req, res, next) {
  // //非Guest、HR皆可评,包括比赛对方小队成员
  // if (req.role === 'GUEST' || req.role === 'HR') {
  //   return res.send(403);
  // }
  // if (!req.body.to || !req.body.content) {
  //   return res.send(400);
  // }

  // var comment = req.comment;

  // var createReply = function (target_nickname) {
  //   // 创建评论并保存
  //   var reply = new Comment({
  //     host_type: 'comment',
  //     host_id: comment._id,
  //     content: req.body.content,
  //     poster: {
  //       _id: req.user._id,
  //       cid: req.user.cid,
  //       cname: req.user.cname,
  //       nickname: req.user.nickname,
  //       realname: req.user.realname,
  //       photo: req.user.photo
  //     },
  //     reply_to: {
  //       _id: req.body.to,
  //       nickname: target_nickname
  //     }
  //   });
  //   reply.save(function (err) {
  //     if (err) {
  //       return next(err);
  //     } else {
  //       if (!comment.reply_count) {
  //         comment.reply_count = 0;
  //       }
  //       comment.reply_count++;
  //       comment.save(function (err) {
  //         if (err) console.log(err);
  //       });
  //       // 该回复已保存成功，所以不需要判断目标留言的回复数是否保存成功，都直接返回回复成功信息。
  //       // 如果计数偶然保存失败，再回复时还有机会校正。

  //       setDeleteAuth({
  //         host_type: 'comment',
  //         host_id: comment._id,
  //         user: req.user,
  //         comments: [reply]
  //       }, function (err) {
  //         if (err) { console.log(err); }
  //         // 设置删除权限失败依然算作回复成功，删除权设置成功都不影响回复是否成功，只影响页面是否有删除按钮
  //         // 此时确实也已经回复成功了
  //         return res.send({ result: 1, reply: reply });
  //       })

  //     }
  //   });
  // };

  // var target_nickname;
  // if (req.body.to === comment.poster._id.toString()) {
  //   // 如果回复的是该留言，则获取poster的nickname
  //   target_nickname = comment.poster.nickname;
  //   createReply(target_nickname);
  // } else {
  //   Comment.find({ 'host_type': 'comment', 'host_id': comment._id }).exec()
  //     .then(function (replies) {
  //       // 判断回复目标的合法性，并获取目标昵称
  //       var reply_target_validation = false;
  //       for (var i = 0; i < replies.length; i++) {
  //         var reply = replies[i];
  //         if (req.body.to === reply.poster._id.toString()) {
  //           reply_target_validation = true;
  //           target_nickname = reply.poster.nickname;
  //           break;
  //         }
  //       }
  //       if (reply_target_validation === false) {
  //         return res.send(400);
  //       }

  //       createReply(target_nickname);

  //     })
  //     .then(null, function (err) {
  //       return next(err);
  //     });
  // }

};


exports.getReplies = function (req, res, next) {
  Comment.find({ 'host_type': 'comment', 'host_id': req.params.commentId, 'status': 'active' }).exec()
    .then(function (replies) {
      setDeleteAuth({
        host_type: req.comment.host_type,
        host_id: req.comment.host_id,
        user: req.user,
        comments: replies
      }, function (err) {
        if (err) {
          console.log(err);
        }
        return res.send({ result: 1, replies: replies });
      });
    })
    .then(null, function (err) {
      return next(err);
    });
};


//删除留言
exports.deleteComment = function (req, res, next) {
  var comment = req.comment;
  setDeleteAuth({
    host_type: comment.host_type,
    host_id: comment.host_id,
    user: req.user,
    comments: [comment]
  }, function (err) {
    if (err) {
      console.log(err);
    }
    if (comment.delete_permission) {
      comment.status = 'delete';
      comment.save(function (err) {
        if (err) {
          console.log(err);
          return res.send({ result: 0, msg: 'error' });
        }
        // save成功就意味着已经改为delete状态，后续操作不影响已经成功这个事实，故直接返回成功状态
        res.send({ result: 1, msg: 'success' });

        // 计数-1
        if (comment.host_type === "campaign" || comment.host_type === "campaign_detail") {
          Campaign.findByIdAndUpdate(comment.host_id, {
            '$inc': {
              'comment_sum': -1
            }
          }, function (err, message) {
            if (err) {
              console.log(err);
            }
          });
        }
        // 同时在相册移除相应的照片
        if (comment.photos && comment.photos.length > 0) {
          var photoIds = [];
          comment.photos.forEach(function (photo) {
            photoIds.push(photo._id);
          });
          photo_album_ctrl.deletePhotos(photoIds, function (err) {
            if (err) {
              console.log(err);
            }
          });
        }
        // 如果comment的目标类型是comment，将comment的计数-1
        if (comment.host_type === 'comment') {
          Comment.findByIdAndUpdate(comment.host_id, {
            '$inc': {
              'reply_count': -1
            }
          }, function (err) {
            if (err) {
              console.log(err);
            }
          });
        }
      });
    } else {
      res.status(403);
      return next('forbidden');
    }
  });

}

