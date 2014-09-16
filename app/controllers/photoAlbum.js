'use strict';

// node system
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

// mongoose and models
var mongoose = require('mongoose');
var PhotoAlbum = mongoose.model('PhotoAlbum');
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
      if (photo_list.length === count) {
        break;
      }
    }
  }
  return photo_list.sort(sortByClick);
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
  photos.sort(function(a, b) {
    return b.upload_date - a.upload_date;
  });
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

function photoProcess(res, pa_id, p_id, process) {
  if (validator.isAlphanumeric(pa_id) && validator.isAlphanumeric(p_id)) {

    PhotoAlbum
    .findOne({ _id: pa_id })
    .populate('owner.teams')
    .exec(function(err, photo_album) {
      if (err) {
        console.log(err);
        return res.send({ result: 0, msg: '获取照片失败' });
      } else {
        var photos = photo_album.photos;
        for (var i = 0; i < photos.length; i++) {
          // 此处需要类型转换后再比较, p_id:String, photos[i]._id:Object
          if (p_id == photos[i]._id) {
            return process(photo_album, photos[i]);
          }
        }

        return res.send({ result: 0, msg: '没有找到对应的照片' });
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
      return callback(null);
    }

    var photo_album_list = [];
    company_group.photo_album_list.sort(function(a, b) {
      return b.update_date - a.update_date;
    });
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
    company_group.photo_album_list.sort(function(a, b) {
      return b.update_date - a.update_date;
    });
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
    photos.sort(function(a,b) {//把最多count*count张图片按时间排序
      return b.upload_date - a.upload_date;
    });
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





exports.readPhotoAlbum = function(req, res) {
  var _id = req.params.photoAlbumId;

  photoAlbumProcess(res, _id, function(photo_album) {
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
      photo_album.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          return res.send({ result: 1, msg: '更新相册成功' });
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

exports.createPhoto = function(req, res) {
  var pa_id = req.params.photoAlbumId;
  var photos = req.files.photos;
  if (!photos) {
    return res.send({ result: 0, msg: '请求错误' });
  }
  if (validator.isAlphanumeric(pa_id) && (photos.size > 0 || photos.length > 0)) {

    PhotoAlbum
    .findOne({ _id: pa_id })
    .populate('owner.teams')
    .exec(function(err, photo_album) {

      if (photoUploadAuth(req.user, photo_album) === false) {
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

      if (photos.size) {
        photos = [photos];
      }

      var upload_user;
      if (req.user.provider === 'company') {
        upload_user = {
          _id: req.user._id,
          name: req.user.info.name,
          type: 'hr'
        };
      } else if (req.user.provider === 'user' ) {
        upload_user = {
          _id: req.user._id,
          name: req.user.nickname,
          type: 'user'
        };
      }

      var failed_count = 0;
      var i = 0;

      async.whilst(
        function() { return i < photos.length; },

        function(whilstCallback) {

          var removeErrPhoto = function(photo) {
            fs.unlink(photo.path, function(err) {
              if (err) console.log(err);
              failed_count++;
              i++;
              whilstCallback();
            });
          };

          try {
            if (photos[i].type.indexOf('image') === -1) {
              removeErrPhoto(photos[i]);
              return;
            }
            var ext = mime.extension(photos[i].type);

            var photo_name = Date.now().toString() + '.' + ext;
            var photo = {};

            gm(photos[i].path)
            .write(path.join(system_dir, photo_name),
              function(err) {
                if (err) {
                  removeErrPhoto(photos[i]);
                  return;
                } else {

                  var photo = {
                    uri: path.join(uri_dir, photo_name),
                    name: photos[i].name,
                    upload_user: upload_user
                  };
                  photo_album.photos.push(photo);
                  photo_album.photo_count += 1;

                  i++;
                  whilstCallback();
                }
              }
            );
          } catch (e) {
            console.log(e);
            removeErrPhoto(photos[i]);
            return;
          }

        },

        function(err) {
          if (err) {
            console.log(err);
            return res.send({ result: 0, msg: '上传照片失败，请重试。' });
          } else {
            photo_album.update_user = upload_user;
            photo_album.update_date = Date.now();
            photo_album.save(function(err) {
              if (err) {
                console.log(err);
                return res.send({ result: 0, msg: '上传照片失败，请重试。' });
              } else {
                var result;
                var msg;
                if (failed_count > 0 && failed_count < photos.length) {
                  result = 0;
                  msg = '部分照片上传失败，请重试。';
                } else if (failed_count === photos.length) {
                  result = 0;
                  msg = '上传照片失败，请重试。';
                } else {
                  result = 1;
                  msg = '上传照片成功';
                }
                return res.send({ result: result, msg: msg });
              }
            });
          }
        }
      );

    });

  } else {
    return res.send({ result: 0, msg: '请求错误' });
  }
};



exports.readPhoto = function(req, res) {
  var pa_id = req.params.photoAlbumId;
  var p_id = req.params.photoId;

  photoProcess(res, pa_id, p_id, function(photo_album, photo) {
    if (photo.hidden === false) {
      return res.send({ result: 1, msg: '获取照片成功',
        data: {
          uri: photo.uri,
          comments: photo.comments,
          tags: photo.tags,
          upload_user: photo.upload_user
        }
      });
    } else {
      return res.send({ result: 0, msg: '该照片不存在' });
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
        } else if (req.user.provider === 'user' ) {
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
      //今后评论不在photo中，待天航查看是否还有需要保留此段
      // if (req.body.text) {
      //   if (req.user.provider === 'company') {
      //     return res.send(403);
      //   }
      //   photo.comments.push({
      //     content: req.body.text,
      //     publish_user: {
      //       _id: req.user._id,
      //       nickname: req.user.nickname,
      //       photo: req.user.photo
      //     }
      //   });
      //   setUpdateUser();
      // }
      photo_album.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          return res.send({ result: 1, msg: '更新成功' });
        }
      });
    } else {
      return res.send({ result: 0, msg: '该照片不存在' });
    }
  });

};

exports.deletePhoto = function(req, res) {
  var pa_id = req.params.photoAlbumId;
  var p_id = req.params.photoId;

  if (validator.isAlphanumeric(pa_id) && validator.isAlphanumeric(p_id)) {

    PhotoAlbum
    .findOne({ _id: pa_id })
    .populate('owner.teams')
    .exec(function(err, photo_album) {
      if (err) {
        console.log(err);
        return res.send({ result: 0, msg: '删除照片失败' });
      } else {
        var photos = photo_album.photos;
        for (var i = 0; i < photos.length; i++) {
          // 此处需要类型转换后再比较, p_id:String, photos[i]._id:Object
          if (p_id == photos[i]._id) {

            if (photoEditAuth(req.user, photo_album, photos[i]) === false) {
              res.status(403);
              next('forbidden');
              return;
            }

            photos[i].hidden = true;
            photo_album.photo_count -= 1;
            photo_album.save(function(err) {
              if (err) {
                console.log(err);
                return res.send({ result: 0, msg: '删除照片失败' });
              } else {
                return res.send({ result: 1, msg: '删除照片成功' });
              }
            });
            return;
          }
        }

        return res.send({ result: 0, msg: '没有找到对应的照片' });
      }
    });


  } else {
    return res.send({ result: 0, msg: '请求错误' });
  }
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
  getGroupPhotoAlbumList(req.params.tid, function(photo_album_list) {
    if (photo_album_list !== null) {
      CompanyGroup
      .findById(req.params.tid)
      .exec()
      .then(function(company_group) {
        if (!company_group) {
          res.status(404);
          return next('not found');
        }
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
          links: links,
          create_auth: req.create_auth
        });
      })
      .then(null, function(err) {
        if (err) {
          next(err);
        }
      });
    } else {
      res.status(404);
      return next('not found');
    }
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
      res.status(404)
      return next('not found');
    }
    var photos = getShowPhotos(photo_album);
    var owner = getPhotoAlbumOwner(req.user, photo_album);
    var editAuth = photoAlbumEditAuth(req.user, photo_album);
    var deleteAuth = photoAlbumDeleteAuth(req.user, photo_album);
    var uploadAuth = photoUploadAuth(req.user, photo_album);
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
          name: owner_name,
          logo: owner_logo
        },
        photo_count: photo_album.photo_count
      },
      return_uri: return_uri,
      moment: moment,
      editAuth: editAuth,
      deleteAuth: deleteAuth,
      uploadAuth: uploadAuth,
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
              text: photos[i].name,
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
              text: photos[i].name,
              active: true
            }
          ];
          var owner_name = owner.team.name;
          var owner_logo = owner.team.logo;
        }

        var return_url = '/photoAlbum/' + photo_album._id + '/detailView';

        // 旧数据无click属性
        if (!photos[i].click) {
          photos[i].click = 0;
        }
        photos[i].click++;

        // 仅为保存点击数，无论成功与否，都允许访问该页面，所以渲染页面过程不写入保存的回调中
        photo_album.save(function(err) {
          if (err) {
            console.log(err);
          }
        });
        (function(i) {
          Comment.find({'host_id':photos[i]._id,'status':{'$ne':'delete'},'host_type':'photo'}).sort({'create_date':-1})
          .exec(function(err, comments){
            return res.render('photo_album/photo_detail', {
              photo_detail: {
                _id: photos[i]._id,
                pre_id: pre_id,
                next_id: next_id,
                uri: photos[i].uri,
                name: photos[i].name,
                tags: photos[i].tags,
                click: photos[i].click,
                upload_user: photos[i].update_user,
                upload_date: photos[i].upload_date
              },
              comments:comments,
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
              editAuth: editAuth,
              user_cid: req.user.provider === 'user' ? req.user.cid : req.user._id
            });
          });
        }(i));

        return;
      }
    }

    // 没有找到照片
    res.status(404);
    return next('not found');
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

          var photos = [];
          photo_album.photos.forEach(function(photo) {
            if (photo.hidden === false) {
              var temp_photo = {
                _id: photo._id,
                uri: photo.uri,
                thumbnail_uri: photo.thumbnail_uri,
                tags: photo.tags,
                upload_user: photo.upload_user,
                upload_date: photo.upload_date
              };
              photos.push(temp_photo);
            }
          });
          return res.send({ result: 1, msg: '获取相册照片成功', data: photos });
        } else {
          return res.send({ result: 0, msg: '相册不存在' });
        }
      }
    });

  } else {
    return res.send({ result: 0, msg: '请求错误' });
  }
};


exports.preview = function(req, res) {
  if (!req.user) {
    return res.send(403);
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
        return res.send(500);
      } else {
        if (photo_album) {

          var owner = getPhotoAlbumOwner(req.user, photo_album);
          if (req.user.provider === 'user' && req.user.cid.toString() !== owner.company._id.toString()
            || req.user.provider === 'company' && req.user._id.toString() !== owner.company._id.toString()) {
            res.send(403);
          }

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
          return res.send(404);
        }
      }
    });

  } else {
    return res.send(404);
  }
}


