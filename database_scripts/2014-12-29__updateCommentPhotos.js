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