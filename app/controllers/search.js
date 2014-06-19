//搜索各种数据(公司、组件、成员、地区等等)

'use strict';

var mongoose = require('mongoose'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
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
//返回该组件的队名和组长
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
}



function findUser()
{

}

function findComapnyGroup(condition,req,res)
{
  var users = [];
  var leaders = [];
  CompanyGroup.findOne(condition,{'member':1,'leader':1},function (err,cg) {
    if(err || !cg) {
      return res.send([]);
    } else {
      var users = [];
      var ls = [];
      var members = cg.member;
      var leaders = cg.leader;
      var flag = false;
      for(var i = 0; i < members.length; i ++) {
        for(var j = 0 ;j < leaders.length; j ++) {
          if(members[i]._id.toString() === leaders[j]._id.toString()){
            flag = true;
          }
        }
        if(!flag){
          users.push(members[i]);
        }else{
          ls.push(members[i]);
        }
        flag = false;
      }
      console.log(ls);
      return res.send({
        'users':users,
        'leaders':ls
      });
    }
  });
}


//TODO
//根据公司id搜索成员
exports.getUser = function(req, res) {
  var tid = req.body.tid;   //找选择了该队的员工
  findComapnyGroup({'_id':tid},req,res);
};





exports.getMember = function(req, res) {
  var cid = req.session.nowcid;
  User.find({'cid': cid}, {'_id':1,'username':1,'nickname':1,'photo':1,'realname':1,'department':1,'position':1,'sex':1,'register_date':1,'group':1,'birthday':1,'bloodType':1,'phone':1,'qq':1,'introduce':1},function (err, users){

    if(err || !users){
      console.log('ERROR');
      return res.send([]);
    }else{
      console.log(users);
      return res.send(users);
    }
  });
};
