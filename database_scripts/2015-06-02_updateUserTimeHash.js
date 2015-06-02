// 2015-05-03 为每个用户的增加timeHash属性

var users = db.users.find();
users.forEach(function (user) {
	user.timeHash = new Date();
	db.users.save(user);
});