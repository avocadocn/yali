// 2015-05-29 为每个用户的team属性增加active属性

// var users = db.users.find();
// users.forEach(function (user) {
// 	user.team.forEach(function(team) {
// 		team.active = true;
// 	});
// 	db.users.save(user);
// });

// 2015-06-05 为每个用户的team属性增加active属性
var teams = db.teams.find();

teams.forEach(function(team) {
	if(team.active) {
    db.users.update({
      'team': {
        '$elemMatch': {
          '_id': team.id
        }
      }
    }, {
      '$set': {
        'team.$.active': true
      }
    }, {
      multi: true
    });
	} else {
    db.users.update({
      'team': {
        '$elemMatch': {
          '_id': team.id
        }
      }
    }, {
      '$set': {
        'team.$.active': false
      }
    }, {
      multi: true
    });
  }
})