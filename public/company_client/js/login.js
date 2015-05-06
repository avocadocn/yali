
(function() {

  var apiBaseUrl = 'http://' + window.location.hostname + ':3002';
  var loginApiPath = '/companies/login';

  var usernameInputEle = document.getElementById('username');
  var passwordInputEle = document.getElementById('password');
  var loginButtonEle = document.getElementById('login_button');

  var errorMsgRowEle = document.getElementById('error_msg_row');
  var errorMsgPEle = document.getElementById('error_msg_p');

  loginButtonEle.onclick = function() {
    var loginReq = new XMLHttpRequest();
    loginReq.onload = function() {
      var data = JSON.parse(this.response);
      if (this.status === 200) {
        if (data.token) {
          localStorage.setItem('x-access-token', data.token);
        }
        if (data.id) {
          localStorage.setItem('cid', data.id);
        }
        location.pathname = '/company/manager';
      }
      else if (this.status === 401) {
        errorMsgPEle.textContent = data.msg || '用户名或密码错误';
        errorMsgRowEle.classList.remove('hidden');
      }
      else {
        errorMsgPEle.textContent = data.msg || '服务器错误';
        errorMsgRowEle.classList.remove('hidden');
      }
    };
    loginReq.withCredentials = true;
    loginReq.open('post', apiBaseUrl + loginApiPath, true);
    loginReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    loginReq.send(JSON.stringify({
      username: usernameInputEle.value,
      password: passwordInputEle.value
    }));
  };

})();