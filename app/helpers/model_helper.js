'use strict';


var arrayObjectIndexOf = function(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property].toString() === searchTerm.toString()) return i;
    }
    return -1;
};

exports.arrayObjectIndexOf = arrayObjectIndexOf;

exports.sendCampaignsForApp = function(user, campaigns, res) {
  var response_data = [];

  campaigns.forEach(function(campaign) {


    var is_join = false;
    for (var i = 0; i < campaign.member.length; i++) {
      if (user._id.toString() === campaign.member[i].uid.toString()) {
        is_join = true;
      }
    }

    var opponent_list = [];
    var group_index = arrayObjectIndexOf(user.group, campaign.gid, '_id');
    if (group_index > -1) {
      for (var i = 0; i < campaign.team.length; i++) {
        var team = campaign.team[i];
        var team_index = arrayObjectIndexOf(user.group[group_index].team, team._id, 'id')
        if (team_index > -1) {
          var team_name = team.name;
          var team_id = team._id;
        }
        if (team_index === -1) {
          opponent_list.push({
            _id: team._id,
            name: team.name,
            logo: team.logo,
            cname: team.cname
          });
        }
      }
    }


    response_data.push({
      _id: campaign._id,
      team_name: team_name,
      team_id: team_id,
      opponent_list: opponent_list,
      content: campaign.content,
      start_time: campaign.start_time,
      member_count: campaign.member.length,
      is_join: is_join
    });
  });

  res.send({ result: 1, msg: '获取活动列表成功', data: response_data });

};