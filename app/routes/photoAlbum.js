'use strict';

var photoAlbum = require('../controllers/photoAlbum');

module.exports = function(app) {

  var authorize = photoAlbum.authorize;

  app.post('/photoAlbum', authorize, photoAlbum.createAuth, photoAlbum.ownerFilter, photoAlbum.createPhotoAlbum);
  app.get('/photoAlbum/:photoAlbumId', photoAlbum.readPhotoAlbum);
  app.put('/photoAlbum/:photoAlbumId', authorize, photoAlbum.updatePhotoAlbum);
  app.delete('/photoAlbum/:photoAlbumId', authorize, photoAlbum.deletePhotoAlbum);

  app.post('/photoAlbum/:photoAlbumId/photo/single', authorize, photoAlbum.getPhotoAlbum, photoAlbum.createSinglePhoto);
  app.get('/photoAlbum/:photoAlbumId/photo/:photoId',authorize, photoAlbum.getPhotoAlbum, photoAlbum.readPhoto);
  app.put('/photoAlbum/:photoAlbumId/photo/:photoId', authorize, photoAlbum.getPhotoAlbum, photoAlbum.updatePhoto);
  app.delete('/photoAlbum/:photoAlbumId/photo/:photoId', authorize, photoAlbum.getPhotoAlbum, photoAlbum.deletePhoto);

  app.get('/photoAlbum/team/:tid/list', photoAlbum.readGroupPhotoAlbumList);
  app.get('/photoAlbum/:photoAlbumId/photolist', photoAlbum.readPhotoList);

  app.get('/photoAlbum/team/:tid/listView', photoAlbum.createAuth, photoAlbum.renderGroupPhotoAlbumList);
  app.get('/photoAlbum/:photoAlbumId/detailView', photoAlbum.renderPhotoAlbumDetail);
  app.get('/photoAlbum/:photoAlbumId/photoView/:photoId', photoAlbum.renderPhotoDetail);
  app.get('/photoAlbum/family/:tid', photoAlbum.renderFamilyPhotoAlbum);

};
