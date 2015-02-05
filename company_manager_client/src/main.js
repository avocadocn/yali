
requirejs.config({
  name: 'main',
  out: '../dist/donler.js',
  paths: {
    angular: '../bower-lib/angular/angular',
    uiRouter: '../bower-lib/angular-ui-router/release/angular-ui-router',
    jQuery: '../bower-lib/jquery/dist/jquery',
    cropit: '../bower-lib/cropit/dist/jquery.cropit',
    angularBootstrap:'../bower-lib/angular-bootstrap/ui-bootstrap-tpls'
  },
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
    angularBootstrap :{
      deps: ['angular']
    }
  },
  deps: ['./bootstrap'],
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