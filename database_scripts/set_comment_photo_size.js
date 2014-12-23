// 设置评论照片的尺寸

var comments = db.comments.find();
comments.forEach(function (comment) {

  if (comment.photos) {
    comment.photos.forEach(function (commentPhoto) {
      if (commentPhoto._id) {
        var photo = db.photos.findOne({ _id: commentPhoto._id });
        if (photo && photo.width && photo.height) {
          commentPhoto.width = photo.width;
          commentPhoto.height = photo.height;
        }
      }
    });
    db.comments.save(comment);
  }

});
