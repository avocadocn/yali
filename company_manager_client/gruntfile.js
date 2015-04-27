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
        tasks: ['stylus', 'concat']
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
          src: ['**/*.jade', '!index.jade', '!views/login.jade'],
          dest: 'templates/',
          ext: '.html'
        }, {
          'index.html': 'src/index.jade',
          'login.html': 'src/views/login.jade'
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
          compress: true,
          cache: false
        },
        files: [{
          'dist/donler.min.css': 'src/donler.styl'
        }]
      }
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            flatten: true,
            filter: 'isFile',
            src: [
              'bower-lib/bootstrap/dist/fonts/**',
              'bower-lib/font-awesome/fonts/**'
            ],
            dest: '../public/company_client/fonts/'
          },
          {
            expand: true,
            flatten: true,
            filter: 'isFile',
            src: [
              'bower-lib/pen/src/font/**'
            ],
            // pen也太特殊了吧。。。
            dest: '../public/company_client/css/font/'
          },
          {
            expand: true,
            flatten: true,
            filter: 'isFile',
            src: ['src/calendar-template/**'],
            dest: '../public/company_client/calendar-template/'
          },
          {
            expand: true,
            flatten: true,
            src: ['custom-lib/require.js'],
            dest: '../public/company_client/js/'
          }
        ]
      }
    },
    concat: {
      css: {
        src: [
          'bower-lib/bootstrap/dist/css/bootstrap.min.css',
          'bower-lib/smalot-bootstrap-datetimepicker/css/bootstrap-datetimepicker.min.css',
          'bower-lib/pen/src/pen.css',
          'bower-lib/font-awesome/css/font-awesome.min.css',
          'bower-lib/bootstrap-calendar/css/calendar.min.css',
          'bower-lib/admin-lte/dist/css/AdminLTE.min.css',
          'bower-lib/admin-lte/dist/css/skins/skin-blue.min.css',
          'dist/donler.min.css'
        ],
        dest: '../public/company_client/css/donler.min.css'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['product', 'develop']);
  grunt.registerTask('develop', ['watch']);
  grunt.registerTask('product', ['jade', 'stylus', 'requirejs', 'copy', 'concat']);

};



