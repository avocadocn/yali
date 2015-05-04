// 2015-05-03 为每个活动添加number_of_members(参加人数)属性

var campaigns = db.campaigns.find();
campaigns.forEach(function (campaign) {
  var members = [];
  if(campaign.campaign_unit != null || campaign.campaign_unit != undefined) {
    campaign.campaign_unit.forEach(function(unit) {
      members = members.concat(unit.member);
    });
    campaign.number_of_members = members.length;

    db.campaigns.save(campaign);
  }
});