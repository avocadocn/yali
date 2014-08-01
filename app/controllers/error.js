'use strict';

// mongoose models
var mongoose = require('mongoose'),
  Error = mongoose.model('ErrorStatistics');


//增加错误日志
exports.addErrorItem = function(target,type,body){
  var operate = {
    error:{
      target:{
        kind:target.type,
        _id:target._id,
        name:target.name,
        username:target.username,
        email:target.email
      },
      kind:type,
      body:body
    }
  };
  Error.create(operate,function(err,error){
    if(err || !error){
      return {'msg':'ERROR_ADD_FAILED','result':0};
    } else {
      return {'msg':'ERROR_ADD_SUCCESS','result':1};
    }
  });
}