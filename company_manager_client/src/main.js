
requirejs.config({
  name: 'main',
  paths: {
    angular: '../bower-lib/angular/angular',
    bindonce: '../bower-lib/angular-bindonce/bindonce',
    uiRouter: '../bower-lib/angular-ui-router/release/angular-ui-router',
    jQuery: '../bower-lib/jquery/dist/jquery',
    cropit: '../bower-lib/cropit/dist/jquery.cropit',
    angularBootstrap:'../bower-lib/angular-bootstrap/ui-bootstrap-tpls',
    qrcode: '../src/utils/qrcode',
    bootstrap: '../bower-lib/bootstrap/dist/js/bootstrap',
    datatables: '../bower-lib/datatables/media/js/jquery.dataTables',
    angulardatatables: '../bower-lib/angular-datatables/dist/angular-datatables',
    datetimepicker: '../bower-lib/smalot-bootstrap-datetimepicker/js/bootstrap-datetimepicker',
    datetimepickerLang: '../bower-lib/smalot-bootstrap-datetimepicker/js/locales/bootstrap-datetimepicker.zh-CN',
    pen: '../bower-lib/pen/src/pen',
    markdown: '../bower-lib/pen/src/markdown',
    moment: '../bower-lib/moment/moment',
    underscore: '../bower-lib/underscore/underscore',
    calendar: '../bower-lib/bootstrap-calendar/js/calendar',
    zhCN: 'utils/zh-CN',
    alertify: '../bower-lib/alertify.js/lib/alertify',
    jsZip:'../src/utils/jszip',
    jsXlsx: '../bower-lib/js-xlsx/dist/xlsx'
  },
  packages: [
    {
      name: 'echarts',
      location: '../bower-lib/echarts/src',
      main: 'echarts'
    },
    {
      name: 'zrender',
      location: '../custom-lib/zrender-2.0.7/src',
      main: 'zrender'
    }
  ],
  shim: {
    angular: {
      exports: 'angular',
      deps: ['jQuery']
    },
    bindonce: {
      exports: 'bindonce'
    },
    uiRouter: {
      deps: ['angular']
    },
    jQuery: {
      exports: 'jQuery'
    },
    cropit: {
      deps: ['jQuery']
    },
    angularBootstrap: {
      deps: ['angular']
    },
    qrcode: {
      deps: ['jQuery']
    },
    bootstrap: {
      deps: ['jQuery']
    },
    datatables: {
      deps: ['jQuery']
    },
    angulardatatables: {
      deps: ['jQuery', 'angular', 'datatables']
    },
    datetimepicker: {
      deps: ['jQuery']
    },
    datetimepickerLang: {
      deps: ['datetimepicker']
    },
    calendar: {
      deps: ['jQuery', 'underscore', 'zhCN']
    },
    // pen: {
    //   exports: 'pen'
    // },
    // markdown: {
    //   deps: ['pen']
    // }
  },
  deps: ['./init']
});