
requirejs.config({
  paths: {
    angular: '../bower-lib/angular/angular',
    uiRouter: '../bower-lib/angular-ui-router/release/angular-ui-router'
  },
  shim: {
    angular: {
      exports: 'angular'
    },
    uiRouter: {
      deps: ['angular']
    }
  },
  deps: ['./bootstrap'],
  urlArgs: ''
});