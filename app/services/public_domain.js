'use strict';
var publicDomains = ['126.com','qq.com'];

// exports.getPublicDomains = function() {
//   return publicDomains;
// }

exports.isPublicDomain = function(domain) {
  return publicDomains.indexOf(domain) > -1;
}