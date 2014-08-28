module.exports = {
  "Donler首页测试" : function (browser) {
    browser
      .url("http://127.0.0.1:3000")
      .waitForElementVisible('body', 1000)
      .assert.elementPresent('.nav form.signin', '登录表单显示正常')
      .assert.elementPresent('.regbox a.btn_reg', '注册按钮显示正常')
      .end();
  }
};