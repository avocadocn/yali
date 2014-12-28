'use strict';

/**
 * 随机生成一串只含字母和数字的字符串
 * @param  {Number} len 要生成的字符串的长度
 * @return {String}
 */
exports.randomAlphaNumeric = function (len) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var randomMax = possible.length;
  for(var i = 0; i < len; i++) {
    text += possible.charAt(Math.floor(Math.random() * randomMax));
  }
  return text;
}