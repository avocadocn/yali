requirejs.config({
  name: 'main',

  paths: {
    angular: '../../public/lib/angular/angular',
    bindonce: '../../public/lib/angular-bindonce/bindonce',
    uiRouter: '../../public/lib/angular-ui-router/release/angular-ui-router',
    jQuery: '../../public/lib/jquery/dist/jquery',
    cropit: '../../public/lib/cropit/dist/jquery.cropit',
    angularBootstrap: '../../public/lib/angular-bootstrap/ui-bootstrap-tpls',
    qrcode: '../src/utils/qrcode',
    bootstrap: '../../public/lib/bootstrap/dist/js/bootstrap',
    datatables: '../../public/lib/datatables/media/js/jquery.dataTables',
    angulardatatables: '../../public/lib/angular-datatables/dist/angular-datatables',
    datetimepicker: '../../public/lib/smalot-bootstrap-datetimepicker/js/bootstrap-datetimepicker',
    datetimepickerLang: '../../public/lib/smalot-bootstrap-datetimepicker/js/locales/bootstrap-datetimepicker.zh-CN',
    pen: '../../public/lib/pen/src/pen',
    markdown: '../../public/lib/pen/src/markdown',
    moment: '../../public/lib/moment/moment',
    underscore: '../../public/lib/underscore/underscore',
    calendar: '../../public/lib/bootstrap-calendar/js/calendar',
    zhCN: 'utils/zh-CN',
    alertify: '../../public/lib/alertify.js/lib/alertify',
    jsZip: '../src/utils/jszip',
    jsXlsx: '../../public/lib/js-xlsx/dist/xlsx'
  },
  packages: [
    {
      name: 'echarts',
      location: '../../public/lib/echarts/src',
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