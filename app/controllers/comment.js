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
    model_helper = require('../helpers/model_helper');



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

//获取留言
exports.getComment = function(req,res){
    if(req.role ==='GUESTHR' || req.role ==='GUEST' || req.role ==='GUESTLEADER'){
        return res.send(403);
    }
    // 加 '|| req.params.hostId'完全是为了不破坏以前的代码，这两个如果有的话其实相等！完全不需要req.body.host_id
    var host_id = req.body.host_id || req.params.hostId;  //留言主体的id,这个主体可以是 一条活动、一张照片、一场比赛等等
    //todo: 判断类型
    Comment.find({'host_id' : req.body.host_id,'status' : {'$ne':'delete'}, 'host_type': {'$ne':'photo'}}).sort({'create_date':-1})
    .exec(function(err, comment) {
        if(err || !comment) {
            return res.send([]);
        } else {
            comment.forEach(function(comment){
                comment.set('delete_permission', req.role === 'LEADER' || req.role === 'HR' || comment.poster._id.toString() === req.user._id.toString(), {strict : false});
            });
            return res.send({'comments':comment,'user':{'_id':req.user._id}});
        }
    });
}

//发表留言
exports.setComment = function(req,res){
    // 没用验证中间件，哪来的role！
    if(req.role ==='GUESTHR' || req.role ==='GUEST' || req.role ==='GUESTLEADER'){
        return res.send(403);
    }
    var host_id = req.body.host_id;  //留言主体的id,这个主体可以是 一条活动、一张照片、一场比赛等等
    var content = req.body.content;
    var host_type = req.body.host_type;
    var comment = new Comment();
    var poster = {
        '_id':req.user._id,
        'cid':req.user.cid,
        'cname':req.user.cname,
        'nickname':req.user.nickname,
        'realname':req.user.realname,
        'photo':req.user.photo
    };
    comment.host_type = host_type;
    comment.content = content;
    comment.host_id = host_id;
    comment.poster = poster;
    if (req.body.photos && req.body.photos.length > 0) {
        var max = Math.min(9, req.body.photos.length);
        comment.photos = [];
        for (var i = 0; i < max; i++) {
            comment.photos.push(req.body.photos[i]);
        }
    }
    comment.save(function(err){
        if(err){
            console.log('COMMENT_PUSH_ERROR',err);
            return res.send("{{'COMMENT_PUSH_ERROR'|translate}}");
        } else {
            if(host_type === "campaign" || host_type === "campaign_detail" || host_type === "competition") {
                Campaign.findByIdAndUpdate(host_id,{'$inc':{'comment_sum':1}},function(err,message){
                    if(err || !message) {
                        return res.send({'msg':'ERROR','comment':[]});
                    } else {
                        return res.send({'msg':'SUCCESS','comment':comment});
                    }
                });
            } else {
                return res.send({'msg':'SUCCESS','comment':comment});
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
exports.reply = function (req, res, next) {
    // to do: 权限待定
    if (!req.body.to || !req.body.content) {
        return res.send(400);
    }
    var comment = req.comment;
    var reply = {
        to: req.body.to,
        content: req.body.content
    };
    // 如果回复的目标不是该评论的发表者，则搜寻回复列表是否存在该目标
    var findTarget = true;
    if (reply.to !== comment.poster._id.toString()) {
        findTarget = false;
        if (comment.replies) {
            for (var i = 0; i < comment.replies.length; i++) {
                if (reply.to === comment.replies[i].from._id.toString()) {
                    findTarget = true;
                }
            }
        }
    }
    if (findTarget === false) {
        return res.send(400);
    }
    reply.from = {
        _id: req.user._id,
        cid: req.user.cid,
        cname: req.user.cname,
        nickname: req.user.nickname,
        realname: req.user.realname,
        photo: req.user.photo
    };
    comment.replies.push(reply);
    comment.save(function (err) {
        if (err) {
            return next(err);
        } else {
            return res.send({ result: 1 });
        }
    });
};


//删除留言
exports.deleteComment = function(req,res){
    if(req.role ==='GUESTHR' || req.role ==='GUEST' || req.role ==='GUESTLEADER'){
        res.status(403);
        next('forbidden');
        return;
    }
    var comment_id = req.body.comment_id;
    Comment.findByIdAndUpdate({'_id':comment_id},{'$set':{'status':'delete'}},function (err,comment){
        if(err || !comment) {
            return res.send("COMMENT_NOT_FOUND");
        } else {
            if(comment.host_type === "campaign" || comment.host_type === "campaign_detail") {
                Campaign.findByIdAndUpdate(comment.host_id,{'$inc':{'comment_sum':-1}},function(err,message){
                    if(err || !message) {
                        return res.send("ERROR");
                    } else {
                        return res.send("SUCCESS");
                    }
                });
            } else {
                return res.send("SUCCESS");
            }
        }
    });
    // Comment.remove({'_id':comment_id},function (err, comment) {
    //     if(err || !comment) {
    //         return res.send("{{'COMMENT_NOT_FOUND'|translate}}");
    //     } else {
    //         if(host_type === "campaign" || host_type === "campaign_detail") {
    //             Campaign.findByIdAndUpdate(host_id,{'$inc':{'comment_sum':-1}},function(err,message){
    //                 if(err || !message) {
    //                     return res.send("ERROR");
    //                 } else {
    //                     return res.send("SUCCESS");
    //                 }
    //             });
    //         } else {
    //             return res.send("SUCCESS");
    //         }
    //     }
    // });
}

