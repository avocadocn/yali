// 2015-06-03 为每个小队的增加timeHash属性

var companygroups = db.companygroups.find();
companygroups.forEach(function (team) {
	team.timeHash = new Date();
	db.companygroups.save(team);
});