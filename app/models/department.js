'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


//员工申请
var _member = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    nickname: String,
    photo: String,
    apply_status:{
      type:String,
      enum:['pass','reject','wait'],
      default:'wait'
    }
});

var Department = new Schema({
  name:String,
  company:{
    _id:Schema.Types.ObjectId,
    name:String,
    logo:String
  },
  team:{
    type: Schema.Types.ObjectId,
    ref: 'CompanyGroup'
  },
  manager:{
    _id:Schema.Types.ObjectId,
    nickname:String,
    photo:String
  },
  member:[_member]
});


mongoose.model('Department', Department);