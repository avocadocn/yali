// 2015-06-05 为每个活动增加timeHash属性

var campaigns = db.campaigns.find();
campaigns.forEach(function (campaign) {
	campaign.timeHash = new Date();
	db.campaigns.save(campaign);
});