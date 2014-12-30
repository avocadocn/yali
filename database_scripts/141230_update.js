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
db.companygroups.update({poster:{'$exists':false},{$set:{poster:{role:'HR'}}},{multi:true}})