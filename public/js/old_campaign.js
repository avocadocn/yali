// todo 改动旧数据结构

/**
 * 改动如下
 *   team -> tid, 去除ref
 *   添加campaign_unit属性
 */

var companies = db.companies.find();
db.campaigns.find({'campaign_type':3},function(err,campaigns){
  if(err||!campaigns){
    console.log(err);
  }
  else{
    campaigns.forEach(function(campaign) {
      db.groupmessages.remove({'campaign':campaign._id});
      campaign.remove();
    });
  }
});

companies.forEach(function (company) {

  db.campaigns.find({'cid': company._id }).forEach(function (campaign) {


    if (!campaign.team) {
      //已经是新数据了
    }
    else if ( campaign.team.length <= 1) {//公司+单队
      campaign.tid = campaign.team;
      campaign.campaign_unit = [{
        company: {
          _id: company._id,
          name: company.info.official_name,
          logo: company.info.logo
        },
        member: [],
        member_quit: []
      }];
      campaign.member && campaign.member.forEach(function (member) {
        campaign.campaign_unit[0].member.push({
          _id: ObjectId(member.uid),
          nickname: member.nickname,
          photo: member.photo
        });
      });
      campaign.member_quit && campaign.member_quit.forEach(function (member) {
        campaign.campaign_unit[0].member_quit.push({
          _id: ObjectId(member.uid),
          nickname: member.nickname,
          photo: member.photo
        });
      });
      var teamInfo = {};

      db.companygroups.find({'cid': company._id}).forEach(function (team) {
        if (campaign.team[0] && team._id.toString() === campaign.team[0].toString()) {
          teamInfo = {
            _id: team._id,
            name: team.name,
            logo: team.logo
          };
          campaign.campaign_unit[0].team = teamInfo;
        }
      });
    } else if (campaign.team.length === 2) {
      campaign.tid = campaign.team;
      campaign.campaign_unit = [];
      campaign.camp.forEach(function (camp) {
        var unit = {
          company: {
            _id: company._id,
            name: company.info.official_name,
            logo: company.info.logo
          },
          team: {
            _id: camp.id,
            name: camp.tname,
            logo: camp.logo
          },
          member: [],
          member_quit: [],
          vote: {
            positive: camp.vote.positive || 0,
            positive_member: [],
            negative: camp.vote.negative || 0,
            negative_member: []
          },
          start_confirm: camp.start_confirm
        };
        camp.member && camp.member.forEach(function (member) {
          unit.member.push({
            _id: ObjectId(member.uid),
            nickname: member.nickname,
            photo: member.photo
          });
        });
        camp.member_quit && camp.member_quit.forEach(function (member) {
          unit.member_quit.push({
            _id: ObjectId(member.uid),
            nickname: member.nickname,
            photo: member.photo
          });
        });
        camp.vote.positive_member && camp.vote.positive_member.forEach(function (member) {
          unit.vote.positive_member.push({
            _id: ObjectId(member.uid),
            nickname: member.nickname,
            photo: member.photo
          });
        });
        camp.vote.positive_member && camp.vote.negative_member.forEach(function (member) {
          unit.vote.negative_member.push({
            _id: ObjectId(member.uid),
            nickname: member.nickname,
            photo: member.photo
          });
        });
        campaign.campaign_unit.push(unit);
      });
    }

    db.campaigns.save(campaign);

  });

});



