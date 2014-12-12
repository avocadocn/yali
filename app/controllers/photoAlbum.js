'use strict';

// node system
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

// mongoose and models
var mongoose = require('mongoose');
var PhotoAlbum = mongoose.model('PhotoAlbum');
var Photo = mongoose.model('Photo');
var Company = mongoose.model('Company');
var CompanyGroup = mongoose.model('CompanyGroup');
var Comment = mongoose.model('Comment');

// 3rd
var validator = require('validator');
var gm = require('gm');
var async = require('async');
var moment = require('moment');
var mime = require('mime');
var mkdirp = require('mkdirp');
var multiparty = require('multiparty');

// custom
var config = require('../../config/config');
var auth = require('../services/auth');


exports.getPhotoAlbum = function (req, res, next) {
  PhotoAlbum.findById(req.params.photoAlbumId).populate('owner.teams').exec()
  .then(function (photoAlbum) {
    if (!photoAlbum) {
      res.status(404);
      next('not found');
      return;
    } else {
      req.photoAlbum = photoAlbum;
      next();
    }
  })
  .then(null, function (err) {
    next(err);
  });
};


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

function photoAlbumDeleteAuth(user, photo_album) {
  var auth = photoAlbumEditAuth(user, photo_album);
  if (auth === false) {
    return false;
  }
  // 活动, 比赛相册禁止删除
  if (photo_album.owner.model.type === 'Campaign') {
    return false;
  }
  return true;
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

/**
 * 按照点击数由大到小排序照片
 * @param  {Object} a Photo model
 * @param  {Object} b
 * @return {Boolean}
 */
var sortByClick = function(a, b) {
  // 兼容旧数据，旧的数据没有click属性
  if (!a.click) {
    a.click = 0;
  }
  if (!b.click) {
    b.click = 0;
  }
  return b.click - a.click;
};


var sortByUploadDate = function(a, b) {
  return  b.upload_date - a.upload_date;
};

var sortByUpdateDate = function(a, b) {
  return b.update_date - a.update_date;
};



// 一个相册的第一张未删除的图片的uri, 没有则返回默认图
var photoAlbumThumbnail = exports.photoAlbumThumbnail = function(photo_album) {
  var first_photo;
  for (var i = photo_album.photos.length - 1; i >= 0; i--) {
  //for (var i = 0; i < photo_album.photos.length; i++) {
    if (photo_album.photos[i].hidden === false) {
      first_photo = photo_album.photos[i];
      break;
    }
  }
  if (first_photo) {
    return first_photo.uri;
  } else {
    return '/img/icons/default_photo_album.png';
  }
};

// 一个相册的未删除照片（数组）
var photoThumbnailList = exports.photoThumbnailList = function(photo_album, count) {
  var photo_list = [];
  if (!count) {
    var count = 4;
  }
  for (var i = 0; i < photo_album.photos.length; i++) {
    if (photo_album.photos[i].hidden === false) {
      photo_list.push(photo_album.photos[i]);
    }
  }
  photo_list.sort(sortByUploadDate);
  photo_list.sort(sortByClick);
  return photo_list.slice(0, count);
};

// 根据当前登录的用户获取相册的所有者
function getPhotoAlbumOwner(user, photo_album) {
  // why company.team.id, user.team._id?
  if (user.provider === 'company') {
    for (var i = 0; i < user.team.length; i++) {
      for (var j = 0; j < photo_album.owner.teams.length; j++) {
        if (photo_album.owner.teams[j]._id.toString() === user.team[i].id.toString()) {
          var owner = {
            company: photo_album.owner.companies[j],
            team: photo_album.owner.teams[j]
          };
          // 多小队活动的临时解决方案
          if (!owner.company) {
            owner.company = photo_album.owner.companies[0];
          }
          return owner;
        }
      }
    }
  } else if (user.provider === 'user') {
    for (var i = 0; i < user.team.length; i++) {
      for (var j = 0; j < photo_album.owner.teams.length; j++) {
        if (photo_album.owner.teams[j]._id.toString() === user.team[i]._id.toString()) {
          var owner = {
            company: photo_album.owner.companies[j],
            team: photo_album.owner.teams[j]
          };
          // 多小队活动的临时解决方案
          if (!owner.company) {
            owner.company = photo_album.owner.companies[0];
          }
          return owner;
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
function getShowPhotos(photo_album, count) {
  var photos = [];
  for (var i = 0; i < photo_album.photos.length; i++) {
    if (photo_album.photos[i].hidden === false) {
      photos.push(photo_album.photos[i]);
      if(count&&photos.length === count){
        break;
      }
    }
  }
  photos.sort(sortByUploadDate);
  return photos;
}

function photoAlbumProcess(res, _id, process) {
  if (validator.isAlphanumeric(_id)) {

    PhotoAlbum
    .findOne({ _id: _id })
    .populate('owner.teams')
    .exec(function(err, photo_album) {
      if (err) {
        console.log(err);
        return res.send({ result: 0, msg: '获取相册信息失败' });
      } else {
        if (photo_album) {
          process(photo_album);
        } else {
          return res.send({ result: 0, msg: '没有找到对应的相册' });
        }
      }
    });

  } else {
    return res.send({ result: 0, msg: '请求错误' });
  }
}

//-根据小队id返回整个相册
var getGroupPhotoAlbumList = exports.getGroupPhotoAlbumList = function(group_id, callback) {
  CompanyGroup
  .findById(group_id)
  .populate('photo_album_list')
  .exec()
  .then(function(company_group) {
    if (!company_group) {
      return callback();
    }

    var photo_album_list = [];
    company_group.photo_album_list.sort(sortByUpdateDate);
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
    callback(photo_album_list, company_group);
  })
  .then(null, function(err) {
    console.log(err);
    callback();
  });
};

//- 根据小队ID返回该小组最新相册中的n张图片
var getNewPhotos = exports.getNewPhotos = function(group_id, count, callback) {
  if(!count){
    var count= 4;
  }
  var count_flag = count;
  CompanyGroup
  .findById(group_id)
  .populate('photo_album_list')
  .exec()
  .then(function(company_group) {
    if(!company_group) {
      throw 'company_group not found';
    }
    var photos = [];
    company_group.photo_album_list.sort(sortByUpdateDate);
    for(var i =0; i<company_group.photo_album_list.length; i++){
      //取count个非空相册的照片，每个相册取count张，确保得到最新count张照片
      if(count_flag ===0 ){
        break;
      }
      else {
        //相册照片非空
        if(company_group.photo_album_list[i].photos.length > 0){
          photos=photos.concat(getShowPhotos(company_group.photo_album_list[i],count));
          count_flag -- ;
        }
      }
    }
    photos.sort(sortByUploadDate);
    if(photos.length>count){//如果超出剪裁成count张
      photos.length = count;
    }
    //console.log(photos);
    callback(photos);
  })
  .then(null, function(err){
    console.log(err);
    callback(null) ;
  });
};


/**
 * 删除一个相册中的照片
 * @param  {Array}   photos   照片id数组，要求在同一个相册中
 * @param  {Function} callback callback(err)
 */
exports.deletePhotos = function (photos, callback) {
  PhotoAlbum.findOne({ 'photos._id': photos[0] }).exec()
  .then(function (photo_album) {
    if (!photo_album) {
      callback && callback('not found');
    } else {
      photos.forEach(function (comment_photo) {
        for (var i = 0; i < photo_album.photos.length; i++) {
          var photo = photo_album.photos[i];
          if (comment_photo._id.toString() === photo._id.toString()) {
            var result = photo.uri.match(/^([\s\S]+)\/(([-\w]+)\.[\w]+)$/);
            var img_path = result[1], img_filename = result[2], img_name = result[3];

            var ori_path = path.join(config.root, 'public', img_path);
            var size_path = path.join(ori_path, 'size');

            var remove_size_files = fs.readdirSync(size_path).filter(function (item) {
              if (item.indexOf(img_name) === -1) {
                return false;
              } else {
                return true;
              }
            });

            remove_size_files.forEach(function (filename) {
              fs.unlinkSync(path.join(size_path, filename));
            });

            var now = new Date();
            var date_dir_name = now.getFullYear().toString() + '-' + (now.getMonth() + 1);
            var move_targe_dir = path.join(config.root, 'img_trash', date_dir_name);
            if (!fs.existsSync(move_targe_dir)) {
              mkdirp.sync(move_targe_dir);
            }
            // 将上传的图片移至备份目录
            fs.renameSync(path.join(config.root, 'public', photo.uri), path.join(move_targe_dir, img_filename));

            photo.hidden = true;
            photo_album.photo_count -= 1;
            photo_album.save(function (err) {
              if (err) {
                callback && callback(err);
              } else {
                callback && callback();
              }
            })
          }
        }
      })
    }
  })
  .then(null, function (err) {
    callback && callback(err);
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
      .findOne({ _id: req.body.owner_id })
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
      return res.send({ result: 0, msg: 'failed' });
      break;
  }
};

/**
 * 是否有相册创建权限
 * @param  {Object}   req
 * @param  {Function} callback callback(auth), auth: true or false or err
 */
var _createAuth = function(req, callback) {

  /**
   * 处理验证过程
   * @param  {String} cid 相册所属公司_id
   * @param  {String} tid 相册所属的队的_id
   */
  var deal = function(cid, tid) {
    CompanyGroup
    .findById(tid)
    .exec()
    .then(function(team) {
      if (!team) {
        return callback(false);
      }
      // 相册所属的组不在公司里
      if (team.cid.toString() !== cid) {
        return callback(false);
      }

      // 该公司的HR
      var auth = false;
      if (req.user.provider === 'company' && req.user._id.toString() === team.cid.toString()) {
        auth = true;
      }

      var leaders = team.leader || [];
      for (var i = 0; i < leaders.length; i++) {
        if (req.user._id.toString() === leaders[i]._id.toString()) {
          auth = true;
          break;
        }
      }

      return callback(auth);

    })
    .then(null, function(err) {
      callback(err);
    });

  };

  if (req.body.cid && req.body.tid) {
    deal(req.body.cid, req.body.tid);
  } else {
    CompanyGroup.findById(req.params.tid).exec()
    .then(function(this_team) {
      if (!this_team) {
        return callback('not found this company_group');
      }
      deal(this_team.cid.toString(), this_team._id.toString());
    })
    .then(null, callback);
  }



};

exports.createAuth = function(req, res, next) {
  _createAuth(req, function(auth) {
    if (auth === true) {
      req.create_auth = true;
    } else {
      if (typeof auth !== 'boolean') {
        console.log('[PhotoAlbum create auth err]:', auth);
      }
      req.create_auth = false;
    }
    next();
  });
};


exports.createPhotoAlbum = function(req, res) {
  if (!req.create_auth) {
    res.status(403);
    next('forbidden');
    return;
  }
  var photo_album = new PhotoAlbum({
    owner: {
      model: req.owner_model,
      companies: [req.body.cid],
      teams: [req.body.tid]
    },
    name: req.body.name
  });
  if (req.user.provider === 'company') {
    photo_album.create_user = {
      _id: req.user._id,
      name: req.user.info.name,
      type: 'hr'
    };
    photo_album.update_user = photo_album.create_user;
  } else if (req.user.provider === 'user' ) {
    photo_album.create_user = {
      _id: req.user._id,
      name: req.user.nickname,
      type: 'user'
    };
    photo_album.update_user = photo_album.create_user;
  }

  photo_album.save(function(err) {
    if (err) {
      console.log(err);
      return res.send({ result: 0, msg: '创建相册失败' });
    } else {

      req.model.photo_album_list.push(photo_album._id);
      req.model.save(function(err) {
        if (err) {
          console.log(err);
          return res.send({ result: 0, msg: '创建相册失败' });
        }
        else {
          delete req.model;
          delete req.owner_model;
          return res.send({ result: 1, msg: '创建相册成功' });
        }
      });

    }
  });


};





exports.readPhotoAlbum = function(req, res, next) {
  var _id = req.params.photoAlbumId;

  photoAlbumProcess(res, _id, function(photo_album) {
    var owner = getPhotoAlbumOwner(req.user, photo_album);
    if (req.user.provider === 'company' && req.user._id.toString() !== owner.company.toString()
      || req.user.provider === 'user' && req.user.cid.toString() !== owner.company.toString()) {
      res.status(403);
      return next('forbidden');
    }

    if (photo_album.hidden === false) {
      var data = {
        name: photo_album.name,
        update_date: photo_album.update_date,
        update_user: photo_album.update_user
      };
      return res.send({ result: 1, msg: '获取相册信息成功', data: data });
    } else {
      return res.send({ result: 0, msg: '该相册不存在' });
    }

  });
};

exports.updatePhotoAlbum = function(req, res) {
  var _id = req.params.photoAlbumId;
  var new_name = req.body.name;

  photoAlbumProcess(res, _id, function(photo_album) {
    if (photoAlbumEditAuth(req.user, photo_album) === false) {
      res.status(403);
      next('forbidden');
      return;
    }
    if (photo_album.hidden === false) {
      photo_album.name = new_name;
      photo_album.correctPhotoCount();
      photo_album.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          var data = {
            name: photo_album.name,
            update_date: photo_album.update_date,
            update_user: photo_album.update_user
          };
          return res.send({ result: 1, msg: '更新相册成功', data: data });
        }
      });
    } else {
      return res.send({ result: 0, msg: '该相册不存在' });
    }
  });
};

exports.deletePhotoAlbum = function(req, res) {
  var _id = req.params.photoAlbumId;
  if (validator.isAlphanumeric(_id)) {
    PhotoAlbum.findOne({ _id: _id })
    .populate('owner.teams')
    .exec(function(err, photo_album) {
      if (err) {
        console.log(err);
      } else if(photo_album) {

        if (photoAlbumDeleteAuth(req.user, photo_album) === false) {
          res.status(403);
          next('forbidden');
          return;
        }
        photo_album.hidden = true;
        photo_album.save(function(err) {
          if (err) { console.log(err); }
          else {
            return res.send({ result: 1, msg: '删除相册成功' });
          }
        });
      } else {
        return res.send({ result: 0, msg: '删除相册失败' });
      }
    });
  } else {
    return res.send({ result: 0, msg: '请求错误' });
  }
};

exports.createSinglePhoto = function(req, res, next) {
  if (photoUploadAuth(req.user, req.photoAlbum) === false) {
    res.status(403);
    next('forbidden');
    return;
  }

  var cid;
  if (req.user.provider === 'company') {
    cid = req.user._id.toString();
  } else if (req.user.provider === 'user') {
    cid = req.user.cid.toString();
  }

  var now = new Date();
  var date_dir_name = now.getFullYear().toString() + '-' + (now.getMonth() + 1);

  var parent_dir = path.join(config.root, 'public');
  var uri_dir = path.join('/img/photo_album', date_dir_name, cid);
  var system_dir = path.join(parent_dir, uri_dir);

  if (!fs.existsSync(system_dir)) {
    mkdirp.sync(system_dir);
  }

  var upload_user;
  if (req.user.provider === 'company') {
    upload_user = {
      _id: req.user._id,
      name: req.user.info.name,
      type: 'hr'
    };
  } else if (req.user.provider === 'user') {
    upload_user = {
      _id: req.user._id,
      name: req.user.nickname,
      type: 'user'
    };
  }

  var form = new multiparty.Form();

  form.on('error', function (err) {
    console.log(err.stack);
    res.send(500);
  });

  var fileCount = 0; // 处理过的文件数

  var closeHandle = function () {
    if (fileCount === 0) {
      return res.send(500);
    }
  };

  // todo 此处结构过于复杂，尽管直接从流里取到文件，节省一次文件的读写，但没有用管道很好地处理流，效率依然不高，还需要优化 2014-12-12
  form.on('part', function (part) {
    if (!part.filename || fileCount >= 1) {
      return part.resume();
    }
    (function(fileCount) {
      form.removeListener('close', closeHandle);

      var buffers = [];
      part.on('data', function (buffer) {
        buffers.push(buffer);
      });

      part.on('end', function() {
        if (fileCount >= 1) {
          return part.resume();
        }
        var size = part.byteCount - part.byteOffset;
        if (size > 5 * 1024 * 1024) {
          res.send(413);
          return part.resume();
        }
        try {
          var ext = mime.extension(part.headers['content-type']);
          var photo_name = Date.now().toString() + '.' + ext;

          var data = Buffer.concat(buffers);
          gm(data).write(path.join(system_dir, photo_name), function(err) {
            if (err) {
              console.log(err);
              res.send(500);
              return part.resume();
            }

            var photo = new Photo({
              photoAlbum: req.photoAlbum._id,
              uri: path.join(uri_dir, photo_name),
              name: part.filename,
              upload_user: upload_user
            });
            photo.save(function (err) {
              if (err) {
                res.send(500);
                return;
              }
              var dir = path.join(config.root, 'ori_img', date_dir_name, cid);
              if (!fs.existsSync(dir)) {
                mkdirp.sync(dir);
              }
              fs.writeFileSync(path.join(dir, photo._id + '.' + ext), data);
              req.photoAlbum.photo_count += 1;
              req.photoAlbum.upload_user = upload_user;
              req.photoAlbum.update_date = Date.now();
              req.photoAlbum.save(function (err) {
                if (err) {
                  console.log(err);
                  return res.send(500);
                }

                // 将照片_id和uri及第一张图的上传日期存入session
                // 在1分钟内，发表评论时，如果该session值存在，则将图片信息存入评论中
                // 发表完评论后清除session，或是再次上传图片时，超过1分钟，清除上次的session

                // 判断session是否存在，是否过期，新建session
                var now = Date.now();
                if (!req.session.uploadData) {
                  req.session.uploadData = {
                    date: now,
                    photos: []
                  };
                }
                var aMinuteAgo = now - moment.duration(1, 'minutes').valueOf();
                aMinuteAgo = new Date(aMinuteAgo);

                // 超过一分钟，重置数据
                if (aMinuteAgo > req.session.uploadData.date) {
                  req.session.uploadData.date = now;
                  req.session.uploadData.photos = [];
                }

                var new_photo = photo;
                // 保存photo信息到session中
                req.session.uploadData.photos.push({
                  _id: new_photo._id,
                  uri: new_photo.uri
                });

                return res.send({
                  result: 1,
                  msg: '上传成功',
                  photo: {
                    _id: new_photo._id,
                    uri: new_photo.uri
                  }
                });
              });
            });
            part.resume();

          });
        } catch (e) {
          console.log(e);
          res.send(500);
          return part.resume();
        }
      });
    })(fileCount);
    fileCount += 1;

  });

  form.on('close', closeHandle);

  form.parse(req);
};


exports.readPhoto = function(req, res, next) {

  var photoAlbum = req.photoAlbum;
  var owner = getPhotoAlbumOwner(req.user, photoAlbum);
  if (req.user.provider === 'company' && req.user._id.toString() !== owner.company.toString()
    || req.user.provider === 'user' && req.user.cid.toString() !== owner.company.toString()) {
    res.status(403);
    return next('forbidden');
  }
  Photo.findOne({
    _id: req.params.photoId,
    hidden: false
  }).exec()
    .then(function (photo) {
      if (!photo) {
        return res.send({ result: 0, msg: '找不到该照片' });
      }
      return res.send({
        result: 1,
        msg: '获取照片成功',
        data: {
          uri: photo.uri,
          tags: photo.tags,
          upload_user: photo.upload_user
        }
      });
    })
    .then(null, function (err) {
      console.log(err);
      return res.send({ result: 0, msg: '获取照片失败' });
    });


};

exports.updatePhoto = function(req, res) {
  var photoAlbum = req.photoAlbum;
  Photo.findOne({
    _id: req.params.photoId,
    hidden: false
  }).exec()
    .then(function (photo) {
      if (!photo) {
        return res.send({ result: 0, msg: '找不到该照片' });
      }

      var setUpdateUser = function() {
        if (req.user.provider === 'company') {
          photoAlbum.update_user = {
            _id: req.user._id,
            name: req.user.info.name,
            type: 'hr'
          };
        } else if (req.user.provider === 'user' ) {
          photoAlbum.update_user = {
            _id: req.user._id,
            name: req.user.nickname,
            type: 'user'
          };
        }
      };

      if (photoEditAuth(req.user, photoAlbum, photo) === true) {
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

      photo.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          return res.send({ result: 1, msg: '更新成功' });
        }
      });

    })
    .then(null, function (err) {
      console.log(err);
      return res.send({ result: 0, msg: '获取照片失败' });
    });

};

exports.deletePhoto = function(req, res) {

  var photoAlbum = req.photoAlbum;
  Photo.findOne({
    _id: req.params.photoId,
    hidden: false
  }).exec()
    .then(function (photo) {
      if (!photo) {
        return res.send({ result: 0, msg: '找不到该照片' });
      }

      if (photoEditAuth(req.user, photoAlbum, photo) === false) {
        res.status(403);
        next('forbidden');
        return;
      }

      var result = photo.uri.match(/^([\s\S]+)\/(([-\w]+)\.[\w]+)$/);
      var img_path = result[1], img_filename = result[2], img_name = result[3];

      var ori_path = path.join(config.root, 'public', img_path);
      var size_path = path.join(ori_path, 'size');

      var remove_size_files = fs.readdirSync(size_path).filter(function (item) {
        if (item.indexOf(img_name) === -1) {
          return false;
        } else {
          return true;
        }
      });

      remove_size_files.forEach(function (filename) {
        fs.unlinkSync(path.join(size_path, filename));
      });

      var now = new Date();
      var date_dir_name = now.getFullYear().toString() + '-' + (now.getMonth() + 1);
      var move_targe_dir = path.join(config.root, 'img_trash', date_dir_name);
      if (!fs.existsSync(move_targe_dir)) {
        mkdirp.sync(move_targe_dir);
      }
      // 将上传的图片移至备份目录
      fs.renameSync(path.join(config.root, 'public', photo.uri), path.join(move_targe_dir, img_filename));

      photo.hidden = true;
      photo.save(function (err) {
        if (err) {
          console.log(err);
          res.send({ result: 0, msg: '删除照片失败' });
        } else {
          res.send({ result: 1, msg: '删除照片成功' });
        }
      });
      photoAlbum.correctPhotoCount();
      photoAlbum.save(function(err) {
        // 即使更新相册照片数量失败了，依然算作是删除成功。
        console.log(err);
      });

    })
    .then(null, function (err) {
      console.log(err);
      return res.send({ result: 0, msg: '删除照片失败' });
    });

};

exports.readGroupPhotoAlbumList = function(req, res, next) {
  if (!req.user) {
    res.status(403);
    return next('forbidden');
  }
  getGroupPhotoAlbumList(req.params.tid, function(photo_album_list) {
    if (photo_album_list !== null) {
      CompanyGroup.findById(req.params.tid).exec()
      .then(function (company_group) {
        if (!company_group) {
          res.status(404);
          return next('not found');
        }
        if (req.user.provider === 'company' && req.user._id.toString() !== company_group.cid.toString()
          || req.user.provider === 'user' && req.user.cid.toString() !== company_group.cid.toString()) {
          res.status(403);
          return next('forbidden');
        }
        return res.send({ result: 1, photo_album_list: photo_album_list });
      })
      .then(null, function (err) {
        res.status(500);
        return next('err');
      });
    } else {
      res.status(404);
      return next('not found');
    }
  });

};


exports.renderGroupPhotoAlbumList = function(req, res, next) {
  if (!req.user) {
    res.status(403);
    return next('forbidden');
  }
  getGroupPhotoAlbumList(req.params.tid, function(photo_album_list, company_group) {
    if (photo_album_list !== null) {
      if (req.user.provider === 'company' && req.user._id.toString() !== company_group.cid.toString()
        || req.user.provider === 'user' && req.user.cid.toString() !== company_group.cid.toString()) {
        res.status(403);
        return next('forbidden');
      }
      var links = [
        {
          text: company_group.name,
          url: '/group/page/' + company_group._id
        },
        {
          text: '相册集',
          active: true
        }
      ];

      var thumbnail = company_group.family.filter(function (photo) {
          return !photo.hidden && photo.select;
        })[0];
      if (!thumbnail) {
        thumbnail = '/img/family.png';
      } else {
        thumbnail = thumbnail.uri;
      }
      var showFilter = function (photo) {
        return !photo.hidden;
      };
      var lastPhoto = company_group.family.filter(showFilter).sort(function (a, b) {
        return b.upload_date - a.upload_date;
      })[0];

      var familyPhotoAlbum = {
        thumbnail: thumbnail,
        name: company_group.name + '的全家福',
        photo_count: company_group.family.filter(showFilter).length
      };

      if (lastPhoto) {
        familyPhotoAlbum.update_user = lastPhoto.upload_user;
        familyPhotoAlbum.update_date = lastPhoto.upload_date;
      }

      return res.render('photo_album/photo_album_list', {
        company_group: company_group,
        photo_album_list: photo_album_list,
        familyPhotoAlbum: familyPhotoAlbum,
        photo: req.user.photo,
        realname: req.user.realname,
        role: req.role,
        owner_id: company_group._id,
        owner_name: company_group.name,
        owner_logo: company_group.logo,
        cid: company_group.cid,
        moment: moment,
        links: links,
        create_auth: req.create_auth
      });
    } else {
      res.status(404);
      return next('not found');
    }
  });
};

exports.renderFamilyPhotoAlbum = function (req, res, next) {
  CompanyGroup.findById(req.params.tid).exec()
    .then(function (companyGroup) {

      if (!companyGroup) {
        res.status(404);
        return next('not found');
      }

      var allow = auth(req.user, {
        companies: [companyGroup.cid],
        teams: [companyGroup._id]
      }, ['editTeam']);

      var links = [
        {
          text: companyGroup.name,
          url: '/group/page/' + companyGroup._id
        },
        {
          text: '相册集',
          url: '/photoAlbum/team/' + companyGroup._id + '/listView'
        },
        {
          text: '全家福相册',
          active: true
        }
      ];

      var showFilter = function (photo) {
        return !photo.hidden;
      };
      var lastPhoto = companyGroup.family.filter(showFilter).sort(function (a, b) {
        return b.upload_date - a.upload_date;
      })[0];
      var lastUpdate = lastPhoto ? moment(lastPhoto.upload_date).format('YYYY.MM.DD') : null;

      res.render('photo_album/family_photo_album', {
        links: links,
        companyGroup: companyGroup,
        showPhotos: companyGroup.family.filter(showFilter),
        lastUpdate: lastUpdate,
        moment: moment,
        allow: allow
      });
    })
    .then(null, function (err) {
      next(err);
    });
};


exports.renderPhotoAlbumDetail = function(req, res, next) {
  if (!req.user) {
    res.status(403);
    return next('forbidden');
  }
  PhotoAlbum
  .findById(req.params.photoAlbumId)
  .populate('owner.teams')
  .populate('owner.companies')
  .exec()
  .then(function(photo_album) {
    if (!photo_album) {
      res.status(404);
      return next('not found');
    }

    var allow = auth(req.user, {
      companies: photo_album.populated('owner.companies'),
      teams: photo_album.populated('owner.teams')
    }, ['publishComment', 'uploadPhoto', 'visitPhotoAlbum']);
    if (!allow.visitPhotoAlbum) {
      res.status(403);
      return next('forbidden');
    }

    var canCommentCampaign = false; // 在传图片时是否可以同时在活动讨论区自动生成评论
    if (allow.publishComment && photo_album.owner.model.type === 'Campaign') {
      canCommentCampaign = true;
    }

    var photos = getShowPhotos(photo_album);
    var owner = getPhotoAlbumOwner(req.user, photo_album);
    // todo 编辑和删除的权限判断有些特殊，以后再改为使用auth权限系统判断
    var editAuth = photoAlbumEditAuth(req.user, photo_album);
    var deleteAuth = photoAlbumDeleteAuth(req.user, photo_album);

    if (!owner.team || owner.team.length === 0) {
      var links = [
        {
          text: owner.company.info.name,
          url: '/company/home'
        },
        {
          text: photo_album.name,
          active: true
        }
      ];
      var return_uri = '/company/home';
      var owner_name = owner.company.info.name;
      var owner_logo = owner.company.info.logo;
    } else {
      var links = [
        {
          text: owner.team.name,
          url: '/group/page/' + owner.team._id
        },
        {
          text: '相册集',
          url: '/photoAlbum/team/' + owner.team._id + '/listView'
        },
        {
          text: photo_album.name,
          active: true
        }
      ];
      var return_uri = '/photoAlbum/team/' + owner.team._id + '/listView';
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
          model: photo_album.owner.model,
          name: owner_name,
          logo: owner_logo
        },
        photo_count: photo_album.photo_count
      },
      return_uri: return_uri,
      moment: moment,
      editAuth: editAuth,
      deleteAuth: deleteAuth,
      allow: allow,
      canCommentCampaign: canCommentCampaign,
      links: links
    });
  })
  .then(null, function(err) {
    if (err) {
      next(err);
    }
  })
};

exports.renderPhotoDetail = function(req, res, next) {
  if (!req.user) {
    res.status(403);
    return next('forbidden');
  }
  PhotoAlbum
  .findById(req.params.photoAlbumId)
  .populate('owner.teams')
  .populate('owner.companies')
  .exec()
  .then(function(photo_album) {
    if (!photo_album) {
      res.status(404);
      return next('not found');
    }

    // todo 查询所有照片，为了取上一张和下一张照片的url而取了全部的照片，这是很糟糕的方法，但暂时没有好主意，以后可再重构
    Photo.find({
      photo_album: photo_album._id,
      hidden: false
    }, { hidden: false })
      .sort('-upload_date')
      .exec()
      .then(function (photos) {
        var pre_id, next_id;
        for (var i = 0; i < photos.length; i++) {
          if (req.params.photoId === photos[i]._id.toString()) {
            var photo = photos[i];
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
            break;
          }
        }
        if (!photo) {
          // 没有找到照片
          res.status(404);
          return next('not found');
        }
        var owner = getPhotoAlbumOwner(req.user, photo_album);
        var editAuth = photoEditAuth(req.user, photo_album, photo);

        if (req.user.provider === 'user' && req.user.cid.toString() !== owner.company._id.toString()
          || req.user.provider === 'company' && req.user._id.toString() !== owner.company._id.toString()) {
          res.status(403);
          return next('forbidden');
        }

        if (!owner.team || owner.team.length === 0) {
          var links = [
            {
              text: owner.company.info.name,
              url: '/company/home'
            },
            {
              text: photo_album.name,
              url: '/photoAlbum/' + photo_album._id + '/detailView'
            },
            {
              text: photo.name,
              active: true
            }
          ];
          var owner_name = owner.company.info.name;
          var owner_logo = owner.company.info.logo;
        } else {
          var links = [
            {
              text: owner.team.name,
              url: '/group/page/' + owner.team._id
            },
            {
              text: '相册集',
              url: '/photoAlbum/team/' + owner.team._id + '/listView'
            },
            {
              text: photo_album.name,
              url: '/photoAlbum/' + photo_album._id + '/detailView'
            },
            {
              text: photo.name,
              active: true
            }
          ];
          var owner_name = owner.team.name;
          var owner_logo = owner.team.logo;
        }

        var return_url = '/photoAlbum/' + photo_album._id + '/detailView';

        // 旧数据无click属性
        if (!photo.click) {
          photo.click = 0;
        }
        photo.click++;

        // 仅为保存点击数，无论成功与否，都允许访问该页面，所以渲染页面过程不写入保存的回调中
        photo_album.save(function(err) {
          if (err) {
            console.log(err);
          }
        });
        return res.render('photo_album/photo_detail', {
          photo_detail: {
            _id: photo._id,
            pre_id: pre_id,
            next_id: next_id,
            uri: photo.uri,
            name: photo.name,
            tags: photo.tags,
            click: photo.click,
            upload_user: photo.update_user,
            upload_date: photo.upload_date
          },
          photo_album: {
            _id: photo_album._id,
            name: photo_album.name,
            update_date: photo_album.update_date,
            photo_count: photo_album.photo_count,
            owner: {
              name: owner_name,
              logo: owner_logo
            }
          },
          links: links,
          return_url: return_url,
          moment: moment,
          editAuth: editAuth,
          user_cid: req.user.provider === 'user' ? req.user.cid : req.user._id
        });
      })
      .then(null, function (err) {
        next(err);
      });



  })
  .then(null, function(err) {
    if (err) {
      next(err);
    }
  });


};

exports.readPhotoList = function(req, res, next) {
  if (!req.user) {
    res.status(403);
    return next('forbidden');
  }
  var _id = req.params.photoAlbumId;

  if (validator.isAlphanumeric(_id)) {

    PhotoAlbum
    .findOne({ _id: _id })
    .populate('owner.teams')
    .populate('owner.companies')
    .exec(function(err, photo_album) {
      if (err) {
        console.log(err);
        return res.send({ result: 0, msg: '获取相册照片失败' });
      } else {
        if (photo_album) {

          var owner = getPhotoAlbumOwner(req.user, photo_album);
          if (req.user.provider === 'user' && req.user.cid.toString() !== owner.company._id.toString()
            || req.user.provider === 'company' && req.user._id.toString() !== owner.company._id.toString()) {
            res.status(403);
            return next('forbidden');
          }

          var canDelete = function (photo) {
            if (req.user._id.toString() === photo.upload_user._id.toString()) {
              return true;
            }
            if (photo_album.owner.teams.length === 1
              && photo_album.owner.teams[0].leader.length > 0
              && photo_album.owner.teams[0].leader[0]._id.toString() === req.user._id.toString()) {
              return true;
            }
            return false;
          };

          Photo.find({
            "photo_album": photo_album._id,
            'hidden': false
          }, { 'hidden': false })
            .sort('-upload_date')
            .exec()
            .then(function (photos) {
              var resPhotos = [];
              photos.forEach(function (photo) {
                resPhotos.push({
                  _id: photo._id,
                  uri: photo.uri,
                  thumbnail_uri: photo.thumbnail_uri,
                  name: photo.name,
                  tags: photo.tags,
                  upload_user: photo.upload_user,
                  upload_date: photo.upload_date,
                  delete_permission: canDelete(photo)
                });
              });
              return res.send({ result: 1, msg: '获取相册照片成功', data: resPhotos });
            })
            .then(null, function (err) {
              next(err);
            });
        } else {
          return res.send({ result: 0, msg: '相册不存在' });
        }
      }
    });

  } else {
    return res.send({ result: 0, msg: '请求错误' });
  }
};


