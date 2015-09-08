
(function() {
  function getXMLHttpRequest(){
   if(window.XMLHttpRequest){
    return new XMLHttpRequest();
   }else{
    var names=["msxml","msxml2","msxml3","Microsoft"];
    for(var i=0;i<names.length;i++){
     try{
      var name=names[i]+".XMLHTTP";
      return new ActiveXObject(name);
     }catch(e){
     }
    }
   }
   return null;
  }
  var apiBaseUrl = 'http://' + window.location.hostname + ':3002'+'/v2_0';
  var loginApiPath = '/users/login';

  var usernameInputEle = document.getElementById('phone');
  var passwordInputEle = document.getElementById('password');
  var loginButtonEle = document.getElementById('login_button');

  var errorMsgPEle = document.getElementById('error_msg_p');

  loginButtonEle.onclick = function() {
    var loginReq = getXMLHttpRequest();
    loginReq.onload = function() {
      var data = JSON.parse(this.response);
      if (this.status === 200) {
        if (data.token) {
          localStorage.setItem('x-access-token', data.token);
        }
        if (data.id) {
          localStorage.setItem('id', data.id);
        }
        if (data.cid) {
          localStorage.setItem('cid', data.cid);
        }
        if (data.role) {
          localStorage.setItem('role', data.role);
        }
        location.pathname = '/company/manager';
      }
      else if (this.status === 401) {
        errorMsgPEle.textContent = data.msg || '账号或密码错误';
        errorMsgPEle.classList.add('show');

      }
      else {
        errorMsgPEle.textContent = data.msg || '服务器错误';
        errorMsgPEle.classList.add('show');
      }
    };
    loginReq.withCredentials = true;
    loginReq.open('post', apiBaseUrl + loginApiPath, true);
    loginReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    loginReq.send(JSON.stringify({
      phone: usernameInputEle.value,
      password: passwordInputEle.value
    }));
  };

})();