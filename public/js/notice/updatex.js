//browser-update.org notification script, <browser-update.org>
//Copyright (c) 2007-2009, MIT Style License <browser-update.org/LICENSE.txt>
var $buo = function(op,test) {
var jsv=10000;
var n = window.navigator,b;
this.op=op||{};
//options
delete(this.op.url);
this.op.l = op.l||n["language"]||n["userLanguage"]||document.documentElement.getAttribute("lang")||"en";
this.op.vsakt = {i:11,f:27,o:19,s:7,n:20,c:32};
this.op.vsdefault = {i:8,f:10,o:12,s:5,n:12,c:10};
this.op.vsmin={i:7,f:5,o:12,s:5,n:10,c:5};
var myvs=op.vs||{};
this.op.vs =op.vs||this.op.vsdefault;
for (b in this.op.vsakt) {
    if (this.op.vs[b]>=this.op.vsakt[b])
        this.op.vs[b]=this.op.vsakt[b]-0.2;
    if (!this.op.vs[b])
        this.op.vs[b]=this.op.vsdefault[b];
    if (this.op.vs[b]<this.op.vsmin[b])
        this.op.vs[b]=this.op.vsmin[b];    
}
if (op.reminder<0.1 || op.reminder===0)
    this.op.reminder=0;
else if (!op.reminder)
    this.op.reminder=24;
else
    this.op.reminder=op.reminder||24;

this.op.onshow = op.onshow||function(o){};
this.op.onclick = op.onclick||function(o){};
this.op.pageurl = op.pageurl || window.location.hostname || "unknown";
this.op.newwindow=op.newwindow||true;

this.op.test=test||op.test||false;
if (window.location.hash=="#test-bu")
    this.op.test=true;

/*
if (op.exp || (this.op.l=="en" && !this.op.test && Math.round(Math.random()*100)==1)) { //test new script
     var e = document.createElement("script");
     e.setAttribute("type", "text/javascript");
     e.setAttribute("src", "//browser-update.org/updatex.js");
     document.body.appendChild(e);
     return;
}
*/

function getBrowser() {
    var n,v,t,ua = navigator.userAgent;
    var names={i:'Internet Explorer',f:'Firefox',o:'Opera',s:'Apple Safari',n:'Netscape Navigator', c:"Chrome", x:"Other"};
    if (/bot|googlebot|facebook|slurp|wii|silk|blackberry|mediapartners|adsbot|silk|android|phone|bingbot|google web preview|like firefox|chromeframe|seamonkey|opera mini|min|meego|netfront|moblin|maemo|arora|camino|flot|k-meleon|fennec|kazehakase|galeon|android|mobile|iphone|ipod|ipad|epiphany|rekonq|symbian|webos/i.test(ua)) n="x";
    else if (/Trident.*rv:(\d+\.\d+)/i.test(ua)) n="i";
    else if (/Trident.(\d+\.\d+)/i.test(ua)) n="io";
    else if (/MSIE.(\d+\.\d+)/i.test(ua)) n="i";
    else if (/OPR.(\d+\.\d+)/i.test(ua)) n="o";
    else if (/Chrome.(\d+\.\d+)/i.test(ua)) n="c";
    else if (/Firefox.(\d+\.\d+)/i.test(ua)) n="f";
    else if (/Version.(\d+.\d+).{0,10}Safari/i.test(ua))  n="s";
    else if (/Safari.(\d+)/i.test(ua)) n="so";
    else if (/Opera.*Version.(\d+\.\d+)/i.test(ua)) n="o";
    else if (/Opera.(\d+\.?\d+)/i.test(ua)) n="o";
    else if (/Netscape.(\d+)/i.test(ua)) n="n";
    else return {n:"x",v:0,t:names[n]};
    
    if (/windows.nt.5.0|windows.nt.4.0|windows.98|os x 10.4|os x 10.5|os x 10.3|os x 10.2/.test(ua)) n="x";
    
    
    if (n=="f" && v==24) //do not notify firefox ESR
        n="x";
    
    if (n=="x") return {n:"x",v:0,t:names[n]};
    
    v=new Number(RegExp.$1);
    if (n=="so") {
        v=((v<100) && 1.0) || ((v<130) && 1.2) || ((v<320) && 1.3) || ((v<520) && 2.0) || ((v<524) && 3.0) || ((v<526) && 3.2) ||4.0;
        n="s";
    }
    if (n=="i" && v==7 && window.XDomainRequest) {
        v=8;
    }
    if (n=="io") {
        n="i";
        if (v>6) v=11;
        else if (v>5) v=10;
        else if (v>4) v=9;
        else if (v>3.1) v=8;
        else if (v>3) v=7;
        else v=9;
    } 
    return {n:n,v:v,t:names[n]+" "+v};
}

this.op.browser=getBrowser();
if (!this.op.test && (!this.op.browser || !this.op.browser.n || this.op.browser.n=="x" || document.cookie.indexOf("browserupdateorg=pause")>-1 || this.op.browser.v>this.op.vs[this.op.browser.n]))
    return;



if (this.op.reminder>0) {
    var d = new Date(new Date().getTime() +1000*3600*this.op.reminder);
    document.cookie = 'browserupdateorg=pause; expires='+d.toGMTString()+'; path=/';
}
var ll=this.op.l.substr(0,2);
var languages = "xx,de,en,he,fr,cs,nl,sq,es";

var tar="";
if (this.op.newwindow)
    tar=' target="_blank"';

function busprintf() {
    var args=arguments;
    var data = args[ 0 ];
    for( var k=1; k<args.length; ++k ) {
        data = data.replace( /%s/, args[ k ] );
    }
    return data;
}


var u=location.hostname;
if (!u)
    u="This Website";
else if (u.search(/\.(co|com|org|gov|net)\./i)>1)
    u=(u.match(/[^\.]+\.[^\.]+\.[^\.]+$/i)||[""])[0];
else
    u=(u.match(/[^\.]+\.[^\.]+$/i)||[""])[0];
if (u.length<6)
    u="This Website";

var texts = [
    {i:0,t:'Your browser (%s) is <b>out of date</b>. It has known <b>security flaws</b> and may <b>not display all features</b> of this and other websites. \
         <a%s>Learn how to update your browser</a>'},
//    {i:1,t:'The web browser you are using (%s) is <b>out of date</b>.\
//         <a%s>Learn how to easily update your browser</a> for more security and the best experience on this site.'},
//    {i:2,t:'The web browser you are using (%s) is <b>out of date</b>.\
//         <a%s>Learn how to easily update your browser</a> for more security and the best experience on this site.'},
    {i:3,t:'The web browser you are using (%s) is <b>out of date</b>.\
         <a%s>Update your browser</a> for more security, comfort and the best experience on this site.'},
    {i:4,t:'Your browser (%s) is <b>out of date</b>.\
         <a%s>Update your browser</a> for more security, comfort and the best experience on this site.'},
//    {i:5,t:'Your browser (%s) is <b>out of date</b>.\
//         This website recommends to <a%s>update your browser</a> for more security, comfort and the best experience on this site.'},
    {i:6,t:'This website would like to remind you: Your browser (%s) is <b>out of date</b>.\
         <a%s>Update your browser</a> for more security, comfort and the best experience on this site.'},
    {i:7,t:'Your browser (%s) is <b>out of date</b>.\
         '+u+' recommends to <a%s>update your browser</a> for more security, comfort and the best experience on this site.'}         
];




var styles = [
    {i:0,mt:true,t:".buorg {position:absolute;z-index:111111;\
width:100%; top:0px; left:0px; \
border-bottom:1px solid #A29330; \
background:#FDF2AB no-repeat 10px center url(//browser-update.org/img/dialog-warning.gif);\
text-align:left; cursor:pointer; \
font-family: Arial,Helvetica,sans-serif; color:#000; font-size: 12px;}\
.buorg div { padding:5px 36px 5px 40px; } \
.buorg a,.buorg a:visited  {color:#E25600; text-decoration: underline;}\
#buorgclose { position: absolute; right: .5em; top:.2em; height: 20px; width: 12px; font-weight: bold;font-size:14px; padding:0; }"
        },
    {i:1,t: ".buorg {position:absolute;position:fixed;z-index:111111;\
width:320px; bottom:50px; left:50px; \
border:1px solid #A29330; \
background:#FDF2AB;\
text-align:left; cursor:pointer; \
font-family: Arial,Helvetica,sans-serif; color:#000; font-size: 14px;}\
.buorg div { padding:11px; } \
.buorg a,.buorg a:visited  {color:#E25600; text-decoration: underline;}\
#buorgclose { position: absolute; right: 2px; top:-6px; height: 20px; width: 12px; font-weight: bold;font-size:18px; padding:0; }"
        },
//    {i:2,t: ".buorg {position:absolute;position:fixed;z-index:111111;\
//width:320px; bottom:0px; left:0px; \
//border:1px solid #A29330; \
//background:#FDF2AB;\
//text-align:left; cursor:pointer; \
//font-family: Arial,Helvetica,sans-serif; color:#000; font-size: 14px;}\
//.buorg div { padding:11px; } \
//.buorg a,.buorg a:visited  {color:#E25600; text-decoration: underline;}\
//#buorgclose { position: absolute; right: 2px; top:-6px;  height: 20px; width: 12px; font-weight: bold;font-size:18px; padding:0; }"
//        },    
        {i:3,mt:true,t:".buorg {position:fixed;z-index:111111;\
width:100%; top:0px; left:0px; \
border-bottom:1px solid #A29330; \
background:#FDF2AB no-repeat 10px center url(//browser-update.org/img/dialog-warning.gif);\
text-align:left; cursor:pointer; \
font-family: Arial,Helvetica,sans-serif; color:#000; font-size: 12px;}\
.buorg div { padding:5px 36px 5px 40px; } \
.buorg a,.buorg a:visited  {color:#E25600; text-decoration: underline;}\
#buorgclose { position: absolute; right: .5em; top:.2em; height: 20px; width: 12px; font-weight: bold;font-size:14px; padding:0; }"
        },    
//        {i:4,mt:true,t:".buorg {position:absolute;z-index:111111;\
//width:100%; top:0px; left:0px; \
//border-bottom:1px solid #A29330; \
//background:#FDF2AB no-repeat 10px center url(//browser-update.org/img/dialog-warning.gif);\
//text-align:left; cursor:pointer; \
//font-family: Arial,Helvetica,sans-serif; color:#000; font-size: 15px;}\
//.buorg div { padding:5px 36px 5px 40px; } \
//.buorg a,.buorg a:visited  {color:#E25600; text-decoration: underline;}\
//#buorgclose { position: absolute; right: .5em; top:.2em; height: 20px; width: 12px; font-weight: bold;font-size:14px; padding:0; }"
//        },    
//        {i:5,mt:true,t:".buorg {position:absolute;z-index:111111;\
//width:100%; top:0px; left:0px; \
//border-bottom:1px solid #A29330; \
//background:#FDF2AB; \
//text-align:left; cursor:pointer; \
//font-family: Arial,Helvetica,sans-serif; color:#000; font-size: 15px;}\
//.buorg div { padding:7px 37px 7px 14px; } \
//.buorg a,.buorg a:visited  {color:#E25600; text-decoration: underline;}\
//#buorgclose { position: absolute; right: .5em; top:.2em; height: 20px; width: 12px; font-weight: bold;font-size:14px; padding:0; }"
//        },
{i:6,t:".buorg {position:fixed;z-index:111111;\
width:100%; bottom:0px; left:0px; \
border-top:1px solid #A29330; \
background:#FDF2AB no-repeat 10px center url(//browser-update.org/img/dialog-warning.gif);\
text-align:left; cursor:pointer; \
font-family: Arial,Helvetica,sans-serif; color:#000; font-size: 12px;}\
.buorg div { padding:5px 36px 5px 40px; } \
.buorg a,.buorg a:visited  {color:#E25600; text-decoration: underline;}\
#buorgclose { position: absolute; right: .5em; top:.2em; height: 20px; width: 12px; font-weight: bold;font-size:14px; padding:0; }"
        },        
 {i:7,mt:true,t:".buorg {position:absolute;z-index:111111;\
width:100%; top:0px; left:0px; \
border-bottom:1px solid #000; \
background:#ffc300 no-repeat none;\
text-align:left; cursor:pointer; \
font-family: Arial,Helvetica,sans-serif; color:#000; font-size: 16px;}\
.buorg div { padding:5px 36px 5px 40px; } \
.buorg a,.buorg a:visited  {color:#E25600; text-decoration: underline;}\
#buorgclose { position: absolute; right: .5em; top:.2em; height: 20px; width: 12px; font-weight: bold;font-size:14px; padding:0; }"
        },        
    {i:8,mt:true,t:".buorg {position:absolute;z-index:111111;\
width:100%; top:0px; left:0px; \
border-bottom:1px solid #A29330; \
background:#FDF2AB no-repeat 10px center url(//browser-update.org/img/small/"+this.op.browser.n+".gif);\
text-align:left; cursor:pointer; \
font-family: Arial,Helvetica,sans-serif; color:#000; font-size: 12px;}\
.buorg div { padding:5px 36px 5px 40px; } \
.buorg a,.buorg a:visited  {color:#E25600; text-decoration: underline;}\
#buorgclose { position: absolute; right: .5em; top:.2em; height: 20px; width: 12px; font-weight: bold;font-size:14px; padding:0; }"
        },        
    {i:9,mt:true,t:".buorg {position:fixed;z-index:111111;\
width:100%; top:0px; left:0px; \
border-bottom:1px solid #A29330; \
background:#FDF2AB no-repeat 10px center url(//browser-update.org/img/small/"+this.op.browser.n+".gif);\
text-align:left; cursor:pointer; \
font-family: Arial,Helvetica,sans-serif; color:#000; font-size: 12px;}\
.buorg div { padding:5px 36px 5px 35px; } \
.buorg a,.buorg a:visited  {color:#E25600; text-decoration: underline;}\
#buorgclose { position: absolute; right: .5em; top:.2em; height: 20px; width: 12px; font-weight: bold;font-size:14px; padding:0; }"
        }  
];


var srnd=Math.floor(Math.random()*(styles.length));
var trnd=Math.floor(Math.random()*(texts.length));
var t=texts[trnd].t;
var style=styles[srnd].t;
var jsv=jsv+texts[trnd].i*100+styles[srnd].i;


this.op.url= op.url||"http://browser-update.org/update-browser.html#"+jsv+"@"+(location.hostname||"x");
if (languages.indexOf(ll)===false)
    this.op.url="http://browser-update.org/update.html#"+jsv+"@"+(location.hostname||"x");

this.op.text=busprintf(t,this.op.browser.t,' href="'+this.op.url+'"'+tar);

var div = document.createElement("div");
this.op.div = div;
div.id="buorg";
div.className="buorg";
div.innerHTML= '<div>' + this.op.text + '<div id="buorgclose">x</div></div>';

var sheet = document.createElement("style");
//sheet.setAttribute("type", "text/css");
document.getElementsByTagName("head")[0].appendChild(sheet);

document.body.insertBefore(div,document.body.firstChild);
try {
    sheet.innerText=style;
    sheet.innerHTML=style;
}
catch(e) {
    try {
        sheet.styleSheet.cssText=style;
    }
    catch(e) {
        return;
    }
}

if (!this.op.test) {
    var i = new Image();
  //DISABLED TEMPORARYLY
    i.src="//browser-update.org/viewcount.php?n="+this.op.browser.n+"&v="+this.op.browser.v + "&p="+ escape(location.hostname) + "&jsv="+jsv+"&vs="+myvs.i+","+myvs.f+","+myvs.o+","+myvs.s;
}

var me=this;
div.onclick=function(){
    if (me.op.newwindow)
        window.open(me.op.url,"_blank");
    else
        window.location.href=me.op.url;
    me.op.onclick(me.op);
    return false;
};
div.getElementsByTagName("a")[0].onclick = function(e) {
    var e = e || window.event;
    if (e.stopPropagation) e.stopPropagation();
    else e.cancelBubble = true;
    me.op.onclick(me.op);
    return true;
};

if(styles[srnd].mt) {
    this.op.bodymt = document.body.style.marginTop;
    document.body.style.marginTop = (div.clientHeight)+"px";
}
document.getElementById("buorgclose").onclick = function(e) {
    var e = e || window.event;
    if (e.stopPropagation) e.stopPropagation();
    else e.cancelBubble = true;
    me.op.div.style.display="none";
    if(styles[srnd].mt)
        document.body.style.marginTop = me.op.bodymt;
    return true;
};
op.onshow(this.op);

};

var $buoop = $buoop||{};
$bu=$buo($buoop);