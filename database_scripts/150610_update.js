// 2015-05-03 为每个用户的增加timeHash属性

var users = db.users.find();
users.forEach(function (user) {
	user.timeHash = new Date();
	db.users.save(user);
});
// 2015-06-03 为每个小队的增加timeHash属性

var companygroups = db.companygroups.find();
companygroups.forEach(function (team) {
	team.timeHash = new Date();
	db.companygroups.save(team);
});
// 2015-06-05 为每个活动增加timeHash属性

var campaigns = db.campaigns.find();
campaigns.forEach(function (campaign) {
	campaign.timeHash = new Date();
	db.campaigns.save(campaign);
});