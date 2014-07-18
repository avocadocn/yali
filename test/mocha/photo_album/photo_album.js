'use strict';

/**
 * Module dependencies
 */

var should = require('should'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  photo_album = require('../../../app/controllers/photoAlbum');


var users = [
  {
    _id: mongoose.Types.ObjectId(),
    name: 'user0',
    type: 'user'
  },
  {
    _id: mongoose.Types.ObjectId(),
    name: 'user1',
    type: 'user'
  },
  {
    _id: mongoose.Types.ObjectId(),
    name: 'user2',
    type: 'user'
  },
  {
    _id: mongoose.Types.ObjectId(),
    name: 'user3',
    type: 'hr'
  },
  {
    _id: mongoose.Types.ObjectId(),
    name: 'user4',
    type: 'user'
  }
];

var photos = [
  {
    uri: '/img/test0.png',
    thumbnail_uri: '/img/test_th0.png',
    upload_date: new Date(),
    hidden: false,
    name: 'photo0',
    tags: ['tag1', 'tag2', 'tag3'],
    click_count: 0,
    comments: [{
      content: 'good photo',
      publish_user: users[0],
      publish_date: new Date()
    }],
    upload_user: users[0]
  },
  {
    uri: '/img/test1.png',
    thumbnail_uri: '/img/test_th1.png',
    upload_date: new Date(),
    hidden: true,
    name: 'photo1',
    tags: ['tag1', 'tag2', 'tag3'],
    click_count: 13,
    comments: [{
      content: 'good photo',
      publish_user: users[0],
      publish_date: new Date()
    }],
    upload_user: users[1]
  },
  {
    uri: '/img/test2.png',
    thumbnail_uri: '/img/test_th2.png',
    upload_date: new Date(),
    hidden: false,
    name: 'photo2',
    tags: ['tag1', 'tag2', 'tag3'],
    click_count: 2,
    comments: [{
      content: 'good photo',
      publish_user: users[0],
      publish_date: new Date()
    }],
    upload_user: users[2]
  },
  {
    uri: '/img/test3.png',
    thumbnail_uri: '/img/test_th3.png',
    upload_date: new Date(),
    hidden: true,
    name: 'photo3',
    tags: ['tag1', 'tag2', 'tag3'],
    click_count: 3,
    comments: [{
      content: 'good photo',
      publish_user: users[0],
      publish_date: new Date()
    }],
    upload_user: users[3]
  },
  {
    uri: '/img/test4.png',
    thumbnail_uri: '/img/test_th4.png',
    upload_date: new Date(),
    hidden: true,
    name: 'photo4',
    tags: ['tag1', 'tag2', 'tag3'],
    click_count: 4,
    comments: [{
      content: 'good photo',
      publish_user: users[0],
      publish_date: new Date()
    }],
    upload_user: users[4]
  },
];





describe('<PhotoAlbum Unit Test>', function() {
  describe('按点击数排序照片:', function() {
    it('点击数高的照片应该排在前面', function() {
      var test_photos = _.cloneDeep(photos);
      photo_album.sortPhotosByClickCount(test_photos);
      for (var i = 0; i < test_photos.length - 1; i++) {
        (test_photos[i].click_count - test_photos[i + 1].click_count > 0).should.be.true;
      }
    });
  });

  describe('获取照片中未隐藏的照片', function() {
    it('照片数组中只含hidden属性为false的照片, 未排序', function() {
      var test_photos = _.cloneDeep(photos);
      test_photos = photo_album.getPhotos(test_photos);
      for (var i = 0; i < test_photos.length - 1; i++) {
        (test_photos[i].hidden === false).should.be.true;
      }
    });

    it('照片数组中只含hidden属性为false的照片, 按点击数排序', function() {
      var test_photos = _.cloneDeep(photos);
      test_photos = photo_album.getPhotos(test_photos, photo_album.sortPhotosByClickCount);
      for (var i = 0; i < test_photos.length; i++) {
        (test_photos[i].hidden === false).should.be.true;
      }

      for (var i = 0; i < test_photos.length - 1; i++) {
        (test_photos[i].click_count - test_photos[i + 1].click_count > 0).should.be.true;
      }
    });

  });



});



