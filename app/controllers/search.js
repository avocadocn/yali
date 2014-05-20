//搜索各种数据(公司、组件、成员、地区等等)

'use strict';

var mongoose = require('mongoose'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    User = mongoose.model('User');


//TODO
//列出所有公司
exports.getCompany = function (req, res) {
    var companies_rst = [];
    Company.find(null, function (err, companies) {
        if(err) {
            return res.send([]);
        } else {
            if(companies) {

                for(var i = 0; i < companies.length; i ++) {
                    companies_rst.push({
                        '_id' : companies[i]._id,
                        'name' : companies[i].info.name,
                        'team' : companies[i].team
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
//根据队名在所有公司里搜索同类型小队
//以后添加过滤规则
exports.searchTeam = function(req, res) {
  var tname_part = req.body.tname_part;
  var gid = req.session.nowgid;

  var tirm = '老虎-足球';

  Company.find({'group.tname': {'$all':[/老虎-足球/]}}, function (err, companies) {
    if(err) {
      return res.send(err);
    } else {
      if(companies) {
        return res.send(companies);
      } else {
        return res.send('none');
      }
    }
  });
};


//TODO
//根据公司和组件类型搜索小队
//返回该组件的队名和组长
exports.getTeam = function(req, res) {
  var cid = req.body.cid;
  var gid = req.session.nowgid;
  CompanyGroup.find({'cid':cid,'gid':gid},function(err, company_groups){
    if(err || !company_groups) {
      return res.send([]);
    } else {
      return res.send(company_groups);
    }
  });
}


//TODO
//根据公司id搜索成员(该成员不是该队的队长)
exports.getUser = function(req, res) {
  var cid = req.body.cid;   //根据公司名找它的员工

  var _gid = req.body.gid;
  var tid = req.body.tid;   //找选择了该队的员工
  User.find({'cid': cid , 'group':{'$elemMatch':{'gid':_gid, 'team':{'$elemMatch':{'id':tid,'leader':false}}}} },{'_id':1,'nickname':1,'username':1,'group':1}, function (err, users){

    if(err || !users){
      console.log('ERROR');
      return res.send([]);
    }else{
      return res.send(users);
    }
  });
};





exports.getMember = function(req, res) {
  var cid = req.session.nowcid;
  User.find({'cid': cid}, {'_id':1,'username':1,'nickname':1,'photo':1,'realname':1,'department':1,'position':1,'sex':1,'register_date':1,'group':1},function (err, users){

    if(err || !users){
      console.log('ERROR');
      return res.send([]);
    }else{
      console.log(users);
      return res.send(users);
    }
  });
};
