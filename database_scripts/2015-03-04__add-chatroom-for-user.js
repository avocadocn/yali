// 2015-03-04 为每个用户添加chatroom属性

var users = db.users.find();
users.forEach(function (user) {

  user.chatrooms = [];

  if (user.team) {
    var teams = user.team.filter(function (team) {
      return (team.entity_type !== 'virtual');
    });
    var teamChatRooms = teams.map(function (team) {
      return {
        _id: team._id,
        join_time: new Date(),
        read_time: new Date()
      };
    });
    user.chatrooms = user.chatrooms.concat(teamChatRooms);
  }

  if (user.role === 'LEADER') {
    user.chatrooms.push({
      _id: user.cid,
      join_time: new Date(),
      read_time: new Date()
    });
  }

  db.users.save(user);
});