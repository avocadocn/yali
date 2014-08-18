'use strict';

module.exports = function() {
  return {
    basePath: '../../',
    frameworks: ['mocha'],
    reporters: ['progress','junit','coverage'],
    // reporters: ['progress'],
    browsers: ['Chrome'],
    autoWatch: true,
    captureTimeout: 60000,
    port: 9876,

    // these are default values anyway
    singleRun: false,
    colors: true,

    files: [
      //3rd Party Code
      //mainly contains angular
      // 'public/lib/angular/angular.js',
      'public/lib/angular-route/angular-route.js',
      'public/lib/angular-mocks/angular-mocks.js',
      'public/lib/angular-cookies/angular-cookies.js',
      // 'public/lib/angular-resource/angular-resource.js',
      'public/lib/angular-ui-router/release/angular-ui-router.js',
      'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
      'public/lib/angular-bootstrap/ui-bootstrap.js',
      'public/lib/jquery/jquery.js',
      'public/lib/angular-carousel/src/angular-carousel.js',
      // 'public/lib/requirejs/require.js',
      // 'public/js/library.js',
      // 'node_modules/requirejs/require.js',
      // 'node_modules/*/*.js',
      // 'public/lib/*/*.js',
      
      //'public/'
      //App-Specific Code
      // 'public/*/*.js',
      // 'app/{controllers,routes,services}/*.js',
      

      //test-specific code
      'node_modules/chai/chai.js',
      'test/karma/lib/chai-should.js',
      'test/karma/lib/chai-expect.js'
    ],
    //coverage
    preprocessors: {
      // source files, that you wanna generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul)
      'public/js/controllers/*.js': ['coverage'],
      'public/js/services/*.js': ['coverage']
    },

    junitReporter:{
      outputFile: 'test/test-results.xml',
      suite:''
    }
  }
};