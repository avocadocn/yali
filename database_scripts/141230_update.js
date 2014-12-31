// 2014-12-29 更新评论中的照片数据，添加上传信息

var comments = db.comments.find();
comments.forEach(function (comment) {
  if (comment.photos) {
    comment.photos.forEach(function (photo) {
      if (photo._id) {
        var oriPhoto = db.photos.findOne({ _id: photo._id });
        if (oriPhoto) {
          photo.upload_user = oriPhoto.upload_user;
        }
      }
    });
  }
  db.comments.save(comment);
});

// 2014-12-29 添加相册最近上传者的数据，以及尺寸信息

var photoAlbums = db.photoalbums.find();
photoAlbums.forEach(function (photoAlbum) {
  photoAlbum.photos.forEach(function (photo) {
    if (photo._id) {
      var oriPhoto = db.photos.findOne({ _id: photo._id });
      if (oriPhoto) {
        photo.width = oriPhoto.width;
        photo.height = oriPhoto.height;
        photo.upload_user = oriPhoto.upload_user;
      }
    }
  });
  db.photoalbums.save(photoAlbum);
});

//将官方小队增加poster属性
db.companygroups.update({poster:{'$exists':false}},{$set:{poster:{role:'HR'}}},{multi:true})

// 2014-12-31 更新个人参加的活动数和积分
var now = new Date();
var users = db.users.find();
users.forEach(function (user) {
  var campaignCount = db.campaigns.count({
    'active':true,
    'cid':user.cid,
    'campaign_unit.member._id':user._id,
    'end_time':{'$lte':now}
  });
  var teamCount = user.team.length;
  user.score = {};
  user.campaignCount = campaignCount;
  user.score.joinOfficialTeam = teamCount * 5;
  user.score.officialCampaignSucceded = campaignCount * 10;
  user.score.quitOfficialTeam = 0;
  user.score.uploadPhotoToOfficialTeam =0;
  user.score.total = user.score.officialCampaignSucceded + user.score.joinOfficialTeam;
  db.users.save(user);

});



