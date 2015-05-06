var qr = require('qr-image'),
async = require('async'),
fs = require('fs'),
mkdirp = require('mkdirp');
var formatTimeDir = function () {
  var now = new Date()
  return now.getFullYear()+'-'+now.getMonth()+'/';
}
exports.generateCompanyQrcode = function (qrDir, fileName, qrText) {
  var _formatDir = formatTimeDir();
  var finalSaveDir = qrDir +_formatDir;
  var createQr = function () {
    var qrImg = qr.image(qrText, { type: 'png' });
    var fileName = filenam+'.png';
    var finalDir =finalSaveDir+fileName;
    var stream = fs.createWriteStream(finalDir)
    stream.on('error', function (error) {
      console.log("Caught", error);
    });
    qrImg.pipe(stream);
    return finalDir;
  }
  fs.exists(finalSaveDir, function (isExists) {
    if (isExists) {
      createQr();
    }
    else {
      mkdirp(finalSaveDir, createQr);
    }
  });
  
};




