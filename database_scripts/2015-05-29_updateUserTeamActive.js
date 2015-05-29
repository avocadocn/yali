// 2015-05-03 为每个用户的team属性增加active属性

var users = db.users.find();
users.forEach(function (user) {
	user.team.forEach(function(team) {
		team.active = true;
	});
	db.users.save(user);
});