
requirejs.config({
  name: 'main',
  out: '../../public/company_client/js/donler.js',
  paths: {
    angular: '../bower-lib/angular/angular',
    uiRouter: '../bower-lib/angular-ui-router/release/angular-ui-router',
    jQuery: '../bower-lib/jquery/dist/jquery',
    cropit: '../bower-lib/cropit/dist/jquery.cropit',
    angularBootstrap:'../bower-lib/angular-bootstrap/ui-bootstrap-tpls',
    qrcode: '../src/utils/qrcode',
    bootstrap: '../bower-lib/bootstrap/dist/js/bootstrap',
    datetimepicker: '../bower-lib/smalot-bootstrap-datetimepicker/js/bootstrap-datetimepicker',
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
      exports: 'angular'
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
    datetimepicker: {
      deps: ['jQuery']
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
  deps: ['./init'],
  urlArgs: '',
  uglify: {
    toplevel: true,
    ascii_only: true,
    beautify: true,
    max_line_length: 1000,

    //How to pass uglifyjs defined symbols for AST symbol replacement,
    //see "defines" options for ast_mangle in the uglifys docs.
    defines: {
      DEBUG: ['name', 'false']
    },

    //Custom value supported by r.js but done differently
    //in uglifyjs directly:
    //Skip the processor.ast_mangle() part of the uglify call (r.js 2.0.5+)
    no_mangle: true
  },
  optimize: 'uglify2',
  generateSourceMaps: true,
  preserveLicenseComments: false
});