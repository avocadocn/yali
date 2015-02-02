'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    watch: {
      jade: {
        files: ['src/**/*.jade'],
        tasks: ['jade']
      },
      js: {
        files: ['src/**/*.js'],
        tasks: ['requirejs']
      }
    },
    jade: {
      compile: {
        options: {
          data: {
            debug: false
          }
        },
        files: [{
          expand: true,
          cwd: 'src',
          src: ['**/*.jade', '!index.jade'],
          dest: 'templates/',
          ext: '.html'
        }, {
          src: 'src/index.jade',
          dest: 'index.html'
        }]
      }
    },
    requirejs: {
      compile: {
        options: {
          name: 'main',
          mainConfigFile: 'src/main.js',
          out: 'dist/donler.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask('default', ['jade', 'requirejs', 'watch']);

};



