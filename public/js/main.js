'use strict';

angular.module('mean.main', ['ngRoute','ui.bootstrap','pascalprecht.translate']);


var app = angular.module('mean.main');

app.config(['$translateProvider',
  function ($translateProvider) {

    //直接内置语言文件
    $translateProvider.translations('zh-cn', {
      I:"我",
      WANT:"要",
      LEAVEMESSAGE:"留言",
      SUBMIT:"提交",
      COMPANY : "公司",
      TEAM : "小队",
      COMPANY_HOME: "公司主页",
      PERSONAL_HOME: "个人主页",
      COMPANY_INFO: "公司资料",
      PERSONAL_INFO: "个人资料",
      CHANGE : "修改",
      AVATAR:"头像",
      LOGOUT: "注销",
      STAFF: "员工",
      TEAM_MEMBER: "队员",
      MEMBER : "成员",
      SCORE : "积分",
      RATE : "排名",
      TYPE : "类型",
      WIN_RATE : "胜率",
      CAMPAIGN : "活动",
      PROVOKE : "挑战",
      ARENA : "擂台",
      STEPONE:"第一步",
      COMPANY_CAMPAIGN : "公司活动",
      SPONSOR_COMPANY_CAMPAIGN : "发起公司活动",
      PERSONAL_CAMPAIGN : "我的活动",
      LATEST_MESSAGE : "最新动态",
      TEAM_CAMPAIGN : "小队活动",
      LIST: "列表",
      SCHEDULE: "日程",
      TEAM_MESSAGE : "小队动态",
      QUIT_GROUP : "退出小队",
      JOIN_GROUP : "加入小队",
      FAMILY : "全家福",
      PERSONAL_MESSAGE : "个人动态",
      TIME_LINE : "活动足迹",
      LOGIN_EMAIL : "登录邮箱",
      REGISTER_DATE : "注册时间",
      ENTERPRISE_INFO : "企业信息",
      OFFICIAL_NAME : "官方用户名",
      ENTERPRISE_FULL_NAME : "企业全称",
      LOCATION : "地点",
      ADDRESS : "地址",
      LINK_MAN : "联系人",
      ENTERPRISE_PHONE : "企业电话",
      PHONE : "手机号码",
      EMAIL : "电子邮箱",
      ACCOUNT : "账号信息",
      BRIEF : "简介",
      TEAM_INFO : "小队信息",
      TEAM_NAME : "队名",
      TEAM_LEADER : "队长",
      APPOINT_LEADER : "任命队长",
      SUM : "人数",
      TIME : "时间",
      THEME: "主题",
      START_TIME : "开始时间",
      END_TIME : "结束时间",
      MAP: "地图",
      WONDERFUL:"精彩",
      PHOTO:"照片",
      DEADLINE : "截止时间",
      LEAST: "最少",
      ENTRY: "报名",
      JOIN : "参加",
      QUIT : "退出",
      LIMIT : "上限",
      SIMPLE : "简单",
      INTRODUCTION: "介绍",
      POSITIVE : "赞成",
      NEGATIVE : "反对",
      OPEN : "打开",
      CLOSE : "关闭",
      CONTENT : "内容",
      EDIT : "编辑",
      DETAIL : "详情",
      POSTER : "发起人",
      SELECTED_TEAM : "我的小队",
      UNSELECTED_TEAM : "未加入小队",
      ALBUM : "相册",
      TEAM_ALBUM : "小队相册",
      CAMPAIGN_ALBUM : "活动相册",
      MANAGER_ALBUM : "管理相册",
      SEARCH : "搜索",
      CONFIRM : "确定",
      CANCEL : "取消",
      INVATE_LINK : "邀请链接",
      INVATE_CODE : "邀请码",
      ACTIVE : "激活",
      CHANGE_LOGO : "修改LOGO",
      TEAM_LOGO : "小队徽章",
      ADD_TEAM : "增加小队",
      INFO : "基本信息",
      HOME_COURT : "主场",
      MAIN_FORCE : "主力",
      ALTERNATIVE : "替补",
      BUILD_TIME: "成立时间",
      COMPETITION_INFO : "比赛信息",
      COMPETITION_SEQ : "比赛场次",
      OWN_COMPANY : "您的公司",
      OWN_TEAM : "您的小队",
      MY : "我的",
      NEW_MESSAGE : "有了新动态",
      OPPOSITE_FOR_TEAM : "对您的小队",
      SPONSOR : "发起",
      COMPETITOR:"对手",
      IMMEDIATE: "马上",
      PROVOKE_ACTIVE : "挑战已经生效",
      FACE : "应战",
      TOWARDS : "对",
      FORMATION : "赛制",
      NICKNAME : "昵称",
      REALNAME : "真实姓名",
      POSITION : "职位",
      GENDER : "性别",
      BIRTHDAY : "生日",
      BLOODTYPE : "血型",
      CONTACT : "联系信息",
      QQ : "QQ",
      MALE : "男",
      FEMALE : "女",
      CAMPAIGN_SELECT : "活动类型",
      REMARK : "备注",
      SELECT : "请选择",
      USERNAME : "用户名",
      DEPARTMENT : "部门",
      DELETE : "删除",
      CREATE : "创建",
      NAME : "名",
      CURRENT: "当前",
      NEW : "新",
      PASSWORD : "密码",
      FORGET : "忘记",
      SIGNIN : "登录",
      SIGNUP : "注册",
      NO_CAMPAIGN : "目前还没有活动",
      L_CHANGE : "语言",
      L_ZH:"中文",
      L_JP:"日语",
      YOU : "您",
      ALREADY : "已经",
      SUCCESS : "成功",
      THIS : "该",
      OTHER :"其他",
      OPTIONAL:"可选",
      OPTION :"选项",
      PLACE :"场所"
    });
    $translateProvider.translations('jp-jp', {
      I:"私",
      WANT:"希望",
      SUBMIT:"提交",
      LEAVEMESSAGE:"メッセージ",
      COMPANY : "会社",
      TEAM : "チーム",
      COMPANY_HOME : "ホームページ",
      PERSONAL_HOME : "ホームページ",
      COMPANY_INFO : "会社概要",
      PERSONAL_INFO : "個人情報",
      CHANGE : "変更",
      AVATAR:"アバター",
      LOGOUT : "キャンセル",
      STAFF : "スタッフ",
      TEAM_MEMBER : "チームメンバー",
      MEMBER : "メンバー",
      SCORE : "統合",
      RATE : "ランク",
      TYPE : "タイプ",
      WIN_RATE : "受賞",
      CAMPAIGN : "アクティビティ",
      PROVOKE : "挑戦",
      ARENA : "グラブの挑戦",
      STEPONE:"第一歩",
      COMPANY_CAMPAIGN : "企業活動",
      SPONSOR_COMPANY_CAMPAIGN : "発起企業活動",
      PERSONAL_CAMPAIGN : "自分のイベント",
      LATEST_MESSAGE : "最新の動態",
      TEAM_CAMPAIGN : "チーム活動",
      LIST: "リスト",
      SCHEDULE: "スケジュール",
      TEAM_MESSAGE : "チーム力学",
      QUIT_GROUP : "出口隊",
      JOIN_GROUP : "チームに入る",
      FAMILY : "家族の肖像画",
      PERSONAL_MESSAGE : "個人的なダイナミック",
      TIME_LINE : "活動の足跡",
      LOGIN_EMAIL : "メールログイン",
      REGISTER_DATE : "登録時",
      ENTERPRISE_INFO : "企業情報",
      OFFICIAL_NAME : "公式名",
      ENTERPRISE_FULL_NAME : "会社名",
      LOCATION : "場所",
      ADDRESS : "アドレス",
      LINK_MAN : "連絡",
      ENTERPRISE_PHONE : "ビジネス用電話機",
      PHONE : "携帯電話番号",
      EMAIL : "メール",
      ACCOUNT : "アカウント情報",
      BRIEF : "簡単な紹介",
      TEAM_INFO : "チーム情報",
      TEAM_NAME : "チーム名",
      TEAM_LEADER : "船長",
      APPOINT_LEADER : "任命船長",
      SUM : "人々の数",
      TIME : "時間",
      THEME: "テーマ",
      START_TIME : "開始時刻",
      END_TIME : "終了時間",
      MAP: "地図",
      WONDERFUL:"素晴らしい",
      PHOTO:"写真",
      DEADLINE : "締め切り",
      ENTRY: "サインアップ",
      LEAST: "最小",
      JOIN : "参加する",
      QUIT : "やめる",
      LIMIT : "キャップ",
      SIMPLE : "簡単",
      INTRODUCTION: "紹介",
      POSITIVE : "承認",
      NEGATIVE : "反対",
      OPEN : "オープン",
      CLOSE : "閉鎖",
      CONTENT : "内容",
      EDIT : "編集",
      DETAIL : "詳細",
      POSTER : "発起人",
      SELECTED_TEAM : "私の小隊",
      UNSELECTED_TEAM : "未加入小隊",
      ALBUM : "アルバム",
      TEAM_ALBUM : "小隊アルバム",
      CAMPAIGN_ALBUM : "活動アルバム",
      MANAGER_ALBUM : "管理のアルバム",
      SEARCH : "検索",
      CONFIRM : "確定",
      CANCEL : "キャンセル",
      INVATE_LINK : "招待リンク",
      INVATE_CODE : "招待コード",
      ACTIVE : "活性化",
      CHANGE_LOGO : "改正ロゴ",
      TEAM_LOGO : "小隊バッジ",
      ADD_TEAM : "増加グループ",
      INFO : "基本情報",
      HOME_COURT : "ホーム",
      MAIN_FORCE : "主力",
      ALTERNATIVE : "補欠",
      BUILD_TIME : "成立時間",
      COMPETITION_INFO : "試合情報",
      COMPETITION_SEQ : "取組",
      OWN_COMPANY : "あなたの会社",
      OWN_TEAM : "あなたの小隊",
      MY : "私の",
      NEW_MESSAGE : "新しい動きがあった",
      OPPOSITE_FOR_TEAM : "あなたの小隊",
      SPONSOR : "発起",
      COMPETITOR:"競技者",
      IMMEDIATE: "すぐに",
      PROVOKE_ACTIVE : "挑戦は発効する",
      FACE : "応戦する",
      TOWARDS : "に",
      FORMATION : "赛制",
      NICKNAME : "ニックネーム",
      REALNAME : "本当の名前",
      POSITION : "ポスト",
      GENDER : "性別",
      BIRTHDAY : "誕生日",
      BLOODTYPE : "血液型",
      CONTACT : "情報を連絡します",
      QQ : "QQ",
      MALE : "男",
      FEMALE : "女",
      CAMPAIGN_SELECT : "イベントタイプ",
      REMARK : "注",
      SELECT : "を選択してください",
      USERNAME : "ユーザー名",
      DEPARTMENT : "部門",
      DELETE : "削除",
      CREATE : "作る",
      NAME : "名前",
      CURRENT: "現在の",
      NEW:"新しい",
      PASSWORD : "パスワード",
      FORGET : "忘れる",
      SIGNIN : "ログイン",
      SIGNUP : "登録",
      NO_CAMPAIGN : "現在まだ活動",
      L_CHANGE : "言語",
      L_ZH :"中国語",
      L_JP :"日本語",
      OTHER :"その他",
      OPTIONAL:"オプショナル",
      OPTION :"オプション",
      PLACE :"場所"
    });

    /*通过文件调用语言文件
    $translateProvider.useStaticFilesLoader({
        prefix : '../../language/locale-',
        suffix : '.json'
    });
    */
    var pre_language;
    switch(window.navigator.appName.toLowerCase()) {
      case "netscape":
        pre_language = window.navigator.language.toLowerCase();
        break;
      case "microsoft.ie":
        pre_language = window.navigator.userLanguage.toLowerCase();
        break;
      default:
        pre_language="zh-cn";
        break;
    }
    $translateProvider.preferredLanguage("zh-cn");
  }
]);

app.run(['$translate','$rootScope', function ($translate,$rootScope) {

    $rootScope.lang_for_msg = [];
    $rootScope.lang_key = 0;

    $rootScope.lang_for_msg.push({
      'lang':"zh-cn",
      'value':{
        'JOIN_CAMPAIGN_SUCCESS' : "您已经成功加入该活动!",
        'QUIT_CAMPAIGN_SUCCESS' : "您已经成功退出该活动!",
        'DATA_ERROR' : "数据发生错误!",
        'ACCOUNT_FAILURE' : "账号获取失败!",
        'MSG_UPDATE_SUCCESS' : '信息修改成功!',
        'EDIT' : '编辑',
        'SAVE' : '保存',
        'THIS' : '该',
        'SIGNUP' : '注册',
        'MAIL' : '邮箱',
        'ALREADY' : '已经',
        'HAVENOT' : '还未',
        'JOIN_TEAM_FAILURE' : '加入小队失败!',
        'QUIT_TEAM_FAILURE' : '退出小队失败!',
        'FETCH_TYPE_FAILURE' : '获取类型失败!',
        'MAIL_EXIST_CHECK' : '正在检查邮箱是否存在...',
        'MAIL_REGEX' : '请输入正确的邮箱地址',
        "OFFICICAL_NAME_EXIST_CHECK" :"请输入正确的企业官方名" ,
        "USERNAME_EXIST_CHECK" : "请输入正确的用户名",
        "OFFICICAL_NAME" : "企业官方名" ,
        "USERNAME" : "用户名",
        'COMPANY' : '企业',
        'SUCCESS' : '成功',
        'FAILURE' : '失败',
        'ACTIVE' : '激活',
        'TEAM' : '小队',
        'CLOSE' : '关闭',
        'JOIN' : '加入',
        'QUIT' : '退出',
        'FETCH' : '获取',
        'TYPE' : '类型',
        'ADD' : '添加',
        'DELETE' : '删除',
        'ERROR' : '错误',
        'INFO' : '信息',
        'SELECT' : '选择'
      }
    })

    $rootScope.languages = [{'language':'L_ZH','key':'zh-cn'},{'language':'L_JP','key':'jp-jp'}];
    $rootScope.changeLanguage = function (langKey) {
        $translate.use(langKey);
        $rootScope.language_key = langKey;
    };
    $rootScope.initAlertCss = function(){
       var body = {
            'border': 'solid 1px #e5e5e5',
            'border-radius': '0px',
            'top' : '50px',
            'left' : '55%',
            'width' : '350px'
        };

        var buttons = {
            'border-top' : '0px',
            'background' : '#fff',
            'text-align' : 'center'
        }

        var button = {
            'margin-left' : '0px',
            'padding' : '6px 15px',
            'box-shadow' : '0px 0px 0px #ffffff',
            'background-color' : '#3498db'
        }

        $(".alertify-buttons").css(buttons);
        $(".alertify").css(body);
        $(".alertify-button").css(button);
    }
    $rootScope.donlerAlert = function(msg) {
      alertify.alert(msg);
      $rootScope.initAlertCss();
    }
}]);
app.filter('dateView', function() {
return function(input) {
  var today = new Date();
  var date = new Date(input);
  if(date.getFullYear()===today.getFullYear()&&date.getMonth()===today.getMonth()){
    if(date.getDate()===today.getDate())
      return '今天' + date.getHours()+':'+date.getMinutes();
    else if(date.getDate()===today.getDate()+1)
      return '明天'+ date.getHours()+':'+date.getMinutes();
  }
    return input;
}
});
app.filter('week', function() {
return function(input) {
// input will be ginger in the usage below
switch(new Date(input).getDay()){
  case 0:
  input = '周日';
  break;
  case 1:
  input = '周一';
  break;
  case 2:
  input = '周二';
  break;
  case 3:
  input = '周三';
  break;
  case 4:
  input = '周四';
  break;
  case 5:
  input = '周五';
  break;
  case 6:
  input = '周六';
  break;
  default:
  input = '';
}
return input;
}
});