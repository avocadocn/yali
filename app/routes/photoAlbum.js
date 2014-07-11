'use strict';

var photoAlbum = require('../controllers/photoAlbum');

var express = require('express');
var config = require('../../config/config');
var photoBodyParser = express.bodyParser({
  uploadDir: config.root + '/temp_uploads/',
  limit: '5mb' });

module.exports = function(app) {

  var authorize = photoAlbum.authorize;

  app.post('/photoAlbum', authorize, photoAlbum.createAuth, photoAlbum.ownerFilter, photoAlbum.createPhotoAlbum);
  app.get('/photoAlbum/:photoAlbumId', photoAlbum.readPhotoAlbum);
  app.put('/photoAlbum/:photoAlbumId', authorize, photoAlbum.updatePhotoAlbum);
  app.delete('/photoAlbum/:photoAlbumId', authorize, photoAlbum.deletePhotoAlbum);

  app.post('/photoAlbum/:photoAlbumId/photo', authorize, photoBodyParser, photoAlbum.createPhoto);
  app.get('/photoAlbum/:photoAlbumId/photo/:photoId', photoAlbum.readPhoto);
  app.put('/photoAlbum/:photoAlbumId/photo/:photoId', authorize, photoAlbum.updatePhoto);
  app.delete('/photoAlbum/:photoAlbumId/photo/:photoId', authorize, photoAlbum.deletePhoto);

  app.get('/:groupId/photoAlbumList', photoAlbum.readGroupPhotoAlbumList);
  app.get('/photoAlbum/:photoAlbumId/photolist', photoAlbum.readPhotoList);
  app.get('/photoAlbum/:photoAlbumId/preview', photoAlbum.preview);

  app.get('/:groupId/photoAlbumListView', photoAlbum.renderGroupPhotoAlbumList);
  app.get('/photoAlbumDetailView/:photoAlbumId', photoAlbum.renderPhotoAlbumDetail);
  app.get('/photoView/:photoAlbumId/:photoId', photoAlbum.renderPhotoDetail);

};
