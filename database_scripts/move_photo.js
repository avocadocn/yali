/**
 * 将旧相册的photos复制至一个新的photos集合，仍会保留原有的数据
 */

db.createCollection('photos');

var photoAlbums = db.photoalbums.find();

photoAlbums.forEach(function (photoAlbum) {
  photoAlbum.photos.forEach(function (photo) {
    var newPhoto = {
      photo_album: photoAlbum._id,
      owner: {
        companies: photoAlbum.owner.companies,
        teams: photoAlbum.owner.teams
      },
      uri: photo.uri,
      hidden: photo.hidden,
      click: photo.click,
      name: photo.name,
      tags: photo.tags,
      upload_date: photo.upload_date,
      upload_user: photo.upload_user
    };
    db.photos.insert(newPhoto);
  });
});