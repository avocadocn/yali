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