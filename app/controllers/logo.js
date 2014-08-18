'use strict';

// node system
var fs = require('fs'),
  crypto = require('crypto'),
  path = require('path');

// 3rd
var mongoose = require('mongoose'),
  validator = require('validator'),
  async = require('async'),
  mime = require('mime'),
  gm = require('gm');

// mongoose model
var User = mongoose.model('User'),
  CompanyGroup = mongoose.model('CompanyGroup'),
  Company = mongoose.model('Company');

// custom
var schedule = require('../services/schedule'),
  config = require('../../config/config');


exports.updateLogo = function(req, res, next) {

  var target_model;
  var logo_model;  // 数据库设计不够扁平化，只能用它当对象引用了，用于company.info.logo
  var logo_property = 'logo';
  var default_logo_uri;
  var target_dir;  // 文件系统路径，供fs使用
  var uri_dir;  // uri路径，存入数据库的路径，供前端访问
  var updateLogo;
  var this_id;

  async.waterfall([
    function(callback) {
      switch (req.body.target) {
      case 'u':
        target_model = req.user;
        this_id = req.user._id;
        updateLogo = schedule.updateUlogo;
        logo_model = target_model;
        logo_property = 'photo';
        target_dir = path.join(config.root, '/public/img/user/photo/');
        uri_dir = '/img/user/photo/';
        callback(null);
        break;
      case 'g':
        target_dir = path.join(config.root, '/public/img/group/logo/');
        uri_dir = '/img/group/logo/';
        CompanyGroup
        .findOne({ _id: req.body.teamId })
        .exec()
        .then(function(company_group) {
          if (company_group) {
            target_model = company_group;
            this_id = company_group._id;
            updateLogo = schedule.updateTlogo;
            logo_model = target_model;
            callback(null);
          } else {
            res.status(404);
            callback('not found company_group');
          }
        })
        .then(null, callback);
        break;
      case 'c':
        target_model = req.user;
        this_id = req.user._id;
        updateLogo = schedule.updateCompanyLogo;
        logo_model = target_model.info;
        target_dir = path.join(config.root, '/public/img/company/logo/');
        uri_dir = '/img/company/logo/';
        callback(null);
        break;
      default:
        res.status(400);
        callback('bad request');
        break;
      }
    },
    function(callback) {
      var logo_temp_path = req.files.logo.path;
      var ext = mime.extension(req.files.logo.type);

      // 存入数据库的文件名，以当前时间的加密值命名
      var shasum = crypto.createHash('sha1');
      shasum.update( Date.now().toString() + Math.random().toString() );
      var logo_file_name = shasum.digest('hex') + '.' + ext;

      try {
        gm(logo_temp_path).size(function(err, value) {
          if (err) callback(err);

          // req.body参数均为百分比
          var w = req.body.width * value.width;
          var h = req.body.height * value.height;
          var x = req.body.x * value.width;
          var y = req.body.y * value.height;

          // 在保存新路径前，将原路径取出，以便删除旧文件
          var ori_logo = logo_model[logo_property];


          try {
            gm(logo_temp_path)
            .crop(w, h, x, y)
            .resize(150, 150)
            .write(path.join(target_dir, logo_file_name), function(err) {
              if (err) {
                callback(err);
              }
              else {
                logo_model[logo_property] = path.join(uri_dir, logo_file_name);
                target_model.save(function(err) {
                  if (err) {
                    callback(err);
                  } else {
                    updateLogo(this_id);
                  }
                });

                fs.unlink(logo_temp_path, function(err) {
                  if (err) {
                    return callback(err);
                  }
                  // var unlink_dir = path.join(config.root, 'public');
                  // if (ori_logo.indexOf('/img/icons/') === -1) {
                  //   if (fs.existsSync(unlink_dir + ori_logo)) {
                  //     fs.unlinkSync(unlink_dir + ori_logo);
                  //   }
                  // }
                  //success
                  return res.send({ result: 1 });
                });
              }
            });
          } catch (e) {
            callback(e);
          }

        });
      } catch (e) {
        callback(e);
      }
    }
  ], function(err, result) {
    if (err) {
      next(err);
    }
  });


};


exports.readLogo = function(req, res) {
  var target_model = null;
  switch (req.params.target) {
  case 'user':
    target_model = User;
    break;
  case 'group':
    target_model = CompanyGroup;
    break;
  case 'company':
    target_model = Company;
    break;
  default:
    return res.send(400);
  }

  var width = req.params.width;
  var height = req.params.height;
  if (!validator.isNumeric(width + height)) {
    return res.send(400);
  }

  target_model
  .findOne({ _id: req.params.id })
  .exec()
  .then(function(model) {
    if (!model) {
      throw 'not found';
    }

    var logo = null;
    switch (req.params.target) {
    case 'user':
      logo = model.photo;
      break;
    case 'group':
      logo = model.logo;
      break;
    case 'company':
      logo = model.info.logo;
      break;
    }

    gm(path.join(config.root, 'public', logo))
    .resize(width, height, '!')
    .stream(function(err, stdout, stderr) {
      if (err) {
        console.log(err);
        res.send(500);
      }
      else {
        stdout.pipe(res);
      }
    });
  })
  .then(null, function(err) {
    console.log(err);

    // TO DO: 可区分错误类型
    res.send(404);
  });

};

