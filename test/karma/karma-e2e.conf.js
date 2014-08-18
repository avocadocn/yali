var sharedConfig = require('./karma-shared.conf');

module.exports = function(config) {
  var conf = sharedConfig();

  conf.files = conf.files.concat([
    //test files
    './test/karma/e2e/**/*.js'
  ]);

  conf.proxies = {
    '/': 'http://localhost:3000/'
  };

  conf.urlRoot = '/__karma__/';

  conf.frameworks = ['ng-scenario'];

  //conf.plugins.concat('karma-ng-scenario');
  
  config.set(conf);
};