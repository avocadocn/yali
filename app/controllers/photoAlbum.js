'use strict';

// node system
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

// mongoose and models
var mongoose = require('mongoose');
var PhotoAlbum = mongoose.model('PhotoAlbum');
var CompanyGroup = mongoose.model('CompanyGroup');

// 3rd
var validator = require('validator');
var gm = require('gm');
var async = require('async');

// custom
var config = require('../../config/config');








var photoAlbumThumbnail = exports.photoAlbumThumbnail = function(photo_album) {
  var first_photo;
  for (var i = 0; i < photo_album.photos.length; i++) {
    if (photo_album.photos[i].hidden === false) {
      first_photo = photo_album.photos[i];
      break;
    }
  }
  if (first_photo) {
    return first_photo.thumbnail_uri;
  } else {
    return '/img/icons/default_photo_album.png';
  }
};

function getShowPhotos(photo_album) {
  var photos = [];
  for (var i = 0; i < photo_album.photos.length; i++) {
    if (photo_album.photos[i].hidden === false) {
      photos.push(photo_album.photos[i]);
    }
  }
  return photos;
}

function photoAlbumProcess(res, _id, process) {
  if (validator.isAlphanumeric(_id)) {

    PhotoAlbum.findOne({ _id: _id }).exec(function(err, photo_album) {
      if (err) {
        console.log(err);
        res.send({ result: 0, msg: '获取相册信息失败' });
      } else {
        if (photo_album) {
          process(photo_album);
        } else {
          res.send({ result: 0, msg: '没有找到对应的相册' });
        }
      }
    });

  } else {
    res.send({ result: 0, msg: '请求错误' });
  }
}

function photoProcess(res, pa_id, p_id, process) {
  if (validator.isAlphanumeric(pa_id) && validator.isAlphanumeric(p_id)) {

    PhotoAlbum.findOne({ _id: pa_id }).exec(function(err, photo_album) {
      if (err) {
        console.log(err);
        res.send({ result: 0, msg: '获取照片失败' });
      } else {
        var photos = photo_album.photos;
        for (var i = 0; i < photos.length; i++) {
          // 此处需要类型转换后再比较, p_id:String, photos[i]._id:Object
          if (p_id == photos[i]._id) {
            return process(photo_album, photos[i]);
          }
        }

        res.send({ result: 0, msg: '没有找到对应的照片' });
      }
    });

  } else {
    res.send({ result: 0, msg: '请求错误' });
  }
}

var getGroupPhotoAlbumList = exports.getGroupPhotoAlbumList = function(group_id, callback) {
  CompanyGroup
  .findById(group_id)
  .populate('photo_album_list')
  .exec()
  .then(function(company_group) {
    if (!company_group) {
      throw 'not found';
    }

    var photo_album_list = [];
    company_group.photo_album_list.forEach(function(photo_album) {
      photo_album_list.push({
        _id: photo_album._id,
        thumbnail: photoAlbumThumbnail(photo_album),
        name: photo_album.name,
        photo_count: photo_album.photos.length || 0,
        update_user: photo_album.update_user,
        update_date: photo_album.update_date
      });
    });
    callback(photo_album_list);
  })
  .then(null, function(err) {
    console.log(err);
    callback(null);
  });
};







exports.authorize = function(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/users/signin');
  }
};

exports.ownerFilter = function(req, res, next) {
  switch (req.body.owner) {
    case 'company_group':
      mongoose.model('CompanyGroup')
      .findOne({ _id: req.body.owner_id })
      .exec(function(err, company_group) {
        req.model = company_group;
        req.owner = {
          _id: req.body.owner_id,
          model: 'CompanyGroup'
        };
        next();
      });
      break;
    default:
      res.send({ result: 0, msg: 'failed' });
      break;
  }
};


exports.createPhotoAlbum = function(req, res) {
  var photo_album = new PhotoAlbum({
    owner: req.owner,
    name: req.body.name,
    create_user: {
      _id: req.user._id,
      nickname: req.user.nickname
    },
    update_user: {
      _id: req.user._id,
      nickname: req.user.nickname
    }
  });
  photo_album.save(function(err) {
    if (err) {
      console.log(err);
      res.send({ result: 0, msg: '创建相册失败' });
    } else {

      async.waterfall([
        function(callback) {
          fs.mkdir(config.root + '/public/img/photo_album/' + photo_album._id, function(err) {
            if (err) callback(err);
            else {
              callback(null);
            }
          });
        },
        function(callback) {
          req.model.photo_album_list.push(photo_album._id);
          req.model.save(function(err) {
            if (err) callback(err);
            else {
              delete req.model;
              delete req.owner;
              return res.send({ result: 1, msg: '创建相册成功' });
            }
          });
        }
      ], function(err, result) {
        if (err) {
          console.log(err);
          res.send({ result: 0, msg: '创建相册失败' });
        }
      });

    }
  });

};





exports.readPhotoAlbum = function(req, res) {
  var _id = req.params.photoAlbumId;

  photoAlbumProcess(res, _id, function(photo_album) {
    if (photo_album.hidden === false) {
      var data = {
        name: photo_album.name,
        update_date: photo_album.update_date,
        update_user: photo_album.update_user
      };
      res.send({ result: 1, msg: '获取相册信息成功', data: data });
    } else {
      res.send({ result: 0, msg: '该相册不存在' });
    }

  });
};

exports.updatePhotoAlbum = function(req, res) {
  var _id = req.params.photoAlbumId;
  var new_name = req.body.name;

  photoAlbumProcess(res, _id, function(photo_album) {
    if (photo_album.hidden === false) {
      photo_album.name = new_name;
      photo_album.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          res.send({ result: 1, msg: '更新相册成功' });
        }
      });
    } else {
      res.send({ result: 0, msg: '该相册不存在' });
    }
  });
};

exports.deletePhotoAlbum = function(req, res) {
  var _id = req.params.photoAlbumId;
  if (validator.isAlphanumeric(_id)) {
    PhotoAlbum.findOne({ _id: _id }).exec(function(err, photo_album) {
      if (err) {
        console.log(err);
      } else if(photo_album) {
        photo_album.hidden = true;
        photo_album.save(function(err) {
          if (err) { console.log(err); }
          else {
            res.send({ result: 1, msg: '删除相册成功' });
          }
        });
      } else {
        res.send({ result: 0, msg: '删除相册失败' });
      }
    });
  } else {
    res.send({ result: 0, msg: '请求错误' });
  }
};

exports.createPhoto = function(req, res) {
  var pa_id = req.params.photoAlbumId;
  var photos = req.files.photos;
  if (validator.isAlphanumeric(pa_id) && (photos.size > 0 || photos.length > 0)) {

    var uri_dir = path.join('/img/photo_album/', pa_id);
    if (photos.size) {
      photos = [photos];
    }
    console.log(photos)

    PhotoAlbum.findOne({ _id: pa_id }).exec(function(err, photo_album) {

      var i = 0;

      async.whilst(
        function() { return i < photos.length; },

        function(callback) {
          var photo_name = Date.now().toString() + '.png';
          var photo = {};
          try {
            gm(photos[i].path)
            .write(path.join(config.root, 'public', uri_dir, photo_name),
              function(err) {
                if (err) {
                  callback(err);
                } else {
                  gm(photos[i].path)
                  .size(function(err, size) {
                    if (err) {
                      callback(err);
                    } else {
                      var thumbnail_width = 200;
                      var thumbnail_height = thumbnail_width;
                      var crop_width = size.width > size.height ? size.height : size.width;
                      var crop_height = crop_width;
                      var crop_x = (size.width - crop_width) / 2;
                      var crop_y = (size.height - crop_height) / 2;

                      gm(photos[i].path)
                      .crop(crop_width, crop_height, crop_x, crop_y)
                      .resize(thumbnail_width, thumbnail_height)
                      .write(path.join(config.root, 'public', uri_dir, 'thumbnail' + photo_name),
                        function(err) {
                          var photo = {
                            uri: path.join(uri_dir, photo_name),
                            thumbnail_uri: path.join(uri_dir, 'thumbnail' + photo_name),
                            name: photos[i].name,
                            upload_user: {
                              _id: req.user._id,
                              nickname: req.user.nickname
                            }
                          };
                          photo_album.photos.push(photo);
                          photo_album.save(function(err) {
                            if (err) callback(err);
                            else {
                              fs.unlink(photos[i].path, function(err) {
                                if (err) callback(err);
                                else {
                                  i++;
                                  callback();
                                }
                              });
                            }
                          });
                        }
                      );
                    }
                  });


                }
            });
          } catch (e) {
            console.log(e);
          }

        },

        function(err) {
          if (err) {
            console.log(err);
            res.send({ result: 0, msg: '添加照片失败' });
          } else {
            res.send({ result: 1, msg: '添加照片成功' });
          }
        }
      );

    });

  } else {
    res.send({ result: 0, msg: '请求错误' });
  }
};



exports.readPhoto = function(req, res) {
  var pa_id = req.params.photoAlbumId;
  var p_id = req.params.photoId;

  photoProcess(res, pa_id, p_id, function(photo_album, photo) {
    if (photo.hidden === false) {
      res.send({ result: 1, msg: '获取照片成功',
        data: {
          uri: photo.uri,
          comments: photo.comments,
          tags: photo.tags,
          upload_user: photo.upload_user
        }
      });
    } else {
      res.send({ result: 0, msg: '该照片不存在' });
    }
  });


};

exports.updatePhoto = function(req, res) {
  var pa_id = req.params.photoAlbumId;
  var p_id = req.params.photoId;

  photoProcess(res, pa_id, p_id, function(photo_album, photo) {
    if (photo.hidden === false) {
      if (req.body.text) {
        photo.comments.push({
          content: req.body.text,
          publish_user: {
            _id: req.user._id,
            nickname: req.user.nickname,
            photo: req.user.photo
          }
        });
      }
      if (req.body.tags) {
        var tags = req.body.tags.split(' ');
        if (!photo.tags) {
          photo.tags = [];
        }
        photo.tags = photo.tags.concat(tags);
      }
      photo_album.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          res.send({ result: 1, msg: '更新成功' });
        }
      });
    } else {
      res.send({ result: 0, msg: '该照片不存在' });
    }
  });

};

exports.deletePhoto = function(req, res) {
  var pa_id = req.params.photoAlbumId;
  var p_id = req.params.photoId;

  if (validator.isAlphanumeric(pa_id) && validator.isAlphanumeric(p_id)) {

    PhotoAlbum.findOne({ _id: pa_id }).exec(function(err, photo_album) {
      if (err) {
        console.log(err);
        res.send({ result: 0, msg: '删除照片失败' });
      } else {
        var photos = photo_album.photos;
        for (var i = 0; i < photos.length; i++) {
          // 此处需要类型转换后再比较, p_id:String, photos[i]._id:Object
          if (p_id == photos[i]._id) {
            photos[i].hidden = true;
            photo_album.save(function(err) {
              if (err) {
                console.log(err);
                res.send({ result: 0, msg: '删除照片失败' });
              } else {
                res.send({ result: 1, msg: '删除照片成功' });
              }
            });
            return;
          }
        }

        res.send({ result: 0, msg: '没有找到对应的照片' });
      }
    });


  } else {
    res.send({ result: 0, msg: '请求错误' });
  }
};







exports.readGroupPhotoAlbumList = function(req, res) {
  getGroupPhotoAlbumList(req.params.groupId, function(photo_album_list) {
    if (photo_album_list !== null) {
      res.send({ result: 1, photo_album_list: photo_album_list });
    } else {
      res.send(404);
    }
  });

};


exports.renderGroupPhotoAlbumList = function(req, res) {
  getGroupPhotoAlbumList(req.params.groupId, function(photo_album_list) {
    if (photo_album_list !== null) {
      CompanyGroup
      .findById(req.params.groupId)
      .exec()
      .then(function(company_group) {
        if (!company_group) {
          throw 'not found';
        }
        res.render('photo_album/photo_album_list', {
          photo_album_list: photo_album_list,
          photo: req.user.photo,
          realname: req.user.realname,
          role: req.session.role,
          owner_id: company_group._id,
          owner_name: company_group.name
        });
      })
      .then(null, function(err) {
        console.log(err);
        // TO DO: temp err handle
        res.send(404);
      });
    } else {
      res.send(404);
    }
  });
};


exports.renderPhotoAlbumDetail = function(req, res) {
  PhotoAlbum
  .findById(req.params.photoAlbumId)
  .exec()
  .then(function(photo_album) {
    if (!photo_album) {
      throw 'not found';
    }
    var photos = getShowPhotos(photo_album);
    res.render('photo_album/photo_album_detail', {
      photo_album: {
        _id: photo_album._id,
        name: photo_album.name,
        update_date: photo_album.update_date,
        photos: photos
      },
      photo: req.user.photo,
      realname: req.user.realname,
      role: req.session.role,
    });
  })
  .then(null, function(err) {
    console.log(err);
    // TO DO: temp err handle
    res.send(404);
  })
};

exports.renderPhotoDetail = function(req, res) {
  PhotoAlbum
  .findById(req.params.photoAlbumId)
  .exec()
  .then(function(photo_album) {
    var pre_id, next_id;
    var photos = photo_album.photos;
    for (var i = 0; i < photos.length; i++) {
      if (req.params.photoId === photos[i]._id.toString()) {
        if (i === 0) {
          pre_id = photos[photos.length - 1]._id;
        } else {
          pre_id = photos[i - 1]._id;
        }

        if (i === photos.length - 1) {
          next_id = photos[0]._id;
        } else {
          next_id = photos[i + 1]._id;
        }

        res.render('photo_album/photo_detail', {
          photo_detail: {
            _id: photos[i]._id,
            pre_id: pre_id,
            next_id: next_id,
            uri: photos[i].uri,
            name: photos[i].name,
            tags: photos[i].tags,
            comments: photos[i].comments,
            upload_user: photos[i].update_user,
            upload_date: photos[i].upload_date
          },
          photo_album: {
            _id: photo_album._id,
            name: photo_album.name,
            update_date: photo_album.update_date,
            photo_count: photo_album.photos.length
          },
          photo: req.user.photo,
          realname: req.user.realname,
          role: req.session.role
        });

      }
    }
  })
  .then(null, function(err) {
    console.log(err);
    // TO DO: temp err handle
    res.send(404);
  });


};

exports.readPhotoList = function(req, res) {
  var _id = req.params.photoAlbumId;

  if (validator.isAlphanumeric(_id)) {

    PhotoAlbum
    .findOne({ _id: _id })
    .exec(function(err, photo_album) {
      if (err) {
        console.log(err);
        res.send({ result: 0, msg: '获取相册照片失败' });
      } else {
        if (photo_album) {
          var photos = [];
          photo_album.photos.forEach(function(photo) {
            if (photo.hidden === false) {
              var temp_photo = {
                _id: photo._id,
                uri: photo.uri,
                thumbnail_uri: photo.thumbnail_uri,
                comments: photo.comments,
                tags: photo.tags,
                upload_user: photo.upload_user,
                upload_date: photo.upload_date
              };
              photos.push(temp_photo);
            }
          });
          res.send({ result: 1, msg: '获取相册照片成功', data: photos });
        } else {
          res.send({ result: 0, msg: '相册不存在' });
        }
      }
    });

  } else {
    res.send({ result: 0, msg: '请求错误' });
  }
};


exports.preview = function(req, res) {
  var _id = req.params.photoAlbumId;

  if (validator.isAlphanumeric(_id)) {

    PhotoAlbum.findOne({ _id: _id }).exec(function(err, photo_album) {
      if (err) {
        console.log(err);
        res.send({ result: 0, msg: '获取相册照片失败' });
      } else {
        if (photo_album) {
          var first_photo;
          for (var i = 0; i < photo_album.photos.length; i++) {
            if (photo_album.photos[i].hidden === false) {
              first_photo = photo_album.photos[i];
              break;
            }
          }
          if (first_photo) {
            var img_path_for_fs = path.join(config.root, 'public', first_photo.uri);
            res.set('Content-Type', 'image/png');
            gm(img_path_for_fs)
            .stream(function(err, stdout, stderr) {
              if (err) console.log(err);
              else {
                stdout.pipe(res);
              }
            });
          } else {
            var default_path = path.join(config.root, 'public/img/icons/google.png');
            res.set('Content-Type', 'image/png');
            gm(default_path)
            .stream(function(err, stdout, stderr) {
              if (err) console.log(err);
              else {
                stdout.pipe(res);
              }
            });
          }

        } else {
          res.send({ result: 0, msg: '相册不存在' });
        }
      }
    });

  } else {
    res.send({ result: 0, msg: '请求错误' });
  }
}


