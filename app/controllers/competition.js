'use strict';
var mongoose = require('mongoose'),
    encrypt = require('../middlewares/encrypt'),
    Company = mongoose.model('Company'),
    CompanyGroup = mongoose.model('CompanyGroup'),
    User = mongoose.model('User'),
    GroupMessage = mongoose.model('GroupMessage'),
    Group = mongoose.model('Group'),
    Arena = mongoose.model('Arena'),
    moment = require('moment'),
    Config = mongoose.model('Config'),
    photo_album_controller = require('./photoAlbum'),
    message = require('../controllers/message.js'),
    Campaign = mongoose.model('Campaign'),
    model_helper = require('../helpers/model_helper');


function booleanJudge(own,opposite){
  if(own && opposite){
    return 0;
  }
  if(own && !opposite){
    return 1;
  }
  if(!own && opposite){
    return 2;
  }
  if(!own && !opposite){
    return 3;
  }
}
//比赛
exports.getCompetition = function(req, res){
  var timeout = Config.COMPETITION_CONFIRM_TIMEOUT;
  if(req.role ==='GUESTHR' || req.role ==='GUEST'){
    return res.send(403,forbidden);
  }
  var competition = req.campaign;
  var parent_name, parent_url;
  for (var i = 0, teams = req.user.team; i < teams.length; i++) {
    var index = competition.team.indexOf(req.role==='HR'?teams[i].id.toString():teams[i]._id.toString());
    if (index !== -1) {
      parent_name = competition.camp[index].tname;
      parent_url = '/group/home/' + competition.team[index];
      break;
    }
  }
  var links = [
    {
      text: parent_name,
      url: parent_url
    },
    {
      text: competition.theme,
      active: true
    }
  ];
  var options ={
    'title': '比赛页面',
    'competition' : competition,
    'role': req.role,
    'moment':moment,
    'photo_thumbnails': photo_album_controller.photoThumbnailList(competition.photo_album, 4),
    'links': links
  };
  if(req.user.provider==='user'){
    options.user={'_id':req.user._id,'nickname':req.user.nickname,'photo':req.user.photo};
  }
  options.team = req.competition_team;
  options.competition_leader = req.competition_leader;
  if(!competition.active &&competition.camp[1].start_confirm){
    return res.render('competition/football', options);
  }
  if(!competition.camp[1].start_confirm ){
    if(req.competition_leader.indexOf(1)>-1){
      options.response_flag = true;
    }
    if(req.user.provider==='user'&&req.competition_team.length>0){
      options.vote_flag=[];
      req.competition_team.forEach(function(value){
        if(model_helper.arrayObjectIndexOf(competition.camp[value].vote.positive_member,req.user._id,'uid')>-1){
          options.vote_flag[value]=1;
        }
        else{
          options.vote_flag[value]=0;
        }
      });
    }
  }
  else if(competition.end_time<new Date()){
    options.score_flag = true;
    if(req.competition_leader.length>0){
      if(req.competition_leader.length===competition.camp.length){
        if(competition.camp[0].result.confirm){
          options.confirm_mode =0;
        }
        else{
          options.confirm_mode =3;
        }
      }
      else {
        options.confirm_mode = booleanJudge(competition.camp[req.competition_leader[0]].result.confirm,competition.camp[(req.competition_leader[0]+1)%2].result.confirm);
      }
    }

    //过了时间自动确认
    if(options.confirm_mode==1 && (new Date())-competition.camp[req.competition_leader[0]].result.start_date >= timeout|| options.confirm_mode==2 && (new Date())-competition.camp[(req.competition_leader[0]+1)%2].result.start_date >= timeout){
      competition.camp[options.confirm_mode==2 ?req.competition_leader[0]:(req.competition_leader[0]+1)%2].result.confirm = true;
      competition.save(function(err){
        if(err){
          console.log('同步',err);
        }
      });
    }
  }
  else{
    if(req.user.provider==='user'&&req.competition_team.length>0){
      options.join_flag=[];
      req.competition_team.forEach(function(value){
        if(model_helper.arrayObjectIndexOf(competition.camp[value].member,req.user._id,'uid')>-1){
          options.join_flag[value]=1;
        }
        else{
          options.join_flag[value]=0;
        }
      });
    }
  }
  //console.log(options);
  return res.render('competition/football', options);
};


exports.competition = function(req, res, next, id){

  Campaign.findOne({
      '_id':id
    })
    .populate('photo_album')
    .exec(function(err, competition){
      if (err) return next(err);
      if(competition.end_time<new Date()){
        competition.finish=true;
      }
      req.campaign = competition;
      req.competition_team =[];
      req.competition_leader =[];
      if(req.user.provider ==='company'){
        competition.camp.forEach(function(camp,index){
          if(camp.cid==req.user._id){
            req.competition_team.push(index);
            req.competition_leader.push(index);
          }
        });
      }
      else if(req.user.provider ==='user'){
        competition.camp.forEach(function(camp,index){
          var teamIndex = model_helper.arrayObjectIndexOf(req.user.team,camp.id,'_id');
          if(teamIndex>-1){
            req.competition_team.push(index);
            if(req.user.team[teamIndex].leader){
              req.competition_leader.push(index);
            }
          }
        });
      }
      next();
  });

};

//某一方发送或者修改比赛成绩确认消息
exports.resultConfirm = function (req, res) {
  if(req.role !=='HR' && req.role !=='LEADER'){
    return res.send(403,'forbidden');
  }
  var competition_id = req.params.competitionId;

  var rst_accept = req.body.rst_accept;

  var score_a = req.body.score_a;
  var score_b = req.body.score_b;
  var rst_content = req.body.rst_content;

  Campaign.findOne({'_id' : competition_id}).populate('team').exec(function (err, competition) {
    if(err) {
      console.log(err);
      res.send(err);
    } else {
      //本组的index
      var _campFlag,_otherCampFlag;
      if(req.role ==='HR'){
        _campFlag = req.user._id.toString() === competition.camp[0].cid.toString() ? 0 : 1;
        _otherCampFlag = req.user._id.toString() === competition.camp[0].cid.toString() ? 1 : 0;
      }
      else{
        _campFlag = req.user.cid.toString() === competition.camp[0].cid.toString() ? 0 : 1;
        _otherCampFlag = req.user.cid.toString() === competition.camp[0].cid.toString() ? 1 : 0;
      }
      competition.camp[_campFlag].result.confirm = true;
      if(!rst_accept) {

        //由于页面双方顺序待定,此处也待定
        competition.camp[0].score = score_a;
        competition.camp[1].score = score_b;
        // competition.camp[_campFlag].score = score_a;
        // competition.camp[_otherCampFlag].score = score_b;

        competition.camp[_otherCampFlag].result.confirm = false;
        competition.camp[_campFlag].result.content = rst_content;
        competition.camp[_campFlag].result.start_date = new Date();
      }
      competition.save(function (err){
        if(err){
          return res.send(err);
        } else {
          GroupMessage.findOne({campaign:competition._id},function(err,groupMessage){
            groupMessage.message_type = 6;
            groupMessage.create_time = new Date();
            groupMessage.save(function(err){
              if(err){
                console.log(err);
              }else{
                //发送站内信
                if(competition.team[_otherCampFlag].leader.length > 0){
                  var olid = competition.team[_otherCampFlag].leader[0]._id;
                  var team = {
                    '_id':competition.team[_campFlag]._id,
                    'name':competition.team[_campFlag].name,
                    'provoke_status': (competition.camp[_campFlag].result.confirm && competition.camp[_otherCampFlag].result.confirm) ? 3 : 2,
                  };
                  message.resultConfirm(req,res,olid,team,competition_id);
                }
              }
            });
          });
          res.send({'result':0,'msg':'SUCCESS'});
        }
      });
    }
  });
};