'use strict';

var config = require('./config/config');

module.exports = function(grunt) {
    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            js: {
                files: ['gruntfile.js', 'server.js', 'app/**/*.js', 'public/js/**.js', '!public/js/**min.js', '!public/js/db.js', 'test/**/*.js', '!test/coverage/**/*.js'],
                //tasks: ['jshint'],
                options: {
                    livereload: true
                }
            },
            css: {
                files: ['public/css/**.css', '!public/css/**.min.css'],
                tasks: ['concat', 'cssmin'],
                options: {
                    livereload: true
                }
            },
            stylus: {
                files: ['public/stylus/**.styl', 'public/mobile/www/css/*.styl'],
                tasks: ['stylus']
            }
        },
        jshint: {
            all: {
                src: ['gruntfile.js', 'server.js', 'app/**/*.js', 'public/js/**.js', '!public/js/**min.js', '!public/js/db.js', 'test/**/*.js', '!test/coverage/**/*.js'],
                options: {
                    jshintrc: true
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
                    expand: true,
                    cwd: 'public/stylus/',
                    src: '*.styl',
                    dest: 'public/css/',
                    ext: '.css'
                }, {
                    expand: true,
                    cwd: 'public/mobile/www/css/',
                    src: '*.styl',
                    dest: 'public/mobile/www/css/',
                    ext: '.css'
                }]
            }
        },
        concat: {
            css: {
                src: [
                    'public/lib/smalot-bootstrap-datetimepicker/css/bootstrap-datetimepicker.css',
                    'public/lib/alertify.js/themes/alertify.core.css',
                    'public/lib/alertify.js/themes/alertify.default.css',
                    'public/lib/angular-carousel/dist/angular-carousel.min.css',
                    'public/lib/bootstrap-calendar/css/calendar.css'
                ],
                dest: 'public/css/library.css'
            },
            cssdonler:{
                src: [
                    'public/css/donler.css',
                    'public/css/timeline.css',
                    'public/css/custom_alertify.css',
                    'public/css/dl_card.css',
                    'public/css/custom_calendar.css',
                    'public/css/group_select.css',
                    'public/css/campaign_list.css',
                    'public/css/tree.css'
                ],
                dest: 'public/css/donlerall.css'
            },
            js: {
                src: [
                    'public/lib/jquery/jquery.js',
                    'public/lib/angular/angular.js',
                    'public/lib/angular-route/angular-route.js',
                    'public/lib/moment/moment.js',
                    'public/lib/moment/lang/zh-cn.js',
                    'public/lib/bootstrap/dist/js/bootstrap.js',
                    'public/lib/angular-translate/angular-translate.min.js',
                    'public/lib/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
                    'public/lib/angular-bootstrap/ui-bootstrap.js',
                    'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
                    'public/lib/alertify.js/lib/alertify.min.js',
                    'public/lib/masonry/dist/masonry.pkgd.min.js',
                    'public/lib/angular-masonry/angular-masonry.js',
                    'public/lib/smalot-bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js',
                    'public/lib/smalot-bootstrap-datetimepicker/js/locales/bootstrap-datetimepicker.zh-CN.js',
                    'public/lib/lazysizes/lazysizes.js',
                    'public/lib/angular-touch/angular-touch.min.js',
                    'public/lib/angular-carousel/dist/angular-carousel.js',
                    'public/lib/angular-file-upload/angular-file-upload.min.js',
                    'public/lib/underscore/underscore.js',
                    'public/js/language/zh-CN.js',
                    'public/lib/bootstrap-calendar/js/calendar.js'
                ],
                dest: 'public/js/library.js'
            },
            jsdonler: {
                src: [
                    'public/js/modules/**/*.js',
                    'public/js/app.js',
                    'public/js/service/**.js',
                    'public/js/controllers/message_header.js',
                    'public/js/dl_card.js'
                ],
                dest: 'public/js/donlerall.js'
            }
        },
        uglify: {
            options: {
                mangle: false,
                banner: '/*! <%= pkg.name %> */\n',
                sourceMap: true,
                sourceMapName: 'public/js/library.min.js.map'
            },
            my_target: {
                files: [{
                    expand: true,
                    cwd: 'public/js/',
                    src: ['library.js', 'donlerall.js'],
                    dest: 'public/js/',
                    ext: '.min.js'
                }]
            }
        },
        cssmin: {
            minify: {
                expand: true,
                cwd: 'public/css/',
                src: ['library.css', 'donlerall.css'],
                dest: 'public/css/',
                ext: '.min.css'
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
                    delayTime: 1,
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

    grunt.loadNpmTasks('grunt-contrib-concat');
    require('load-grunt-tasks')(grunt);

    //Making grunt default to force in order not to break the project.
    grunt.option('force', true);

    //Default task(s).

    grunt.registerTask('default', ['stylus', 'concat', 'uglify', 'cssmin', 'concurrent']);
    grunt.registerTask('hint', ['jshint']);
    //Test task.
    grunt.registerTask('test', ['env:test', 'mochaTest', 'shell:nightwatch']);
};



