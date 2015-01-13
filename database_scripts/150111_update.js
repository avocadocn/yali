// 更新邀请码为字母和数字，移除特殊字符
var randomAlphaNumeric = function (len) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var randomMax = possible.length;
  for(var i = 0; i < len; i++) {
    text += possible.charAt(Math.floor(Math.random() * randomMax));
  }
  return text;
}

var companies = db.companies.find();
companies.forEach(function (company) {
  company.invite_key = randomAlphaNumeric(8);
  for (var i = 0; i < company.register_invite_code.length; i++) {
    var code = company.register_invite_code[i];
    var rgcode = db.companyregisterinvitecodes.findOne({
      code: code
    });
    rgcode.code = randomAlphaNumeric(8);
    company.register_invite_code[i] = rgcode.code;
    db.companyregisterinvitecodes.save(rgcode);
  }
  db.companies.save(company);
});
//清除用户登录信息--2015/1/12
db.users.update({token_device:{'$exists':true}},{$set:{device:[]},$unset:{token_device:1,app_token:1}},{multi:true})
