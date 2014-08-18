var sharedConfig = require('./karma-shared.conf');

module.exports = function(config) {
  var conf = sharedConfig();

  conf.files = conf.files.concat([
    //extra testing code
    //'bower_components/angular-mocks/angular-mocks.js',
    //'public/js/app.js',
    ANGULAR_SCENARIO,
    ANGULAR_SCENARIO_ADAPTER,
    'public/js/controllers/tabviewUser.js',
    //mocha stuff
    //'test/mocha.conf.js',

    //test files
    './test/karma/unit/**/*.js'
  ]);

  conf.frameworks = ['jasmine'];
  
  config.set(conf);
};
