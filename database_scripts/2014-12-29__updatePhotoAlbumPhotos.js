// 2014-12-29 添加相册最近上传者的数据，以及尺寸信息

var photoAlbums = db.photoalbums.find();
photoAlbums.forEach(function (photoAlbum) {
  photoAlbum.photos.forEach(function (photo) {
    if (photo.uri) {
      var oriPhoto = db.photos.findOne({ uri: photo.uri });
      if (oriPhoto) {
        photo._id = photo._id;
        photo.width = oriPhoto.width;
        photo.height = oriPhoto.height;
        photo.upload_user = oriPhoto.upload_user;
      }
    }
  });
  db.photoalbums.save(photoAlbum);
});
