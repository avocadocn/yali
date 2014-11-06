'use strict';
var mongoose = require('mongoose'),
  Campaign = mongoose.model('Campaign'),
  async = require('async');


exports.plugin = function(req,res){
  console.log(req.body.data);
}

exports.testMongoose = function(req,res){
  var time1 = new Date();
  async.waterfall([
    function(callback){
      Campaign.find({'cid':'53aa6fc011fd597b3e1be250'})
      .skip(0)
      .limit(20)
      .sort({'start_time':-1})
      .exec()
      .then(function(campaigns) {
        console.log(campaigns.length);
        callback();
      });
    },
    function(callback){
      Campaign.find({'cid':'53aa6fc011fd597b3e1be250'})
      .skip(20)
      .limit(20)
      .sort({'start_time':-1})
      .exec()
      .then(function(campaigns) {
        console.log(campaigns.length);
        callback();
      });
    },
    function(callback){
      Campaign.find({'cid':'53aa6fc011fd597b3e1be250'})
      .skip(40)
      .limit(20)
      .sort({'start_time':-1})
      .exec()
      .then(function(campaigns) {
        console.log(campaigns.length);
        callback();
      });
    },
    function(callback){
      var time2 = new Date();
      console.log('skip1:',time2-time1);
      callback(null,time2);
    },
    function(time2,callback){
      Campaign.paginate({'cid':'53aa6fc011fd597b3e1be250'},1,20,function(error,pageCount,paginatedResults,itemCount) {
        if(error){
          console.log(error);
        }else{
          console.log('Pages:', pageCount);
          console.log(paginatedResults.length);
          callback(null,time2);
        }
      },{sortBy:{'start_time':-1}});
    },
    function(time2,callback){
      Campaign.paginate({'cid':'53aa6fc011fd597b3e1be250'},2,20,function(error,pageCount,paginatedResults,itemCount) {
        if(error){
          console.log(error);
        }else{
          console.log('Pages:', pageCount);
          console.log(paginatedResults.length);
          callback(null,time2);
        }
      },{sortBy:{'start_time':-1}});
    },
    function(time2,callback){
      Campaign.paginate({'cid':'53aa6fc011fd597b3e1be250'},3,20,function(error,pageCount,paginatedResults,itemCount) {
        if(error){
          console.log(error);
        }else{
          console.log('Pages:', pageCount);
          console.log(paginatedResults.length);
          callback(null,time2);
        }
      },{sortBy:{'start_time':-1}});      
    },
    function(time2,callback){
      var time3 = new Date();
      console.log('skip2',time3-time2);
      callback();
    }
  ],function(err,result) {
    if(err){
      console.log(err);
    }
    else{
      console.log('total:',new Date() - time1);
      res.send();
    }
  });
}
