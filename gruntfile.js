'use strict';

var config = require('./config/config');

module.exports = function(grunt) {
    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            js: {
                files: ['gruntfile.js', 'server.js', 'app/**/*.js', 'public/js/**.js', '!public/js/**min.js', '!public/js/db.js', 'test/**/*.js', '!test/coverage/**/*.js'],
                tasks: ['jshint'],
                options: {
                    livereload: true
                }
            },
            css: {
                files: ['public/css/**.css', '!public/css/**.min.css'],
                tasks: ['cssmin'],
                options: {
                    livereload: true
                }
            },
            stylus: {
                files: ['public/stylus/**.styl'],
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
                    compress: false
                },
                files: [{
                    expand: true,
                    cwd: 'public/stylus/',
                    src: '*.styl',
                    dest: 'public/css/',
                    ext: '.css'
                }]
            }
        },
        concat: {
            css: {
                src: [
                    'public/lib/smalot-bootstrap-datetimepicker/css/bootstrap-datetimepicker.css',
                    'public/lib/alertify.js/themes/alertify.bootstrap.css',
                    'public/lib/alertify.js/themes/alertify.core.css',
                    'public/lib/alertify.js/themes/alertify.default.css'
                ],
                dest: 'public/css/library.css'
            },
            js: {
                src: [
                    'public/lib/jquery/dist/jquery.js',
                    'public/lib/angular/angular.js',
                    'public/lib/angular-route/angular-route.js',
                    'public/lib/moment/min/moment.js',
                    'public/lib/bootstrap/dist/js/bootstrap.js',
                    'public/lib/smalot-bootstrap-datetimepicker/js/bootstrap-datetimepicker.js',
                    'public/lib/angular-translate/angular-translate.min.js',
                    'public/lib/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
                    'public/lib/angular-bootstrap/ui-bootstrap.js',
                    'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
                    'public/lib/alertify.js/lib/alertify.min.js'
                ],
                dest: 'public/js/library.js'
            }
        },
        uglify: {
            options: {
                mangle: false,
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                sourceMap: true,
                sourceMapName: 'public/js/library.min.js.map'
            },
            my_target: {
                files: [{
                    expand: true,
                    cwd: 'public/js/',
                    src: 'library.js',
                    dest: 'public/js/',
                    ext: '.min.js'
                }]
            }
        },
        cssmin: {
            minify: {
                expand: true,
                cwd: 'public/css/',
                src: ['library.css', 'donler.css'],
                dest: 'public/css/',
                ext: '.min.css'
            }
        },
        nodemon: {
            dev: {
                script: 'server.js',
                options: {
                    args: [],
                    ignore: ['public/**'],
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
        },
        karma: {
            unit: {
                configFile: 'test/karma/karma.conf.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    require('load-grunt-tasks')(grunt);

    //Making grunt default to force in order not to break the project.
    grunt.option('force', true);

    //Default task(s).

    grunt.registerTask('default', ['jshint', 'stylus', 'concat', 'uglify', 'cssmin', 'concurrent']);

    //Test task.
    grunt.registerTask('test', ['env:test', 'mochaTest', 'karma:unit']);
};
