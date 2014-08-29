'use strict';


var arrayObjectIndexOf = function(myArray, searchTerm, property) {
  for(var i = 0, len = myArray.length; i < len; i++) {
      if (myArray[i][property].toString() === searchTerm.toString()) return i;
  }
  return -1;
};

exports.arrayObjectIndexOf = arrayObjectIndexOf;

var formatTime = function(time){
  var now = new Date();
  if(now.getFullYear()-time.getFullYear()>1){
    return now.getFullYear()-time.getFullYear() +'年前';
  }
  else if(now.getFullYear()-time.getFullYear()==1){
    if(now.getMonth()>=time.getMonth()){
      return '1年前';
    }
    else{
      return 12-time.getMonth()+now.getMonth()+'月前';
    }
  }
  else{
    if(now.getMonth()-time.getMonth()>1){
      return now.getMonth()-time.getMonth()+'月前';
    }
    else if(now.getMonth()-time.getMonth()==1){
      if(now.getDate()>=time.getDate()){
        return '1月前';
      }
      else{
        var temp_day = new Date();
        temp_day.setDate(0);
        return temp_day.getDate()-time.getDate()+now.getDate()+'天前';
      }
    }
    else {
      if(now.getDate()-time.getDate()>1){
        return now.getDate()-time.getDate()+' 天前';
      }
      else if(now.getDate()-time.getDate()==1){
        if(now.getHours()>=time.getHours()){
          return '1天前';
        }
        else{
          return 24-time.getHours()+now.getHours()+'小时前';
        }
      }
      else{
        if(now.getHours()-time.getHours()>1){
          return now.getHours()-time.getHours()+'小时前';
        }
        else if(now.getHours()-time.getHours()==1){
          if(now.getMinutes()>=time.getMinutes()){
            return '1小时前';
          }
          else{
            return 60-time.getMinutes()+now.getMinutes()+'分钟前';
          }
        }
        else{
          if(now.getMinutes()-time.getMinutes()>1){
            return now.getMinutes()-time.getMinutes()+'分钟前';
          }
          else if(now.getMinutes()-time.getMinutes()==1){
            if(now.getSeconds()>=time.getSeconds()){
              return '1分钟前';
            }
            else{
              return 60-time.getSeconds()+now.getSeconds()+'秒前';
            }
          }
          else{
            if(now.getSeconds()-time.getSeconds()>10){
              return now.getSeconds()-time.getSeconds()+'秒前';
            }
            else{
              return '刚刚';
            }
          }
        }
      }
    }
  }

}
var formatCampaign = function(user, campaign) {
  var is_join = false;
  for (var i = 0; i < campaign.member.length; i++) {
    if (user._id.toString() === campaign.member[i].uid.toString()) {
      is_join = true;
    }
  }
  var opponent_list = [];
  var group_index = arrayObjectIndexOf(user.team, campaign.gid, 'gid');
  if (group_index > -1) {
    for (var i = 0; i < campaign.team.length; i++) {
      var team = campaign.team[i];
      var team_index = arrayObjectIndexOf(user.team, team._id, '_id')
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

  return {
    _id: campaign._id,
    team_name: team_name,
    team_id: team_id,
    opponent_list: opponent_list,
    content: campaign.content,
    start_time: campaign.start_time,
    location: campaign.location,
    member: campaign.member,
    is_join: is_join,
    photo_album: campaign.photo_album
  };

};

exports.formatTime = formatTime;
exports.formatCampaign = formatCampaign;

exports.sendCampaignsForApp = function(user, campaigns, res) {
  var response_data = [];

  campaigns.forEach(function(campaign) {


    var output_campaign = formatCampaign(user, campaign);


    response_data.push(output_campaign);
  });

  res.send({ result: 1, msg: '获取活动列表成功', data: response_data });

};