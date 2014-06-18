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
    Competition = mongoose.model('Competition'),
    Comment = mongoose.model('Comment'),
    moment = require('moment'),
    model_helper = require('../helpers/model_helper'),
    schedule = require('../services/schedule');


//获取留言
exports.getComment = function(req,res){
    if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST' || req.session.role ==='GUESTLEADER'){
        return res.send(403,'forbidden');
    }
    var host_id = req.body.host_id;  //留言主体的id,这个主体可以是 一条活动、一条动态、一张照片、一场比赛等等
    Comment.find({'host_id' : req.body.host_id})
    .exec(function(err, comment) {
        if(err || !comment) {
            return res.send([]);
        } else {
            return res.send(comment);
        }
    });
}

//发表留言
exports.setComment = function(req,res){
    if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST' || req.session.role ==='GUESTLEADER'){
        return res.send(403,'forbidden');
    }
    var host_id = req.body.host_id;  //留言主体的id,这个主体可以是 一条活动、一条动态、一张照片、一场比赛等等
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
    comment.content = content;
    comment.host_id = host_id;
    comment.poster = poster;
    comment.save(function(err){
        if(err){
            console.log('COMMENT_PUSH_ERROR',err);
            return res.send("{{'COMMENT_PUSH_ERROR'|translate}}");
        } else {
            if(host_type === "message") {
                GroupMessage.findByIdAndUpdate(host_id,{'$inc':{'comment_sum':1}},function(err,groupmessage){
                    if(err || !groupmessage) {
                        return res.send("ERROR");
                    } else {
                        return res.send("SUCCESS");
                    }
                });
            } else {
                return res.send("SUCCESS");
            }
        }
    })
}

//删除留言
exports.deleteComment = function(req,res){
    if(req.session.role ==='GUESTHR' || req.session.role ==='GUEST' || req.session.role ==='GUESTLEADER'){
        return res.send(403,'forbidden');
    }
    var comment_id = req.body.comment_id;
    var host_id = req.body.host_id;
    Comment.remove({'_id':comment_id},function (err, comment) {
        if(err || !comment) {
            return res.send("{{'COMMENT_NOT_FOUND'|translate}}");
        } else {
            if(host_type === "message") {
                GroupMessage.findByIdAndUpdate(host_id,{'$dec':{'comment_sum':1}},function(err,groupmessage){
                    if(err || !groupmessage) {
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
}
