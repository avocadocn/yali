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
        files: ['company_manager_client/src/**/*.jade','app/views/**/*.jade'],
        tasks: ['jade']
      },
      cmc: {
        files: ['company_manager_client/src/**/*.js', '!company_manager_client/src/login.js'],
        tasks: ['requirejs']
      },
      js: {
        files: ['gruntfile.js','public/js/**/*.js'],
        options: {
          livereload: true
        }
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
      },
      publicStylus: {
        files: ['public/stylus/*.styl'],
        tasks: ['stylus']
      },
      signupStylus: {
        files: ['public/stylus/signup.styl'],
        tasks: ['concat:signupCss']
      },
      introduceStylus: {
        files: ['public/stylus/introduce.styl'],
        tasks: ['stylus', 'concat:introduceCss']
      },
      ambassadorStylus: {
        files: ['public/stylus/ambassador.styl'],
        tasks: ['concat:ambassadorCss']
      },
      homeStylus:{
        files: ['public/stylus/home.styl'],
        tasks: ['concat:homeCss']
      },
      introduceJs: {
        files: ['public/js/controllers/introduce.js'],
        tasks: ['concat:introduceJs', 'uglify:introduce']
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
          src: ['**/*.jade'],
          dest: 'company_manager_client/templates/',
          ext: '.html'
        },
        {
          expand: true,
          cwd: 'app/views',
          src: ['**/*.jade'],
          dest: 'templates',
          ext: '.html'
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
          {'company_manager_client/dist/login.min.css': 'company_manager_client/src/login.styl'},
          {'public/css/home.css': 'public/stylus/home.styl'},
          {'public/css/about.min.css': 'public/stylus/about.styl'},
          {'public/css/signup.css': 'public/stylus/signup.styl'},
          {'public/css/ambassador.css': 'public/stylus/ambassador.styl'},
          {'public/css/login.min.css': 'public/stylus/login.styl'},
          {'public/css/introduce.css': 'public/stylus/introduce.styl'}
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
      },
      signupCss: {
        src: [
          'public/css/animate_signup.min.css',
          'public/css/signup.css'
        ],
        dest: 'public/css/signup.min.css'
      },
      introduceCss: {
        src: [
          'public/css/introduce.css',
          'public/swiper/dist/css/swiper.min.css',
          'public/css/ani_intro.min.css'
        ],
        dest: 'public/css/introduce.min.css'
      },
      ambassadorCss:{
        src: [
          'public/css/animate_ambassador.min.css',
          'public/css/ambassador.css'
        ],
        dest: 'public/css/ambassador.min.css'
      },
      homeCss:{
        src: [
          'public/css/animate_ambassador.min.css',
          'public/css/home.css'
        ],
        dest: 'public/css/home.min.css'
      },
      introduceJs: {
        src: [
          'public/lib/jquery/dist/jquery.min.js',
          'public/lib/swiper/dist/js/swiper.jquery.min.js',
          'public/js/dist/swiper.animate.min.js',
          'public/js/controllers/introduce.js'
        ],
        dest: 'public/js/introduce.js'
      }
    },
    uglify: {
      introduce: {
        files: [{
          expand: true,
          cwd: 'public/js/',
          src: ['introduce.js'],
          dest: 'public/js/dist',
          ext: '.min.js'
        }]
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
  grunt.registerTask('compile', ['jade', 'stylus', 'requirejs:compile', 'copy', 'concat', 'uglify']);
  grunt.registerTask('publish', ['jade', 'stylus', 'requirejs:publish', 'copy', 'concat', 'uglify']);

  //Making grunt default to force in order not to break the project.
  grunt.option('force', true);
  grunt.registerTask('hint', ['jshint']);
  //Test task.
  grunt.registerTask('test', ['env:test', 'mochaTest', 'shell:nightwatch']);
};





