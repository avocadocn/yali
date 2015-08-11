'use strict';

var config = require('./config/config');

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  var createRequireJSOptions = function(isProduct) {
    var opts = {
      mainConfigFile: 'company_manager_client/src/main.js',
      out: 'public/company_client/js/donler.js',
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
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      jade: {
        files: ['company_manager_client/src/**/*.jade'],
        tasks: ['jade']
      },
      js: {
        files: ['company_manager_client/src/**/*.js', '!company_manager_client/src/login.js'],
        tasks: ['requirejs']
      },
      loginJs: {
        files: ['company_manager_client/src/login.js'],
        tasks: ['copy:loginJs']
      },
      stylus: {
        files: ['company_manager_client/src/view_stylus/*.styl', 'company_manager_client/src/donler.styl', 'company_manager_client/src/**/*.styl'],
        tasks: ['stylus', 'concat:css']
      },
      loginStylus: {
        files: ['company_manager_client/src/login.styl'],
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
          cwd: 'company_manager_client/src',
          src: ['**/*.jade', '!index.jade', '!login.jade'],
          dest: 'company_manager_client/templates/',
          ext: '.html'
        }, {
          'index.html': 'company_manager_client/src/index.jade',
          'login.html': 'company_manager_client/src/login.jade'
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
          {'company_manager_client/dist/donler.min.css': 'company_manager_client/src/donler.styl'},
          {'company_manager_client/dist/login.min.css': 'company_manager_client/src/login.styl'}
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
              'public/lib/bootstrap/dist/fonts/**',
              'public/lib/font-awesome/fonts/**'
            ],
            dest: 'public/company_client/fonts/'
          },
          {
            expand: true,
            flatten: true,
            filter: 'isFile',
            src: [
              'public/lib/pen/src/font/**'
            ],
            // pen也太特殊了吧。。。
            dest: 'public/company_client/css/font/'
          },
          {
            expand: true,
            flatten: true,
            filter: 'isFile',
            src: ['company_manager_client/src/calendar-template/**'],
            dest: 'public/company_client/calendar-template/'
          },
          {
            expand: true,
            flatten: true,
            filter: 'isFile',
            src: ['public/lib/datatables/media/images/**'],
            dest: 'public/company_client/images/'
          },
          {
            expand: true,
            flatten: true,
            src: ['company_manager_client/custom-lib/require.js'],
            dest: 'public/company_client/js/'
          }
        ]
      },
      loginJs: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['company_manager_client/src/login.js'],
            dest: 'public/company_client/js/'
          }
        ]
      }
    },
    concat: {
      css: {
        src: [
          'public/lib/bootstrap/dist/css/bootstrap.min.css',
          'public/lib/smalot-bootstrap-datetimepicker/css/bootstrap-datetimepicker.min.css',
          'public/lib/pen/src/pen.css',
          'public/lib/font-awesome/css/font-awesome.min.css',
          'public/lib/bootstrap-calendar/css/calendar.min.css',
          'public/lib/admin-lte/dist/css/AdminLTE.min.css',
          'public/lib/admin-lte/dist/css/skins/skin-blue.min.css',
          'public/lib/datatables/media/css/jquery.dataTables.min.css',
          'company_manager_client/dist/donler.min.css'
        ],
        dest: 'public/company_client/css/donler.min.css'
      },
      loginCss: {
        src: [
          'public/lib/bootstrap/dist/css/bootstrap.min.css',
          'public/lib/admin-lte/dist/css/AdminLTE.min.css',
          'public/lib/admin-lte/dist/css/skins/skin-blue.min.css',
          'company_manager_client/dist/login.min.css'
        ],
        dest: 'public/company_client/css/login.min.css'
      }
    },
    nodemon: {
        dev: {
            script: 'server.js',
            options: {
                args: [],
                ignore: ['public/**', 'node_modules/**'],
                ext: 'js,jade',
                nodeArgs: ['--debug'],
                delayTime: 1000,
                env: {
                    PORT: config.port
                },
                cwd: __dirname
            }
        }
    },
    concurrent: {
        tasks: ['nodemon', 'watch'],
        options: {
            logConcurrentOutput: true
        }
    },
    shell: {
        nightwatch: {
            command: 'node node_modules/nightwatch/bin/nightwatch -e default,chrome'
        }
    },
    mochaTest: {
        options: {
            reporter: 'spec',
            require: 'server.js'
        },
        src: ['test/mocha/**/*.js']
    },
    env: {
        test: {
            NODE_ENV: 'test'
        }
    }
    });
    grunt.registerTask('default', ['compile', 'develop']);
    grunt.registerTask('develop', ['concurrent']);
    grunt.registerTask('compile', ['jade', 'stylus', 'requirejs:compile', 'copy', 'concat']);
    grunt.registerTask('publish', ['jade', 'stylus', 'requirejs:publish', 'copy', 'concat']);

    //Making grunt default to force in order not to break the project.
    grunt.option('force', true);
    grunt.registerTask('hint', ['jshint']);
    //Test task.
    grunt.registerTask('test', ['env:test', 'mochaTest', 'shell:nightwatch']);
};





