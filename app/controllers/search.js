//搜索各种数据(公司、组件、成员、地区等等)

'use strict';

var mongoose = require('mongoose'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    async = require('async'),
    User = mongoose.model('User');


//TODO
//列出所有公司
exports.getCompany = function (req, res) {
    var regx = new RegExp(req.body.regx);
    var companies_rst = [];
    Company.find({'info.name':regx}, function (err, companies) {
        if(err) {
            return res.send([]);
        } else {
            if(companies) {
                for(var i = 0; i < companies.length; i ++) {
                    companies_rst.push({
                        '_id' : companies[i]._id,
                        'name' : companies[i].info.name,
                        'team' : companies[i].team,
                        'logo' : companies[i].info.logo
                    });
                }
                return res.send(companies_rst);
            } else {
                return res.send([]);
            }
        }
    });
};


//TODO
//根据公司和组件类型搜索小队
//返回该组件的队名和队长
exports.getTeam = function(req, res) {
  var cid,condition;
  var gid = req.body.gid;
  var tid = req.body.tid;
  var regx = new RegExp(req.body.regx);

  if(req.body.operate === 'part') {
    //返回某公司某类型的所有小队
    cid = req.body.cid;
    condition = {'cid':cid,'gid':gid , '_id':{'$ne': tid}}
  } else {
    //根据队名部分关键字匹配小队
    condition = {'gid':gid,'name':regx , '_id':{'$ne': tid}}
  }
  CompanyGroup.find(condition,function(err, company_groups){
    if(err || !company_groups) {
      return res.send([]);
    } else {
      return res.send(company_groups);
    }
  });
};

exports.recommandTeam = function(req,res) {
  var gid = req.body.gid;
  var tid = req.body.tid;
  async.waterfall([
    function(callback){
      CompanyGroup.findOne({'gid':gid,'_id':tid},{'home_court':1},function (err,companyGroup){
        if(err || !companyGroup){
          callback(err);
        }
        else if(!companyGroup.home_court){//没填写主场
          callback(null,{'result':2,'teams':[]}); //无主场提示
        }
        else{
          var homecourt = companyGroup.home_court[0];
          callback(null,homecourt);
        }
      });
    },
    function(homecourt ,callback){
      CompanyGroup.find({'_id':{$ne:tid},'gid':gid,'home_court':{'$exists':true},'home_court.loc':{'$nearSphere':homecourt.loc.coordinates}},{'_id':1,'name':1,'home_court':1,'logo':1,'member':1})
      .limit(10)
      .exec(function (err, teams){
        if(err){
          callback(err);
        }
        else if(teams.length == 0){//找不到相近的队
          callback(null,{'result':1,'teams':[]});
        }
        else{
          callback(null,{'result':1,'teams':teams});//返回10个推荐队
        }
      });
    }
  ],function(err,result){
    if(err){
      console.log(err);
      return res.send(500,{'result':0,'msg':'500'});
    }
    else{
      return res.send(result);
    }
  });
};



//全都让前台判断去吧
function findComapnyGroup(condition,req,res)
{
  //var users = [];
  //var leaders = [];
  CompanyGroup.findOne(condition,{'member':1,'leader':1},function (err,cg) {
    if(err || !cg) {
      return res.send([]);
    } else {
      //var users = [];
      //var ls = [];
      var members = cg.member;
      var leaders = cg.leader;
      // var flag = false;
      // for(var i = 0; i < members.length; i ++) {
      //   for(var j = 0 ;j < leaders.length; j ++) {
      //     if(members[i]._id.toString() === leaders[j]._id.toString()){
      //       flag = true;
      //     }
      //   }
      //   if(!flag){
      //     users.push(members[i]);
      //   }else{
      //     ls.push(members[i]);
      //   }
      //   flag = false;
      // }
      // console.log(ls);
      return res.send({
        'users':members,
        'leaders':leaders
      });
    }
  });
}


//TODO
//根据公司id搜索成员
exports.getUser = function(req, res) {
  if(req.body.tid != 'null'){
    var tid = req.body.tid;   //找选择了该队的员工
    findComapnyGroup({'_id':tid},req,res);
  }else{
    var cid = req.user.provider === 'company' ? req.user._id : req.user.cid;
    User.find({'cid':cid},function (err,users){
      if(err || !users){
        res.send(500,[]);
      }else{
        var _users = [];
        for(var i = 0 ; i < users.length; i ++){
          _users.push({
            '_id':users[i]._id,
            'nickname':users[i].nickname,
            'photo':users[i].photo
          });
        }
        res.send(_users);
      }
    });
  }
};





exports.getMember = function(req, res) {
  var cid = req.params.companyId;
  User.find({'cid': cid}, {'_id':1,'username':1,'nickname':1,'photo':1,'realname':1,'department':1,'position':1,'sex':1,'register_date':1,'group':1,'birthday':1,'bloodType':1,'phone':1,'qq':1,'introduce':1},function (err, users){
    if(err || !users){
      console.log('ERROR:',err);
      return res.send([]);
    }else{
      return res.send(users);
    }
  });
};
