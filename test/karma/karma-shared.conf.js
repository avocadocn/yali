'use strict';

module.exports = function() {
  return {
    basePath: '../../',
    frameworks: ['mocha'],
    reporters: ['progress'],
    browsers: ['Chrome'],
    autoWatch: true,

    // these are default values anyway
    singleRun: false,
    colors: true,

    files: [
      'node_modules/chai/chai.js',
      'test/karma/lib/chai-should.js',
      'test/karma/lib/chai-expect.js'
    ]
  }
};