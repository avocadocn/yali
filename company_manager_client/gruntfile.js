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
      },
      stylus: {
        files: ['src/**/*.styl'],
        tasks: ['stylus']
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
          src: ['**/*.jade', '!index.jade', '!account/login.jade'],
          dest: 'templates/',
          ext: '.html'
        }, {
          'index.html': 'src/index.jade',
          'login.html': 'src/account/login.jade'
        }]
      }
    },
    requirejs: {
      compile: {
        options: {
          mainConfigFile: 'src/main.js'
        }
      }
    },
    stylus: {
      compile: {
        options: {
          urlfunc: 'embedurl',
          compress: false,
          cache: false
        },
        files: [{
          'dist/donler.css': 'src/donler.styl'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-stylus');

  grunt.registerTask('default', ['product', 'develop']);
  grunt.registerTask('develop', ['watch']);
  grunt.registerTask('product', ['jade', 'stylus', 'requirejs']);

};



