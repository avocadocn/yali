'use strict';

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  var createRequireJSOptions = function(isProduct) {
    var opts = {
      mainConfigFile: 'src/main.js',
      out: '../public/company_client/js/donler.js',
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
    };

    if (isProduct) {
      opts.generateSourceMaps = false;
    }

    return opts;
  };

  grunt.initConfig({
    watch: {
      jade: {
        files: ['src/**/*.jade'],
        tasks: ['jade']
      },
      js: {
        files: ['src/**/*.js', '!src/login.js'],
        tasks: ['requirejs']
      },
      loginJs: {
        files: ['src/login.js'],
        tasks: ['copy:loginJs']
      },
      stylus: {
        files: ['src/view_stylus/*.styl', 'src/donler.styl', 'src/**/*.styl'],
        tasks: ['stylus', 'concat:css']
      },
      loginStylus: {
        files: ['src/login.styl'],
        tasks: ['stylus', 'concat:loginCss']
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
          src: ['**/*.jade', '!index.jade', '!login.jade'],
          dest: 'templates/',
          ext: '.html'
        }, {
          'index.html': 'src/index.jade',
          'login.html': 'src/login.jade'
        }]
      }
    },
    requirejs: {
      compile: {
        options: createRequireJSOptions()
      },
      publish: {
        options: createRequireJSOptions(true)
      }
    },
    stylus: {
      compile: {
        options: {
          urlfunc: 'embedurl',
          compress: true,
          cache: false
        },
        files: [
          {'dist/donler.min.css': 'src/donler.styl'},
          {'dist/login.min.css': 'src/login.styl'}
        ]
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
            filter: 'isFile',
            src: ['bower-lib/datatables/media/images/**'],
            dest: '../public/company_client/images/'
          },
          {
            expand: true,
            flatten: true,
            src: ['custom-lib/require.js'],
            dest: '../public/company_client/js/'
          }
        ]
      },
      loginJs: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['src/login.js'],
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
          'bower-lib/datatables/media/css/jquery.dataTables.min.css',
          'dist/donler.min.css'
        ],
        dest: '../public/company_client/css/donler.min.css'
      },
      loginCss: {
        src: [
          'bower-lib/bootstrap/dist/css/bootstrap.min.css',
          'bower-lib/admin-lte/dist/css/AdminLTE.min.css',
          'bower-lib/admin-lte/dist/css/skins/skin-blue.min.css',
          'dist/login.min.css'
        ],
        dest: '../public/company_client/css/login.min.css'
      }
    }
  });

  grunt.registerTask('default', ['compile', 'develop']);
  grunt.registerTask('develop', ['watch']);
  grunt.registerTask('compile', ['jade', 'stylus', 'requirejs:compile', 'copy', 'concat']);
  grunt.registerTask('publish', ['jade', 'stylus', 'requirejs:publish', 'copy', 'concat']);
};



