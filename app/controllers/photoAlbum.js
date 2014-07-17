'use strict';

/**
 * Module dependencies.
 */

// node system
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

// mongoose and models
var mongoose = require('mongoose');
var PhotoAlbum = mongoose.model('PhotoAlbum');
var Company = mongoose.model('Company');
var CompanyGroup = mongoose.model('CompanyGroup');

// 3rd
var validator = require('validator');
var gm = require('gm');
var async = require('async');
var moment = require('moment');
var _ = require('lodash');

// custom
var config = require('../../config/config');


// photo_album need populate owner_company_group
function photoEditAuth(user, photo_album, photo) {

  // 照片的上传者
  if (user._id.toString() === photo.upload_user._id.toString()) {
    return true;
  }

  // 比赛照片只允许上传者更改
  if (photo_album.owner.teams.length === 1 || photo_album.owner.companies.length === 1) {
    var owner = getPhotoAlbumOwner(user, photo_album);
    if (owner) {
      // 该照片所属组的队长
      var leaders = [];
      if (owner.team) {
        leaders = owner.team.leader || [];
      }
      for (var i = 0; i < leaders.length; i++) {
        if (user._id.toString() === leaders[i]._id.toString()) {
          return true;
        }
      }

      // 该照片所属公司的HR
      if (owner.company) {
        if (owner.company._id) {
          if (user._id.toString() === owner.company._id.toString()) {
            return true;
          }
        }

        if (user.provider === 'company' && user._id.toString() === owner.company.toString()) {
          return true;
        }
      }
    }
  }

  return false;

}

// photo_album need populate owner_company_group
function photoAlbumEditAuth(user, photo_album) {

  // 比赛相册不允许修改
  if (photo_album.owner.teams.length === 1 || photo_album.owner.companies.length === 1) {
    // 该照片所属组的队长
    var leaders = [];

    var owner = getPhotoAlbumOwner(user, photo_album);

    if (owner) {
      if (owner.team) {
        leaders = owner.team.leader || [];
      }
      for (var i = 0; i < leaders.length; i++) {
        if (user._id.toString() === leaders[i]._id.toString()) {
          return true;
        }
      }

      // 该照片所属公司的HR
      if (owner.company) {
        if (owner.company._id) {
          if (user._id.toString() === owner.company._id.toString()) {
            return true;
          }
        }

        if (user.provider === 'company' && user._id.toString() === owner.company.toString()) {
          return true;
        }
      }
    }

  }

  return false;
}

// photo_album need populate owner_company_group
function photoUploadAuth(user, photo_album) {
  // 该照片所属组的成员
  var members = [];

  var owner = getPhotoAlbumOwner(user, photo_album);

  if (owner) {
    if (user.provider === 'user') {
      // 小组活动相册并且是小组成员
      if (owner.team && owner.team.length > 0) {
        members = owner.team.member || [];
        for (var i = 0; i < members.length; i++) {
          if (user._id.toString() === members[i]._id.toString()) {
            return true;
          }
        }
      } else {
        // 公司活动并且是该公司员工
        if (owner.company._id) {
          if (user.cid.toString() === owner.company._id.toString()) {
            return true;
          }
        }
        if (user.cid.toString() === owner.company.toString()) {
          return true;
        }
      }
    } else if (user.provider === 'company') {
      // 该照片所属公司的HR
      if (owner.company) {
        if (owner.company._id) {
          if (user._id.toString() === owner.company._id.toString()) {
            return true;
          }
        }

        if (user._id.toString() === owner.company.toString()) {
          return true;
        }
      }
    }

  }

  return false;
}



// 一个相册的缩略图
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

// 一个相册的照片缩略图
var photoThumbnailList = exports.photoThumbnailList = function(photo_album, count) {
  var photo_list = [];
  if (!count) {
    var count = 4;
  }
  for (var i = 0; i < photo_album.photos.length; i++) {
    if (photo_album.photos[i].hidden === false) {
      photo_list.push(photo_album.photos[i]);
      if (photo_list.length === count) {
        break;
      }
    }
  }
  return photo_list;
};

// 根据当前登录的用户获取相册的所有者
function getPhotoAlbumOwner(user, photo_album) {
  // why company.team.id, user.team._id?
  if (user.provider === 'company') {
    for (var i = 0; i < user.team.length; i++) {
      for (var j = 0; j < photo_album.owner.teams.length; j++) {
        if (photo_album.owner.teams[j]._id.toString() === user.team[i].id.toString()) {
          return {
            company: photo_album.owner.companies[j],
            team: photo_album.owner.teams[j]
          };
        }
      }
    }
  } else if (user.provider === 'user') {
    for (var i = 0; i < user.team.length; i++) {
      for (var j = 0; j < photo_album.owner.teams.length; j++) {
        if (photo_album.owner.teams[j]._id.toString() === user.team[i]._id.toString()) {
          return {
            company: photo_album.owner.companies[j],
            team: photo_album.owner.teams[j]
          };
        }
      }
    }
  }
  return {
    company: photo_album.owner.companies[0],
    team: photo_album.owner.teams[0]
  };
}

// 获取一个相册未删除的照片
function getShowPhotos(photo_album) {
  var photos = [];
  for (var i = 0; i < photo_album.photos.length; i++) {
    if (photo_album.photos[i].hidden === false) {
      photos.push(photo_album.photos[i]);
    }
  }
  photos.sort(function(a, b) {
    return b.upload_date - a.upload_date;
  });
  return photos;
}

function photoAlbumProcess(res, _id, process) {
  if (validator.isAlphanumeric(_id)) {

    PhotoAlbum
      .findOne({
        _id: _id
      })
      .populate('owner.teams')
      .exec(function(err, photo_album) {
        if (err) {
          console.log(err);
          return res.send({
            result: 0,
            msg: '获取相册信息失败'
          });
        } else {
          if (photo_album) {
            process(photo_album);
          } else {
            return res.send({
              result: 0,
              msg: '没有找到对应的相册'
            });
          }
        }
      });

  } else {
    return res.send({
      result: 0,
      msg: '请求错误'
    });
  }
}

function photoProcess(res, pa_id, p_id, process) {
  if (validator.isAlphanumeric(pa_id) && validator.isAlphanumeric(p_id)) {

    PhotoAlbum
      .findOne({
        _id: pa_id
      })
      .populate('owner.teams')
      .exec(function(err, photo_album) {
        if (err) {
          console.log(err);
          return res.send({
            result: 0,
            msg: '获取照片失败'
          });
        } else {
          var photos = photo_album.photos;
          for (var i = 0; i < photos.length; i++) {
            // 此处需要类型转换后再比较, p_id:String, photos[i]._id:Object
            if (p_id == photos[i]._id) {
              return process(photo_album, photos[i]);
            }
          }

          return res.send({
            result: 0,
            msg: '没有找到对应的照片'
          });
        }
      });

  } else {
    return res.send({
      result: 0,
      msg: '请求错误'
    });
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
        if (photo_album.hidden === true) {
          return;
        }
        if (photo_album.owner.model.type === 'Campaign' && photo_album.photos.length === 0) {
          return;
        }
        photo_album_list.push({
          _id: photo_album._id,
          thumbnail: photoAlbumThumbnail(photo_album),
          name: photo_album.name,
          photo_count: photo_album.photo_count,
          update_user: photo_album.update_user,
          update_date: photo_album.update_date,
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
    return res.redirect('/users/signin');
  }
};

exports.ownerFilter = function(req, res, next) {
  switch (req.body.owner_model) {
    case 'company_group':
      mongoose.model('CompanyGroup')
        .findOne({
          _id: req.body.owner_id
        })
        .exec(function(err, company_group) {
          req.model = company_group;
          req.owner_model = {
            _id: req.body.owner_id,
            type: 'CompanyGroup'
          };
          next();
        });
      break;
    default:
      return res.send({
        result: 0,
        msg: 'failed'
      });
      break;
  }
};

exports.createAuth = function(req, res, next) {
  Company
    .findById(req.body.cid)
    .exec()
    .then(function(company) {
      // 找不到相册所属公司
      if (!company) {
        return res.send(403);
      }

      // 相册所属的组不在所属公司里
      var tids = [];
      company.team.forEach(function(team) {
        tids.push(team.id.toString());
      });
      var index = tids.indexOf(req.body.tid);
      if (index === -1) {
        return res.send(403);
      }

      // 该公司的HR
      var auth = false;
      if (req.user.provider === 'company' && req.user._id.toString() === company._id.toString()) {
        auth = true;
      }


      CompanyGroup
        .findById(tids[index])
        .exec()
        .then(function(company_group) {
          if (company_group) {
            var leaders = company_group.leader || [];
            for (var i = 0; i < leaders.length; i++) {
              if (req.user._id.toString() === leaders[i]._id.toString()) {
                auth = true;
              }
            }
          }
          if (auth === false) {
            return res.send(403);
          } else {
            req.create_auth = true;
            next();
          }


        })
        .then(null, function(err) {
          console.log(err);
          return res.send(500);
        });

    })
    .then(null, function(err) {
      console.log(err);
      return res.send(500);
    });
};


// exports.createPhotoAlbum = function(req, res) {
//   var photo_album = new PhotoAlbum({
//     owner: {
//       model: req.owner_model,
//       companies: [req.body.cid],
//       teams: [req.body.tid]
//     },
//     name: req.body.name
//   });
//   if (req.user.provider === 'company') {
//     photo_album.create_user = {
//       _id: req.user._id,
//       name: req.user.info.name,
//       type: 'hr'
//     };
//     photo_album.update_user = photo_album.create_user;
//   } else if (req.user.provider === 'user' ) {
//     photo_album.create_user = {
//       _id: req.user._id,
//       name: req.user.nickname,
//       type: 'user'
//     };
//     photo_album.update_user = photo_album.create_user;
//   }

//   fs.mkdir(path.join(config.root, '/public/img/photo_album/', photo_album._id.toString()),
//     function(err) {
//       if (err) {
//         return res.send({ result: 0, msg: '创建相册失败' });
//       } else {
//         photo_album.save(function(err) {
//           if (err) {
//             console.log(err);
//             return res.send({ result: 0, msg: '创建相册失败' });
//           } else {

//             req.model.photo_album_list.push(photo_album._id);
//             req.model.save(function(err) {
//               if (err) {
//                 console.log(err);
//                 return res.send({ result: 0, msg: '创建相册失败' });
//               }
//               else {
//                 delete req.model;
//                 delete req.owner_model;
//                 return res.send({ result: 1, msg: '创建相册成功' });
//               }
//             });

//           }
//         });
//       }
//   });


// };



exports.readPhotoAlbum = function(req, res) {
  var _id = req.params.photoAlbumId;

  photoAlbumProcess(res, _id, function(photo_album) {
    if (photo_album.hidden === false) {
      var data = {
        name: photo_album.name,
        update_date: photo_album.update_date,
        update_user: photo_album.update_user
      };
      return res.send({
        result: 1,
        msg: '获取相册信息成功',
        data: data
      });
    } else {
      return res.send({
        result: 0,
        msg: '该相册不存在'
      });
    }

  });
};

exports.updatePhotoAlbum = function(req, res) {
  var _id = req.params.photoAlbumId;
  var new_name = req.body.name;

  photoAlbumProcess(res, _id, function(photo_album) {
    if (photoAlbumEditAuth(req.user, photo_album) === false) {
      return res.send(403);
    }
    if (photo_album.hidden === false) {
      photo_album.name = new_name;
      photo_album.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          return res.send({
            result: 1,
            msg: '更新相册成功'
          });
        }
      });
    } else {
      return res.send({
        result: 0,
        msg: '该相册不存在'
      });
    }
  });
};

exports.deletePhotoAlbum = function(req, res) {
  var _id = req.params.photoAlbumId;
  if (validator.isAlphanumeric(_id)) {
    PhotoAlbum.findOne({
      _id: _id
    })
      .populate('owner.teams')
      .exec(function(err, photo_album) {
        if (err) {
          console.log(err);
        } else if (photo_album) {

          if (photoAlbumEditAuth(req.user, photo_album) === false) {
            return res.send(403);
          }
          photo_album.hidden = true;
          photo_album.save(function(err) {
            if (err) {
              console.log(err);
            } else {
              return res.send({
                result: 1,
                msg: '删除相册成功'
              });
            }
          });
        } else {
          return res.send({
            result: 0,
            msg: '删除相册失败'
          });
        }
      });
  } else {
    return res.send({
      result: 0,
      msg: '请求错误'
    });
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

    PhotoAlbum
      .findOne({
        _id: pa_id
      })
      .populate('owner.teams')
      .exec(function(err, photo_album) {

        if (photoUploadAuth(req.user, photo_album) === false) {
          return res.send(403);
        }

        var i = 0;

        async.whilst(
          function() {
            return i < photos.length;
          },

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
                                    name: photos[i].name
                                  };
                                  if (req.user.provider === 'company') {
                                    photo.upload_user = {
                                      _id: req.user._id,
                                      name: req.user.info.name,
                                      type: 'hr'
                                    };
                                  } else if (req.user.provider === 'user') {
                                    photo.upload_user = {
                                      _id: req.user._id,
                                      name: req.user.nickname,
                                      type: 'user'
                                    };
                                  }
                                  photo_album.photos.push(photo);
                                  photo_album.photo_count += 1;
                                  photo_album.update_user = photo.upload_user;
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
              return res.send({
                result: 0,
                msg: '添加照片失败'
              });
            } else {
              return res.send({
                result: 1,
                msg: '添加照片成功'
              });
            }
          }
        );

      });

  } else {
    return res.send({
      result: 0,
      msg: '请求错误'
    });
  }
};



exports.readPhoto = function(req, res) {
  var pa_id = req.params.photoAlbumId;
  var p_id = req.params.photoId;

  photoProcess(res, pa_id, p_id, function(photo_album, photo) {
    if (photo.hidden === false) {
      return res.send({
        result: 1,
        msg: '获取照片成功',
        data: {
          uri: photo.uri,
          comments: photo.comments,
          tags: photo.tags,
          upload_user: photo.upload_user
        }
      });
    } else {
      return res.send({
        result: 0,
        msg: '该照片不存在'
      });
    }
  });


};

exports.updatePhoto = function(req, res) {
  var pa_id = req.params.photoAlbumId;
  var p_id = req.params.photoId;

  photoProcess(res, pa_id, p_id, function(photo_album, photo) {

    if (photo.hidden === false) {

      var setUpdateUser = function() {
        if (req.user.provider === 'company') {
          photo_album.update_user = {
            _id: req.user._id,
            name: req.user.info.name,
            type: 'hr'
          };
        } else if (req.user.provider === 'user') {
          photo_album.update_user = {
            _id: req.user._id,
            name: req.user.nickname,
            type: 'user'
          };
        }
      };

      if (photoEditAuth(req.user, photo_album, photo) === true) {
        if (req.body.tags) {
          var tags = req.body.tags.split(' ');
          if (!photo.tags) {
            photo.tags = [];
          }
          photo.tags = photo.tags.concat(tags);
        }
        if (req.body.name) {
          photo.name = req.body.name;
        }
        setUpdateUser();
      }
      if (req.body.text) {
        if (req.user.provider === 'company') {
          return res.send(403);
        }
        photo.comments.push({
          content: req.body.text,
          publish_user: {
            _id: req.user._id,
            nickname: req.user.nickname,
            photo: req.user.photo
          }
        });
        setUpdateUser();
      }
      photo_album.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          return res.send({
            result: 1,
            msg: '更新成功'
          });
        }
      });
    } else {
      return res.send({
        result: 0,
        msg: '该照片不存在'
      });
    }
  });

};

exports.deletePhoto = function(req, res) {
  var pa_id = req.params.photoAlbumId;
  var p_id = req.params.photoId;

  if (validator.isAlphanumeric(pa_id) && validator.isAlphanumeric(p_id)) {

    PhotoAlbum
      .findOne({
        _id: pa_id
      })
      .populate('owner.teams')
      .exec(function(err, photo_album) {
        if (err) {
          console.log(err);
          return res.send({
            result: 0,
            msg: '删除照片失败'
          });
        } else {
          var photos = photo_album.photos;
          for (var i = 0; i < photos.length; i++) {
            // 此处需要类型转换后再比较, p_id:String, photos[i]._id:Object
            if (p_id == photos[i]._id) {

              if (photoEditAuth(req.user, photo_album, photos[i]) === false) {
                return res.send(403);
              }

              photos[i].hidden = true;
              photo_album.photo_count -= 1;
              photo_album.save(function(err) {
                if (err) {
                  console.log(err);
                  return res.send({
                    result: 0,
                    msg: '删除照片失败'
                  });
                } else {
                  return res.send({
                    result: 1,
                    msg: '删除照片成功'
                  });
                }
              });
              return;
            }
          }

          return res.send({
            result: 0,
            msg: '没有找到对应的照片'
          });
        }
      });


  } else {
    return res.send({
      result: 0,
      msg: '请求错误'
    });
  }
};



exports.readGroupPhotoAlbumList = function(req, res) {
  getGroupPhotoAlbumList(req.params.groupId, function(photo_album_list) {
    if (photo_album_list !== null) {
      return res.send({
        result: 1,
        photo_album_list: photo_album_list
      });
    } else {
      return res.send(404);
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
          var links = [{
            text: company_group.name,
            url: '/group/home/' + company_group._id
          }, {
            text: '相册集',
            active: true
          }];
          return res.render('photo_album/photo_album_list', {
            photo_album_list: photo_album_list,
            photo: req.user.photo,
            realname: req.user.realname,
            role: req.role,
            owner_id: company_group._id,
            owner_name: company_group.name,
            owner_logo: company_group.logo,
            cid: company_group.cid,
            moment: moment,
            links: links
          });
        })
        .then(null, function(err) {
          console.log(err);
          // TO DO: temp err handle
          return res.send(404);
        });
    } else {
      return res.send(404);
    }
  });
};


exports.renderPhotoAlbumDetail = function(req, res) {
  PhotoAlbum
    .findById(req.params.photoAlbumId)
    .populate('owner.teams')
    .populate('owner.companies')
    .exec()
    .then(function(photo_album) {
      if (!photo_album) {
        throw 'not found';
      }
      var photos = getShowPhotos(photo_album);
      var owner = getPhotoAlbumOwner(req.user, photo_album);
      var editAuth = photoAlbumEditAuth(req.user, photo_album);
      var uploadAuth = photoUploadAuth(req.user, photo_album);
      if (!owner.team || owner.team.length === 0) {
        var links = [{
          text: owner.company.info.name,
          url: '/company/home'
        }, {
          text: photo_album.name,
          active: true
        }];
        var owner_name = owner.company.info.name;
        var owner_logo = owner.company.info.logo;
      } else {
        var links = [{
          text: owner.team.name,
          url: '/group/home/' + owner.team._id
        }, {
          text: '相册集',
          url: '/' + owner.team._id + '/photoAlbumListView'
        }, {
          text: photo_album.name,
          active: true
        }];
        var owner_name = owner.team.name;
        var owner_logo = owner.team.logo;
      }

      return res.render('photo_album/photo_album_detail', {
        photo_album: {
          _id: photo_album._id,
          name: photo_album.name,
          update_date: photo_album.update_date,
          photos: photos,
          owner: {
            name: owner_name,
            logo: owner_logo
          },
          photo_count: photo_album.photo_count
        },
        moment: moment,
        editAuth: editAuth,
        uploadAuth: uploadAuth,
        links: links
      });
    })
    .then(null, function(err) {
      console.log(err);
      // TO DO: temp err handle
      return res.send(404);
    })
};

exports.renderPhotoDetail = function(req, res) {
  PhotoAlbum
    .findById(req.params.photoAlbumId)
    .populate('owner.teams')
    .populate('owner.companies')
    .exec()
    .then(function(photo_album) {
      var pre_id, next_id;
      var photos = getShowPhotos(photo_album);
      for (var i = 0; i < photos.length; i++) {
        if (req.params.photoId === photos[i]._id.toString()) {
          if (i === 0) {
            //pre_id = photos[photos.length - 1]._id;
            pre_id = null;
          } else {
            pre_id = photos[i - 1]._id;
          }

          if (i === photos.length - 1) {
            //next_id = photos[0]._id;
            next_id = null;
          } else {
            next_id = photos[i + 1]._id;
          }

          var owner = getPhotoAlbumOwner(req.user, photo_album);
          var editAuth = photoEditAuth(req.user, photo_album, photos[i]);

          // var links = [
          //   {
          //     text: owner.team.name,
          //     url: '/group/home/' + owner.team._id,
          //   },
          //   {
          //     text: '相册集',
          //     url: '/' + owner.team._id + '/photoAlbumListView'
          //   },
          //   {
          //     text: photo_album.name,
          //     url: '/photoAlbumDetailView/' + photo_album._id
          //   },
          //   {
          //     text: photos[i].name,
          //     active: true
          //   }
          // ];

          if (!owner.team || owner.team.length === 0) {
            var links = [{
              text: owner.company.info.name,
              url: '/company/home'
            }, {
              text: photo_album.name,
              url: '/photoAlbumDetailView/' + photo_album._id
            }, {
              text: photos[i].name,
              active: true
            }];
            var owner_name = owner.company.info.name;
            var owner_logo = owner.company.info.logo;
          } else {
            var links = [{
              text: owner.team.name,
              url: '/group/home/' + owner.team._id
            }, {
              text: '相册集',
              url: '/' + owner.team._id + '/photoAlbumListView'
            }, {
              text: photo_album.name,
              url: '/photoAlbumDetailView/' + photo_album._id
            }, {
              text: photos[i].name,
              active: true
            }];
            var owner_name = owner.team.name;
            var owner_logo = owner.team.logo;
          }

          var return_url = '/photoAlbumDetailView/' + photo_album._id;

          return res.render('photo_album/photo_detail', {
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
              photo_count: photo_album.photos.length,
              owner: {
                name: owner_name,
                logo: owner_logo
              }
            },
            links: links,
            return_url: return_url,
            moment: moment,
            editAuth: editAuth
          });

        }
      }
    })
    .then(null, function(err) {
      console.log(err);
      // TO DO: temp err handle
      return res.send(404);
    });


};

exports.readPhotoList = function(req, res) {
  var _id = req.params.photoAlbumId;

  if (validator.isAlphanumeric(_id)) {

    PhotoAlbum
      .findOne({
        _id: _id
      })
      .exec(function(err, photo_album) {
        if (err) {
          console.log(err);
          return res.send({
            result: 0,
            msg: '获取相册照片失败'
          });
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
            return res.send({
              result: 1,
              msg: '获取相册照片成功',
              data: photos
            });
          } else {
            return res.send({
              result: 0,
              msg: '相册不存在'
            });
          }
        }
      });

  } else {
    return res.send({
      result: 0,
      msg: '请求错误'
    });
  }
};


exports.preview = function(req, res) {
  var _id = req.params.photoAlbumId;

  if (validator.isAlphanumeric(_id)) {

    PhotoAlbum.findOne({
      _id: _id
    }).exec(function(err, photo_album) {
      if (err) {
        console.log(err);
        return res.send({
          result: 0,
          msg: '获取相册照片失败'
        });
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
          return res.send({
            result: 0,
            msg: '相册不存在'
          });
        }
      }
    });

  } else {
    return res.send({
      result: 0,
      msg: '请求错误'
    });
  }
}



/**
 * 根据照片点击数排序照片
 *
 * @param  {Array} photos 照片对象数组
 * @return {Array}        排序后的照片对象数组
 */
var sortPhotosByClickCount = function(photos) {
  photos.sort(function(a, b) {
    if (a.click_count <= b.click_count) {
      return true;
    } else {
      return false;
    }
  });
  return photos;
};


/**
 * 获取未隐藏的照片
 *
 * @param  {Array} photos 照片对象数组
 * @param  {Function} sort   排序函数，可选
 * @return {Array}        筛选后的照片对象数组
 */
var getPhotos = function(photos, sort) {
  var result = [];
  photos.forEach(function(photo) {
    if (photo.hidden === false) {
      result.push(photo);
    }
  });
  if (sort) {
    result = sort(result);
  }
  return result;
};



/**
 * 创建相册
 *
 * Examples:
 *
 * createPhotoAlbum(company_group, {
 *   name: 'test',
 *   create_user: {
 *     _id: req.user._id,
 *     name: req.user.nickname,
 *     type: 'user'
 *   }
 * }, function(err, photo_album) {
 *   if (err) console.log(err);
 * });
 *
 * @param {Object} owner 存放相册ref的Mongoose对象，具有photo_album_list或photo_album属性
 * @param {Object} options
 * @param {Function} callback callback(err, photo_album)
 */
var createPhotoAlbum = exports.createPhotoAlbum = function(owner, options, callback) {
  var photo_album = new PhotoAlbum({
    name: options.name,
    create_user: options.create_user,
    update_user: options.create_user
  });

  fs.mkdir(path.join(config.root, '/public/img/photo_album/', photo_album._id.toString()),
    function(err) {
      if (err) {
        return callback(err);
      }
      photo_album.save(function(err) {
        if (err) {
          return callback(err);
        }

        if (owner.photo_album_list) {
          owner.photo_album_list.push(photo_album._id);
        } else if (owner.photo_album) {
          owner.photo_album = photo_album._id;
        }

        owner.save(function(err) {
          if (err) {
            return callback(err);
          }

          return callback(null, photo_album);
        });

      });
    });
};



/**
 * 获取一个相册的数据(已过滤隐藏的照片)
 * @param  {Object}   photo_album Mongoose.model('PhotoAlbum') Schema
 * @param  {Function} callback callback(clone_photo_ablum), clone_photo_album为过滤隐藏照片后的相册克隆对象，切勿用此对象的save之类的方法
 */
var readPhotoAlbum = function(photo_album, callback) {
  var clone_photo_album = _.cloneDeep(photo_album);
  clone_photo_album.photos = getPhotos(clone_photo_album.photos, sortPhotosByClickCount);
  callback(clone_photo_album);
};



/**
 * functions for route
 */


exports.getTargetModel = function(req, res, next) {
  var target_model;

  switch (req.params.target) {
    case 'team':
      targetModel = mongoose.model('CompanyGroup');
      break;
    default:
      return res.send(400);
  }

  target_model
    .findById(req.params.targetId)
    .exec()
    .then(function(model) {
      if (!model) {
        return res.send(404);
      }
      req.target_model = target_model;
      next();
    })
    .then(null, function(err) {
      console.log(err);
      res.send(500);
    });
};




/**
 * api 创建相册
 *
 * need:
 *   req.body.name 相册名
 */
exports.createPhotoAlbumAPI = function(req, res) {

  var create_user;
  if (req.user.provider === 'user') {
    create_user = {
      _id: req.user._id,
      name: req.user.nickname,
      type: 'user'
    };
  } else if (req.user.provider === 'company') {
    create_user = {
      _id: req.user._id,
      name: req.user.info.name,
      type: 'hr'
    }
  }


  createPhotoAlbum(req.target_model, {
    name: req.body.name,
    create_user: create_user
  }, function(err, photo_album) {
    if (err) {
      console.log(err);
      return res.send(500);
    }
    return res.send(200);
  });


};


exports.readPhotoAlbumAPI = function(req, res) {

};